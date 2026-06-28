from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import (
    create_access_token,
    get_current_user,
    verify_password,
    oauth2_scheme,
)
from app.db import execute_query
from app.schemas import LoginRequest, TokenResponse, UserMeResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    rows = execute_query(
        "SELECT id, username, hashed_password, role FROM users WHERE username = %s",
        (body.username,),
    )
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    user = rows[0]
    if not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserMeResponse)
def me(current_user: dict = Depends(get_current_user)):
    return UserMeResponse(
        id=str(current_user["id"]),
        username=current_user["username"],
        role=current_user["role"],
    )
