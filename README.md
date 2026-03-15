
# prod-app

# ChatGPT-like Chat Application

Full-stack chat app with file support (text, images, PDF, Excel, Word, audio).

## Features

- **Chat**: Text and file-based Q&A (images, PDF, Excel, Word, audio). No sign-in required.
- **API key**: Configure Groq API key in Settings (stored in browser)
- **Deploy**: GitHub Actions CI/CD → Azure Container Registry, Azure Container Apps

## Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Python FastAPI, Groq API (Llama + Whisper for audio), PyPDF2, openpyxl, python-docx
- **Azure**: Container Registry (ACR), Container Apps

## Local development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Set MONGODB_URI and optionally GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
# Set NEXT_PUBLIC_API_URL=http://localhost:8000 in .env.local or leave default
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set your Groq API key in Settings.

### Run with Docker Compose

From the project root, run backend, frontend, and a local MongoDB with one command:

```bash
docker compose up --build
```

- **Backend**: [http://localhost:8000](http://localhost:8000)  
- **Frontend**: [http://localhost:3000](http://localhost:3000)  
- **MongoDB**: local only, port 27017 (data in volume `mongodb_data`).

The frontend is built with `NEXT_PUBLIC_API_URL=http://localhost:8000` so the browser talks to the backend. Get a Groq API key at [console.groq.com](https://console.groq.com).

## Production (Azure)

### 1. One-time Azure setup (from your machine)

```bash
# Azure CLI installed and logged in: az login
chmod +x scripts/azure-setup.sh
./scripts/azure-setup.sh
```

This creates: **Resource group**, **Azure Container Registry (ACR)**, Log Analytics workspace, **Container Apps environment**, **Backend** and **Frontend** container apps (placeholder images until first deploy). See [scripts/README-AZURE-SETUP.md](scripts/README-AZURE-SETUP.md) for details.

### 2. GitHub

- Push this repo to GitHub.
- **Secrets**: `AZURE_CREDENTIALS` = JSON with keys `clientId`, `clientSecret`, `tenantId`, `subscriptionId` (see scripts/README-AZURE-SETUP.md).
- **Variables**: `ACR_LOGIN_SERVER`, `BACKEND_URL` (from setup script output), and optionally `AZURE_RESOURCE_GROUP`, `CONTAINER_APP_BACKEND`, `CONTAINER_APP_FRONTEND`, `PROJECT_NAME`.

### 3. Deploy

On every push to `main`/`master`, GitHub Actions builds both images, pushes to ACR, and updates both Container Apps. App URLs: **Frontend** and **Backend** FQDNs from setup script output or Azure Portal.

## Project layout

```
├── docker-compose.yml   # Local: backend + frontend + MongoDB
├── frontend/            # Next.js app
├── backend/             # FastAPI app
├── scripts/
│   ├── azure-setup.sh   # One-time Azure infra (ACR, Container Apps)
│   └── README-AZURE-SETUP.md
├── .github/workflows/deploy.yml
└── prompt.md
```

## Prompts

All product prompts are saved in [prompt.md](prompt.md).
