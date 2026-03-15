from datetime import datetime, timedelta
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel
from app.config import settings
from app.database import users_collection

security = HTTPBearer(auto_error=False)


class TokenData(BaseModel):
    sub: str  # user_id
    email: str
    role: str
    exp: datetime | None = None


class CurrentUser(BaseModel):
    id: str
    email: str
    role: str


def hash_password(password: str) -> str:
    raw = password.encode("utf-8")[:72]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "email": email, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> TokenData | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return TokenData(sub=payload["sub"], email=payload["email"], role=payload["role"], exp=datetime.fromtimestamp(payload["exp"]))
    except JWTError:
        return None


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)]
) -> CurrentUser:
    if not credentials or credentials.scheme != "Bearer":
        raise HTTPException(status_code=401, detail="Not authenticated")
    data = decode_token(credentials.credentials)
    if not data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = users_collection.find_one({"_id": data.sub})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return CurrentUser(id=str(user["_id"]), email=user["email"], role=user.get("role", "user"))


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)]
) -> CurrentUser | None:
    if not credentials or credentials.scheme != "Bearer":
        return None
    data = decode_token(credentials.credentials)
    if not data:
        return None
    user = users_collection.find_one({"_id": data.sub})
    if not user:
        return None
    return CurrentUser(id=str(user["_id"]), email=user["email"], role=user.get("role", "user"))


async def require_admin(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user
