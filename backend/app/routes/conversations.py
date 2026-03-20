from typing import Annotated
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from app.auth import CurrentUser, get_current_user
from app.database import conversations_collection, messages_collection

router = APIRouter()


@router.get("")
def list_conversations(current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    cursor = conversations_collection.find({"user_id": current_user.id}).sort("updated_at", -1)
    items = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        items.append(doc)
    return {"conversations": items}


@router.get("/{conversation_id}/messages")
def get_messages(conversation_id: str, current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    try:
        oid = ObjectId(conversation_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation id")
    conv = conversations_collection.find_one({"_id": oid})
    if not conv or conv.get("user_id") != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = list(messages_collection.find({"conversation_id": conversation_id}).sort("created_at", 1))
    for m in messages:
        m["id"] = str(m["_id"])
        del m["_id"]
    return {"messages": messages}


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str, current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    try:
        oid = ObjectId(conversation_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation id")
    conv = conversations_collection.find_one({"_id": oid})
    if not conv or conv.get("user_id") != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages_collection.delete_many({"conversation_id": conversation_id})
    conversations_collection.delete_one({"_id": oid})
    return {"ok": True}
