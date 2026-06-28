import time
import pytest
import jwt
from fastapi import HTTPException
from app.auth import hash_password, verify_password, create_access_token, decode_token
from app.config import settings


def test_hash_password_returns_hash():
    hashed = hash_password("testpass")
    assert hashed.startswith("$argon2id$")


def test_verify_password_correct():
    hashed = hash_password("testpass")
    assert verify_password("testpass", hashed) is True


def test_verify_password_incorrect():
    hashed = hash_password("testpass")
    assert verify_password("wrongpass", hashed) is False


def test_create_access_token_contains_sub():
    token = create_access_token({"sub": "testuser", "role": "user"})
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert payload["sub"] == "testuser"


def test_create_access_token_contains_role():
    token = create_access_token({"sub": "testuser", "role": "admin"})
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert payload["role"] == "admin"


def test_create_access_token_expiry():
    token = create_access_token({"sub": "testuser", "role": "user"})
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert payload["exp"] > time.time()


def test_decode_token_valid():
    token = create_access_token({"sub": "testuser", "role": "user"})
    payload = decode_token(token)
    assert payload["sub"] == "testuser"
    assert payload["role"] == "user"


def test_decode_token_expired():
    payload = {"sub": "testuser", "role": "user", "exp": time.time() - 3600}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        decode_token(token)
    assert exc.value.status_code == 401


def test_decode_token_invalid_signature():
    payload = {"sub": "testuser", "role": "user", "exp": time.time() + 3600}
    token = jwt.encode(payload, "different-secret-key", algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        decode_token(token)
    assert exc.value.status_code == 401


def test_decode_token_malformed():
    with pytest.raises(HTTPException) as exc:
        decode_token("not-a-valid-token")
    assert exc.value.status_code == 401
