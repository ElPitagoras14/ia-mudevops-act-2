from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import hash_password, require_role
from app.db import execute_insert, execute_query
from app.schemas import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])
admin_required = Depends(require_role("admin"))


@router.get("", response_model=list[UserResponse])
def list_users(_: dict = admin_required):
    rows = execute_query(
        "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC"
    )
    return [UserResponse(**row) for row in rows]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, _: dict = admin_required):
    existing = execute_query(
        "SELECT id FROM users WHERE username = %s", (body.username,)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )
    hashed = hash_password(body.password)
    user = execute_insert(
        "INSERT INTO users (username, hashed_password, role) VALUES (%s, %s, %s) RETURNING id, username, role, created_at",
        (body.username, hashed, body.role),
    )
    return UserResponse(**user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, _: dict = admin_required):
    rows = execute_query(
        "SELECT id, username, role, created_at FROM users WHERE id = %s",
        (user_id,),
    )
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserResponse(**rows[0])


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, body: UserUpdate, _: dict = admin_required):
    existing = execute_query(
        "SELECT id, username, role, created_at FROM users WHERE id = %s",
        (user_id,),
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    fields = {}
    if body.username is not None:
        fields["username"] = body.username
    if body.password is not None:
        fields["hashed_password"] = hash_password(body.password)
    if body.role is not None:
        fields["role"] = body.role
    if not fields:
        return UserResponse(**existing[0])
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [user_id]
    user = execute_insert(
        f"UPDATE users SET {set_clause} WHERE id = %s RETURNING id, username, role, created_at",
        values,
    )
    return UserResponse(**user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, _: dict = admin_required):
    conn = None
    from app.db import get_connection
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
