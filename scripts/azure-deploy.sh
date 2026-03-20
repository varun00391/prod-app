#!/usr/bin/env bash
# Deploy local code to Azure Container Apps using ACR as a registry.
# This is mainly a "manual deploy" helper; CI/CD (GitHub Actions) can do the same automatically.
#
# Requirements:
# - Azure CLI installed and you are logged in: `az login`
# - Docker installed
#
# Required environment variables:
# - AZURE_RESOURCE_GROUP
# - ACR_LOGIN_SERVER (e.g. chatgptappacr.azurecr.io)
# - CONTAINER_APP_BACKEND
# - CONTAINER_APP_FRONTEND
# - PROJECT_NAME (default: chatgpt-app)
# - BACKEND_URL (required for building the frontend: NEXT_PUBLIC_API_URL)
#
# Optional environment variables:
# - TAG (default: latest)
# - MONGODB_URI (if you want this script to set MongoDB Atlas env/secret automatically)

set -e

AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:?AZURE_RESOURCE_GROUP is required}"
ACR_LOGIN_SERVER="${ACR_LOGIN_SERVER:?ACR_LOGIN_SERVER is required}"
CONTAINER_APP_BACKEND="${CONTAINER_APP_BACKEND:?CONTAINER_APP_BACKEND is required}"
CONTAINER_APP_FRONTEND="${CONTAINER_APP_FRONTEND:?CONTAINER_APP_FRONTEND is required}"
PROJECT_NAME="${PROJECT_NAME:-chatgpt-app}"
BACKEND_URL="${BACKEND_URL:?BACKEND_URL is required (set it to backend container app URL for NEXT_PUBLIC_API_URL)}"
TAG="${TAG:-latest}"

MONGODB_URI="${MONGODB_URI:-}"
MONGODB_SECRET_NAME="mongodb-uri"
MONGODB_DB="${MONGODB_DB:-chatgpt_app}"

SERVER="${ACR_LOGIN_SERVER#https://}"
SERVER="${SERVER#http://}"
ACR_NAME="${SERVER%.azurecr.io}"

echo "Deploying $PROJECT_NAME (tag: $TAG) to Azure Container Apps..."
echo "ACR: $ACR_NAME ($ACR_LOGIN_SERVER)"

echo "--- Login to ACR ---"
az acr login --name "$ACR_NAME"

echo "--- Build and push backend image ---"
docker build \
  -t "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-backend:${TAG}" \
  -t "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-backend:latest" \
  ./backend
docker push "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-backend:${TAG}"
docker push "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-backend:latest"

echo "--- Build and push frontend image ---"
docker build \
  -t "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-frontend:${TAG}" \
  -t "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-frontend:latest" \
  --build-arg NEXT_PUBLIC_API_URL="${BACKEND_URL}" \
  ./frontend
docker push "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-frontend:${TAG}"
docker push "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-frontend:latest"

if [ -n "$MONGODB_URI" ]; then
  echo "--- Configure MongoDB Atlas on backend ---"
  az containerapp secret set \
    --name "$CONTAINER_APP_BACKEND" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --secrets "${MONGODB_SECRET_NAME}=${MONGODB_URI}" \
    --output none
  az containerapp update \
    --name "$CONTAINER_APP_BACKEND" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --set-env-vars "MONGODB_URI=secretref:${MONGODB_SECRET_NAME}" "MONGODB_DB=$MONGODB_DB" \
    --output none
fi

echo "--- Update backend container app image ---"
az containerapp update \
  --name "$CONTAINER_APP_BACKEND" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --image "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-backend:${TAG}" \
  --output none
az containerapp ingress update \
  --name "$CONTAINER_APP_BACKEND" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --target-port 8000 \
  --output none

echo "--- Update frontend container app image ---"
az containerapp update \
  --name "$CONTAINER_APP_FRONTEND" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --image "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-frontend:${TAG}" \
  --output none
az containerapp ingress update \
  --name "$CONTAINER_APP_FRONTEND" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --target-port 3000 \
  --output none

echo "Done."
