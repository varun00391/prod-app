# Azure Setup – Step-by-Step (CLI)

Run from your **local machine** with Azure CLI installed and logged in (`az login`).

## 1. Set variables

```bash
export RESOURCE_GROUP=chatgpt-app-rg
export LOCATION=eastus
export PROJECT_NAME=chatgpt-app
# Optional: set before running to inject MongoDB into backend
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/dbname"
```

## 2. Run the setup script

From the **project root**:

```bash
chmod +x scripts/azure-setup.sh
./scripts/azure-setup.sh
```

This creates:

- **Resource group** – All resources in one group
- **Azure Container Registry (ACR)** – Stores backend and frontend Docker images (admin user enabled for pull/push)
- **Log Analytics workspace** – For Container Apps logs
- **Container Apps environment** – Shared environment for both apps
- **Backend container app** – FastAPI on port 8000, env `MONGODB_URI` from secret
- **Frontend container app** – Next.js on port 3000, env `NEXT_PUBLIC_API_URL` = backend URL

Backend and frontend start with a placeholder image until the first CI/CD run. After the first push to `main`/`master`, GitHub Actions builds and pushes images to ACR and updates both container apps to use them.

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

- **AZURE_CREDENTIALS** – A **single JSON** secret. The Azure login action expects these exact key names:
  - `clientId` (value = your app’s Application (client) ID)
  - `clientSecret` (value = the service principal password/secret)
  - `tenantId` (value = your Azure AD tenant ID)
  - `subscriptionId` (value = your Azure subscription ID)

  The output of `az ad sp create-for-rbac ... --sdk-auth` may use **appId** and **password** and **tenant** instead. If so, create a new JSON that renames them:

  ```json
  {
    "clientId": "<paste appId here>",
    "clientSecret": "<paste password here>",
    "tenantId": "<paste tenant here>",
    "subscriptionId": "<paste subscriptionId here>"
  }
  ```

  Paste that entire JSON as the value of the **AZURE_CREDENTIALS** secret (no extra spaces or newlines outside the JSON).

- **MONGODB_URI** – (Optional) MongoDB Atlas connection string. If not set here, configure it in the backend container app in Azure Portal (see below).

### Variables (from setup script output)

Add these as **Variables** (not secrets):

- `AZURE_RESOURCE_GROUP` – e.g. `chatgpt-app-rg`
- `ACR_LOGIN_SERVER` – e.g. `chatgptappacr.azurecr.io`
- `CONTAINER_APP_BACKEND` – e.g. `chatgpt-app-backend`
- `CONTAINER_APP_FRONTEND` – e.g. `chatgpt-app-frontend`
- `BACKEND_URL` – e.g. `https://chatgpt-app-backend.xxx.azurecontainerapps.io` (needed so the frontend is built with the correct API URL)

Optional:

- `AZURE_LOCATION` – e.g. `eastus`

## 4. Set MONGODB_URI for the backend (if not in GitHub secret)

If you didn’t set `MONGODB_URI` when running the script or in GitHub:

1. Azure Portal → **Container Apps** → your backend app → **Containers** → **Edit and deploy** → **Environment variables** → add or edit `MONGODB_URI` (or bind secret `mongodb-uri`).
2. Or via CLI:

```bash
az containerapp secret set --name <BACKEND_APP_NAME> --resource-group <RESOURCE_GROUP> \
  --secrets mongodb-uri='<your-mongodb-uri>'
az containerapp update --name <BACKEND_APP_NAME> --resource-group <RESOURCE_GROUP> \
  --set-env-vars 'MONGODB_URI=secretref:mongodb-uri'
```

## 5. Deploy (CI/CD)

On every push to `main` or `master`, GitHub Actions:

1. Logs in to Azure (using `AZURE_CREDENTIALS`) and ACR
2. Builds and pushes backend and frontend Docker images to ACR
3. Updates the backend and frontend container apps to the new images (new revision)

App URLs (from setup script output or Azure Portal):

- **Frontend:** `https://<frontend-app>.<region>.azurecontainerapps.io`
- **Backend:** `https://<backend-app>.<region>.azurecontainerapps.io`

The frontend is built with `NEXT_PUBLIC_API_URL=$BACKEND_URL`, so the browser calls the backend URL for `/api/*` requests.

## Optional: Azure Cache for Redis

If you add Redis later, create Azure Cache for Redis in the same resource group and set the connection string as an env/secret for the backend (e.g. `REDIS_URL`).
