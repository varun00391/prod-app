from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.auth import hash_password, verify_password, create_access_token, get_current_user, CurrentUser
from app.database import users_collection

router = APIRouter()


class RegisterBody(BaseModel):
    email: EmailStr
    password: str


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(body: RegisterBody):
    existing = users_collection.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    is_first = users_collection.count_documents({}) == 0
    doc = {
        "_id": body.email.lower(),
        "email": body.email.lower(),
        "password_hash": hash_password(body.password),
        "role": "admin" if is_first else "user",
        "created_at": __import__("datetime").datetime.utcnow(),
    }
    users_collection.insert_one(doc)
    token = create_access_token(str(doc["_id"]), doc["email"], doc["role"])
    return {"access_token": token, "token_type": "bearer", "user": {"id": str(doc["_id"]), "email": doc["email"], "role": doc["role"]}}


@router.post("/login")
def login(body: LoginBody):
    user = users_collection.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), user["email"], user.get("role", "user"))
    return {"access_token": token, "token_type": "bearer", "user": {"id": str(user["_id"]), "email": user["email"], "role": user.get("role", "user")}}


@router.get("/me")
def me(current_user: CurrentUser = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "role": current_user.role}
