# Azure Setup – Step-by-Step (CLI)

Run from your **local machine** with Azure CLI installed and logged in (`az login`).

## 1. Set variables (optional)

```bash
export RESOURCE_GROUP=chatgpt-app-rg
export LOCATION=eastus
export PROJECT_NAME=chatgpt-app
```

## 2. Run the setup script

From the **project root**:

```bash
chmod +x scripts/azure-setup.sh
./scripts/azure-setup.sh
```

This creates:

- **Resource group** – All resources in one group
- **Azure Container Registry (ACR)** – Stores backend and frontend Docker images (admin user enabled)
- **Log Analytics workspace** – For Container Apps logs
- **Container Apps environment** – Shared environment for both apps
- **Backend container app** – FastAPI on port 8000 (no database; stateless chat)
- **Frontend container app** – Next.js on port 3000, env `NEXT_PUBLIC_API_URL` = backend URL

Backend and frontend start with a placeholder image until the first CI/CD run. After the first push to `main`/`master`, GitHub Actions builds and pushes images to ACR and updates both container apps.

## 3. GitHub Actions (Secrets and variables)

In your GitHub repo: **Settings → Secrets and variables → Actions**.

### Create a service principal (for Azure login)

```bash
az ad sp create-for-rbac --name "github-actions-chatgpt-app" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP> \
  --sdk-auth
```

Use the same `RESOURCE_GROUP` you used in the setup script. Copy the entire JSON output.

### Secrets

- **AZURE_CREDENTIALS** – The JSON from above. The Azure login action expects these key names:
  - `clientId` (if your JSON has `appId`, rename it to `clientId`)
  - `clientSecret` (if your JSON has `password`, rename it to `clientSecret`)
  - `tenantId` (if your JSON has `tenant`, rename it to `tenantId`)
  - `subscriptionId`

  Example:
  ```json
  {
    "clientId": "<paste appId here>",
    "clientSecret": "<paste password here>",
    "tenantId": "<paste tenant here>",
    "subscriptionId": "<paste subscriptionId here>"
  }
  ```
  Paste that entire JSON as the value of the **AZURE_CREDENTIALS** secret.

### Variables (from setup script output)

Add these as **Variables** (not secrets):

- `AZURE_RESOURCE_GROUP` – e.g. `chatgpt-app-rg`
- `ACR_LOGIN_SERVER` – e.g. `chatgptappacr.azurecr.io`
- `CONTAINER_APP_BACKEND` – e.g. `chatgpt-app-backend`
- `CONTAINER_APP_FRONTEND` – e.g. `chatgpt-app-frontend`
- `BACKEND_URL` – e.g. `https://chatgpt-app-backend.xxx.azurecontainerapps.io` (required so the frontend is built with the correct API URL)

## 4. Deploy (CI/CD)

On every push to `main` or `master`, GitHub Actions:

1. Logs in to Azure (using `AZURE_CREDENTIALS`) and ACR
2. Builds and pushes backend and frontend Docker images to ACR
3. Updates the backend and frontend container apps to the new images (new revision)

App URLs (from setup script output or Azure Portal):

- **Frontend:** `https://<frontend-app>.<region>.azurecontainerapps.io`
- **Backend:** `https://<backend-app>.<region>.azurecontainerapps.io`

The frontend is built with `NEXT_PUBLIC_API_URL=$BACKEND_URL`, so the browser calls the backend URL for `/api/*` requests.
