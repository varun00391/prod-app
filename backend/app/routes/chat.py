from fastapi import APIRouter, Header, HTTPException
from app.models import ChatRequest
from app.services.groq_service import chat_completion

router = APIRouter()


@router.post("/message")
async def chat(
    request: ChatRequest,
    x_api_key: str | None = Header(None),
):
    api_key = request.api_key or x_api_key
    if not api_key:
        raise HTTPException(status_code=400, detail="Groq API key required (body api_key or header X-API-Key)")

    messages_for_openai = [
        {"role": msg.role, "content": msg.content, "attachments": getattr(msg, "attachments", None) or []}
        for msg in request.messages
    ]
    if not messages_for_openai:
        raise HTTPException(status_code=400, detail="At least one message required")

    try:
        assistant_content = chat_completion(messages_for_openai, api_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="We're unable to process this request right now due to temporary limitations. Please try again in a moment.",
        )

    return {"message": {"role": "assistant", "content": assistant_content}}
