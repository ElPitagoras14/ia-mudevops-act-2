import uuid
import pytest
from pydantic import ValidationError
from app.schemas import (
    LoginRequest,
    UserCreate,
    BookCreate,
    ReservationCreate,
)


def test_login_request_valid():
    req = LoginRequest(username="testuser", password="secret")
    assert req.username == "testuser"
    assert req.password == "secret"


def test_login_request_empty_username():
    with pytest.raises(ValidationError):
        LoginRequest(username="", password="secret")


def test_user_create_valid():
    user = UserCreate(username="newuser", password="pass123")
    assert user.username == "newuser"
    assert user.role == "user"


def test_user_create_invalid_role():
    with pytest.raises(ValidationError):
        UserCreate(username="newuser", password="pass123", role="superadmin")


def test_book_create_valid():
    book = BookCreate(title="Test Book", author="Test Author", isbn="123-4567890123")
    assert book.title == "Test Book"


def test_book_create_missing_field():
    with pytest.raises(ValidationError):
        BookCreate(author="Test Author", isbn="123-4567890123")


def test_reservation_create_valid():
    res = ReservationCreate(book_id=str(uuid.uuid4()))
    assert res.book_id is not None


def test_reservation_create_invalid_uuid():
    with pytest.raises(ValidationError):
        ReservationCreate(book_id="not-a-uuid")
