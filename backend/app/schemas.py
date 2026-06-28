from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
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
    role: str = "user"


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None


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
    book_id: str


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
