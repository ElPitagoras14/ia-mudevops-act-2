import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal, Optional


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMeResponse(BaseModel):
    id: str
    username: str
    role: str


class UserCreate(BaseModel):
    username: str
    password: str
    role: Literal["admin", "user"] = "user"


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[Literal["admin", "user"]] = None


class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    created_at: datetime


class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None


class BookResponse(BaseModel):
    id: str
    title: str
    author: str
    isbn: str
    available: bool
    created_at: datetime


class ReservationCreate(BaseModel):
    book_id: uuid.UUID


class ReservationResponse(BaseModel):
    id: str
    book_id: str
    user_id: str
    reserved_at: datetime
    returned_at: Optional[datetime] = None


class ReservationDetailResponse(BaseModel):
    id: str
    book_title: str
    book_author: str
    reserved_at: datetime
    returned_at: Optional[datetime] = None
