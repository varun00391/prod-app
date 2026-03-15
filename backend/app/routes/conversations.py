from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_conversations():
    return {"conversations": []}


@router.get("/{conversation_id}/messages")
def get_messages(conversation_id: str):
    return {"messages": []}


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str):
    return {"ok": True}
