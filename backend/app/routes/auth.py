import json
import time

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.auth import hash_password, verify_password, create_access_token, get_current_user, CurrentUser
from app.database import users_collection

router = APIRouter()

DEBUG_LOG_PATH = "/Users/varunnegi/deployment_automation/.cursor/debug-f0b85c.log"


def _agent_log(location: str, message: str, data: dict, hypothesis_id: str) -> None:
    payload = {
        "sessionId": "f0b85c",
        "timestamp": int(time.time() * 1000),
        "location": location,
        "message": message,
        "data": data,
        "hypothesisId": hypothesis_id,
        "runId": "pre-fix",
    }
    line = json.dumps(payload) + "\n"
    try:
        with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception:
        pass
    print(f"AGENT_DBG {line.strip()}", flush=True)


class RegisterBody(BaseModel):
    email: EmailStr
    password: str


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(body: RegisterBody):
    # #region agent log
    _agent_log("auth.py:register", "enter", {"op": "register"}, "H5")
    # #endregion
    try:
        existing = users_collection.find_one({"email": body.email.lower()})
        if existing:
            # #region agent log
            _agent_log("auth.py:register", "email_exists", {}, "H5")
            # #endregion
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
        # #region agent log
        _agent_log("auth.py:register", "insert_ok", {"is_first": is_first}, "H5")
        # #endregion
        token = create_access_token(str(doc["_id"]), doc["email"], doc["role"])
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": str(doc["_id"]), "email": doc["email"], "role": doc["role"]},
        }
    except HTTPException:
        raise
    except Exception as e:
        # #region agent log
        _agent_log(
            "auth.py:register",
            "exception",
            {"exc_type": type(e).__name__, "exc_msg": str(e)[:500]},
            "H5",
        )
        # #endregion
        raise


@router.post("/login")
def login(body: LoginBody):
    # #region agent log
    _agent_log("auth.py:login", "enter", {"op": "login"}, "H5")
    # #endregion
    try:
        user = users_collection.find_one({"email": body.email.lower()})
        if not user or not verify_password(body.password, user["password_hash"]):
            # #region agent log
            _agent_log("auth.py:login", "invalid_creds_or_missing", {"user_found": bool(user)}, "H5")
            # #endregion
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_access_token(str(user["_id"]), user["email"], user.get("role", "user"))
        # #region agent log
        _agent_log("auth.py:login", "ok", {}, "H5")
        # #endregion
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "role": user.get("role", "user"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        # #region agent log
        _agent_log(
            "auth.py:login",
            "exception",
            {"exc_type": type(e).__name__, "exc_msg": str(e)[:500]},
            "H5",
        )
        # #endregion
        raise


@router.get("/me")
def me(current_user: CurrentUser = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "role": current_user.role}
