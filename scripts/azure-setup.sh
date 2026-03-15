#!/usr/bin/env bash
# Azure infrastructure setup for ChatGPT-like app (simple chat, no DB)
# Run from project root. Requires: Azure CLI (az), logged in (az login)

set -e
RESOURCE_GROUP="${RESOURCE_GROUP:-chatgpt-app-rg}"
LOCATION="${LOCATION:-eastus}"
PROJECT_NAME="${PROJECT_NAME:-chatgpt-app}"
# ACR names must be alphanumeric only (no hyphens), 5-50 chars, globally unique
_SUB_ID=$(az account show --query id -o tsv 2>/dev/null | tr -d '-' || true)
if [ -n "$_SUB_ID" ]; then
  ACR_SUFFIX=${_SUB_ID:0:8}
else
  ACR_SUFFIX=$(( RANDOM % 900000 + 100000 ))
fi
ACR_NAME="${ACR_NAME:-$(echo "$PROJECT_NAME" | tr -d '-')acr${ACR_SUFFIX}}"
ENVIRONMENT_NAME="${PROJECT_NAME}-env"
BACKEND_APP_NAME="${PROJECT_NAME}-backend"
FRONTEND_APP_NAME="${PROJECT_NAME}-frontend"

echo "=== Resource Group: $RESOURCE_GROUP, Location: $LOCATION, Project: $PROJECT_NAME ==="

# 1) Resource group
echo "--- Creating resource group ---"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none 2>/dev/null || true

# 2) Azure Container Registry
echo "--- Creating ACR ---"
if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
  echo "ACR '$ACR_NAME' already exists, skipping create."
else
  az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --output none
fi

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer --output tsv)
echo "ACR: $ACR_LOGIN_SERVER"

az acr update --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --admin-enabled true --output none
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query "passwords[0].value" --output tsv)

# 3) Log Analytics workspace (required for Container Apps environment)
echo "--- Creating Log Analytics workspace ---"
LOG_ANALYTICS_NAME="${PROJECT_NAME}-law"
az monitor log-analytics workspace create \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_ANALYTICS_NAME" \
  --location "$LOCATION" \
  --output none 2>/dev/null || true

LOG_ANALYTICS_CUSTOMER_ID=$(az monitor log-analytics workspace show --resource-group "$RESOURCE_GROUP" --workspace-name "$LOG_ANALYTICS_NAME" --query customerId --output tsv)
LOG_ANALYTICS_KEY=$(az monitor log-analytics workspace get-shared-keys --resource-group "$RESOURCE_GROUP" --workspace-name "$LOG_ANALYTICS_NAME" --query primarySharedKey --output tsv)

# 4) Container Apps environment
echo "--- Creating Container Apps environment ---"
if az containerapp env show --name "$ENVIRONMENT_NAME" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
  echo "Container Apps environment '$ENVIRONMENT_NAME' already exists, skipping create."
else
  az containerapp env create \
    --name "$ENVIRONMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --logs-workspace-id "$LOG_ANALYTICS_CUSTOMER_ID" \
    --logs-workspace-key "$LOG_ANALYTICS_KEY" \
    --output none
fi

# 5) Backend container app (no DB; placeholder until first CI push)
BACKEND_IMAGE="${ACR_LOGIN_SERVER}/${PROJECT_NAME}-backend:latest"
PLACEHOLDER_IMAGE="mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"

echo "--- Creating Backend container app ---"
if az containerapp show --name "$BACKEND_APP_NAME" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
  echo "Backend app '$BACKEND_APP_NAME' already exists, skipping create."
else
  az containerapp create \
    --name "$BACKEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENVIRONMENT_NAME" \
    --image "$PLACEHOLDER_IMAGE" \
    --ingress external \
    --target-port 80 \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.25 \
    --memory 0.5Gi \
    --output none
fi

az containerapp update --name "$BACKEND_APP_NAME" --resource-group "$RESOURCE_GROUP" \
  --image "$BACKEND_IMAGE" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --output none 2>/dev/null || true
az containerapp update --name "$BACKEND_APP_NAME" --resource-group "$RESOURCE_GROUP" \
  --ingress external --target-port 8000 \
  --output none 2>/dev/null || true

BACKEND_FQDN=$(az containerapp show --name "$BACKEND_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" --output tsv)
BACKEND_URL="https://${BACKEND_FQDN}"
echo "Backend URL: $BACKEND_URL"

# 6) Frontend container app
FRONTEND_IMAGE="${ACR_LOGIN_SERVER}/${PROJECT_NAME}-frontend:latest"
echo "--- Creating Frontend container app ---"
if az containerapp show --name "$FRONTEND_APP_NAME" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
  echo "Frontend app '$FRONTEND_APP_NAME' already exists, skipping create."
else
  az containerapp create \
    --name "$FRONTEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENVIRONMENT_NAME" \
    --image "$PLACEHOLDER_IMAGE" \
    --ingress external \
    --target-port 80 \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.25 \
    --memory 0.5Gi \
    --env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL" \
    --output none
fi

az containerapp update --name "$FRONTEND_APP_NAME" --resource-group "$RESOURCE_GROUP" \
  --image "$FRONTEND_IMAGE" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --ingress external --target-port 3000 \
  --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL" \
  --output none 2>/dev/null || true

FRONTEND_FQDN=$(az containerapp show --name "$FRONTEND_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" --output tsv)
FRONTEND_URL="https://${FRONTEND_FQDN}"
echo "Frontend URL: $FRONTEND_URL"

# 7) Output for GitHub Actions
echo ""
echo "=== GitHub Actions: set these repo settings (Settings -> Secrets and variables -> Actions) ==="
echo "Secrets:"
echo "  AZURE_CREDENTIALS - JSON with keys: clientId, clientSecret, tenantId, subscriptionId"
echo "    (If 'az ad sp create-for-rbac --sdk-auth' gives appId/password/tenant, use:"
echo "     clientId<-appId, clientSecret<-password, tenantId<-tenant, subscriptionId<-subscriptionId)"
echo "Variables:"
echo "  AZURE_RESOURCE_GROUP=$RESOURCE_GROUP"
echo "  ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER"
echo "  CONTAINER_APP_BACKEND=$BACKEND_APP_NAME"
echo "  CONTAINER_APP_FRONTEND=$FRONTEND_APP_NAME"
echo "  BACKEND_URL=$BACKEND_URL"
echo ""
echo "App URLs (after first image push and deploy):"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  $BACKEND_URL"
