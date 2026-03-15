from fastapi import APIRouter, Header, HTTPException, Depends
from typing import Annotated
from app.models import ChatRequest, ChatMessage
from app.auth import get_current_user, CurrentUser
from app.services.groq_service import chat_completion
from app.database import conversations_collection, messages_collection
from datetime import datetime
from bson import ObjectId

router = APIRouter()


def _serialize_message(m: dict) -> dict:
    m["id"] = str(m.pop("_id", ""))
    return m


@router.post("/message")
async def chat(
    request: ChatRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
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
        # Auth/config errors (e.g. missing API key) — keep message clear
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        # Do not expose API/network errors to the user
        raise HTTPException(
            status_code=503,
            detail="We're unable to process this request right now due to temporary limitations. Please try again in a moment.",
        )

    conv_id = request.conversation_id
    if not conv_id:
        conv_doc = {
            "title": (request.messages[0].content[:50] + "...") if isinstance(request.messages[0].content, str) else "New chat",
            "user_id": current_user.id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        ins = conversations_collection.insert_one(conv_doc)
        conv_id = str(ins.inserted_id)
    else:
        # Ensure conversation belongs to current user
        existing = conversations_collection.find_one({"_id": ObjectId(conv_id)})
        if not existing or existing.get("user_id") != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")

    last_user = request.messages[-1]
    user_msg_doc = {
        "conversation_id": conv_id,
        "role": "user",
        "content": last_user.content,
        "attachments": getattr(last_user, "attachments", None) or [],
        "created_at": datetime.utcnow(),
    }
    messages_collection.insert_one(user_msg_doc)

    assistant_msg_doc = {
        "conversation_id": conv_id,
        "role": "assistant",
        "content": assistant_content,
        "created_at": datetime.utcnow(),
    }
    messages_collection.insert_one(assistant_msg_doc)

    conversations_collection.update_one(
        {"_id": ObjectId(conv_id)},
        {"$set": {"updated_at": datetime.utcnow()}},
    )

    return {
        "conversation_id": conv_id,
        "message": {"role": "assistant", "content": assistant_content},
    }
