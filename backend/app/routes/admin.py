from fastapi import APIRouter, Depends, Query
from typing import Annotated
from bson import ObjectId
from app.auth import get_current_user, require_admin, CurrentUser
from app.database import users_collection, conversations_collection, messages_collection

router = APIRouter()


@router.get("/users")
def list_users(admin: Annotated[CurrentUser, Depends(require_admin)]):
    users = []
    for doc in users_collection.find():
        users.append({
            "id": str(doc["_id"]),
            "email": doc["email"],
            "role": doc.get("role", "user"),
            "created_at": doc.get("created_at"),
        })
    return {"users": users}


@router.get("/conversations")
def list_conversations_admin(
    admin: Annotated[CurrentUser, Depends(require_admin)],
    user_id: str | None = Query(None, description="Filter by user id (email)"),
):
    q = {}
    if user_id:
        q["user_id"] = user_id
    cursor = conversations_collection.find(q).sort("updated_at", -1).limit(500)
    items = []
    for doc in cursor:
        uid = doc.get("user_id")
        user = users_collection.find_one({"_id": uid}) if uid else None
        items.append({
            "id": str(doc["_id"]),
            "title": doc.get("title", ""),
            "user_id": uid,
            "user_email": user.get("email", uid) if user else uid,
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
        })
    return {"conversations": items}
