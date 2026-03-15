# Project Prompts

## Main Product Prompt

Build a particular product where it should behave like ChatGPT where we are going to configure ChatGPT api key and if user is going to ask any kind of question so just like ChatGPT try to answer all the textual based conversations and maybe image based conversations maybe pdf file based, excel file based and audio or video file based questions, word file based questions ,it should be able to answer all kind of things and it should give option to attach a particular file and ask a questions and download that file also and my file should be visible inside chat interface or like image ,pdf or other kind of file what I provide to interface.

Now you have to create this application using next.js and typescript and tailwind css for frontend and python for fast API backend.
You have to store each conversation inside mongodb database and use mongodb atlas for that.

Now I wanted to ship this application to production environment and where I wanted to automate everything so from local system my code should go to GitHub repo then GitHub Actions should deploy to Azure: Azure Container Registry (ACR) for images and Azure Container Apps for serverless containers. So with the help of Azure CLI from my local system I would like to configure each and everything in a step by step manner so I will be able to build this project and do CI/CD and when I push my code to GitHub it should build and my feature should be live in production.

Save each prompt in a prompt.md file.

---

## Summary of Requirements

### Application

- ChatGPT-like UI with configurable Groq API key
- Support: text, images, PDF, Excel, audio, video, Word
- Attach files, ask questions, download files
- Show attached files in chat (preview for images/PDFs etc.)

### Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Python FastAPI
- Database: MongoDB Atlas (conversations)

### Deployment

- GitHub → GitHub Actions → Azure
- Azure: Container Registry (ACR), Container Apps (serverless containers)
- Azure CLI scripts for local setup
- CI/CD: push to GitHub triggers build and production deploy

---

## Implementation Summary

- **prompt.md**: All prompts saved as requested.
- **Frontend**: Next.js + TypeScript + Tailwind; chat UI, file attach (image/PDF/Excel/Word/audio), Groq API key in Settings, conversations sidebar, file preview and download in chat.
- **Backend**: FastAPI; Groq (Llama) chat + vision; PDF/Excel/Word text extraction; MongoDB for conversations and messages. (Audio files are not transcribed; Groq has no Whisper.)
- **Azure**: `scripts/azure-setup.sh` + `scripts/README-AZURE-SETUP.md` for ACR, Container Apps, step-by-step CLI.
- **CI/CD**: `.github/workflows/deploy.yml` builds both images, pushes to ACR, updates Container Apps on push to main/master.

