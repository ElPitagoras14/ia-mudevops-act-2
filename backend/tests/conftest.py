import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import get_connection, execute_query
from app.auth import create_access_token, hash_password
from app.config import settings


def run_init_sql():
    conn = get_connection()
    cursor = conn.cursor()
    init_sql_path = Path(__file__).resolve().parent.parent.parent / "database" / "init.sql"
    sql = init_sql_path.read_text(encoding="utf-8")
    try:
        cursor.execute(sql)
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def truncate_tables():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("TRUNCATE TABLE reservations, books, users RESTART IDENTITY CASCADE")
        conn.commit()
    finally:
        cursor.close()
        conn.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    run_init_sql()
    yield
    truncate_tables()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_token():
    return create_access_token({"sub": "admin", "role": "admin"})


@pytest.fixture
def user_token():
    return create_access_token({"sub": "user", "role": "user"})


_book_counter = 0


@pytest.fixture
def test_book():
    from app.db import execute_insert
    global _book_counter
    _book_counter += 1
    unique_isbn = f"999-99999999{_book_counter:02d}"
    book = execute_insert(
        "INSERT INTO books (title, author, isbn) VALUES (%s, %s, %s) RETURNING id, title, author, isbn, available, created_at",
        ("Test Book", "Test Author", unique_isbn),
    )
    return book


@pytest.fixture
def test_reservation(test_book):
    from app.db import execute_insert, get_connection
    rows = execute_query("SELECT id FROM users WHERE username = 'user'")
    user_id = rows[0]["id"]
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE books SET available = FALSE WHERE id = %s", (test_book["id"],))
        cursor.execute(
            "INSERT INTO reservations (user_id, book_id) VALUES (%s, %s) RETURNING id, user_id, book_id, reserved_at, returned_at",
            (user_id, test_book["id"]),
        )
        reservation = cursor.fetchone()
        conn.commit()
        return {"id": str(reservation[0]), "user_id": str(reservation[1]), "book_id": str(reservation[2])}
    finally:
        cursor.close()
        conn.close()
