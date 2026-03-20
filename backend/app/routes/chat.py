from datetime import datetime
from typing import Annotated
from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException
from app.models import ChatRequest
from app.auth import CurrentUser, get_current_user
from app.database import conversations_collection, messages_collection
from app.services.groq_service import chat_completion

router = APIRouter()


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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="We're unable to process this request right now due to temporary limitations. Please try again in a moment.",
        )

    conv_id = request.conversation_id
    if not conv_id:
        first = request.messages[0].content if request.messages else "New chat"
        title = (first[:50] + "...") if isinstance(first, str) else "New chat"
        conv_doc = {
            "title": title,
            "user_id": current_user.id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        ins = conversations_collection.insert_one(conv_doc)
        conv_id = str(ins.inserted_id)
    else:
        try:
            oid = ObjectId(conv_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid conversation id")
        existing = conversations_collection.find_one({"_id": oid})
        if not existing or existing.get("user_id") != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")

    last_user = request.messages[-1]
    messages_collection.insert_one(
        {
            "conversation_id": conv_id,
            "role": "user",
            "content": last_user.content,
            "attachments": getattr(last_user, "attachments", None) or [],
            "created_at": datetime.utcnow(),
        }
    )
    messages_collection.insert_one(
        {
            "conversation_id": conv_id,
            "role": "assistant",
            "content": assistant_content,
            "attachments": [],
            "created_at": datetime.utcnow(),
        }
    )
    conversations_collection.update_one(
        {"_id": ObjectId(conv_id)},
        {"$set": {"updated_at": datetime.utcnow()}},
    )

    return {
        "conversation_id": conv_id,
        "message": {"role": "assistant", "content": assistant_content},
    }
