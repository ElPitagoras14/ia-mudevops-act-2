import pytest


def test_reserve_book(client, user_token, test_book):
    response = client.post(
        "/reservations",
        json={"book_id": test_book["id"]},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["book_id"] == test_book["id"]
    assert data["returned_at"] is None


def test_reserve_unavailable_book(client, user_token, test_reservation):
    response = client.post(
        "/reservations",
        json={"book_id": test_reservation["book_id"]},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Book is not available"


def test_return_book(client, user_token, test_reservation):
    response = client.patch(
        f"/reservations/{test_reservation['id']}/return",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200


def test_return_already_returned(client, user_token, test_reservation):
    client.patch(
        f"/reservations/{test_reservation['id']}/return",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    response = client.patch(
        f"/reservations/{test_reservation['id']}/return",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Reservation already returned"


def test_return_other_users_reservation(client, admin_token, test_reservation):
    response = client.patch(
        f"/reservations/{test_reservation['id']}/return",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404


def test_list_my_reservations(client, user_token, test_reservation):
    response = client.get(
        "/reservations/me",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_admin_list_all(client, admin_token, test_reservation):
    response = client.get(
        "/reservations",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_reserve_nonexistent_book(client, user_token):
    response = client.post(
        "/reservations",
        json={"book_id": "00000000-0000-0000-0000-000000000000"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 404


def test_reserve_same_book_twice(client, user_token, test_book):
    client.post(
        "/reservations",
        json={"book_id": test_book["id"]},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    response = client.post(
        "/reservations",
        json={"book_id": test_book["id"]},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400


def test_reserve_multiple_books(client, user_token):
    from app.db import execute_insert
    book1 = execute_insert(
        "INSERT INTO books (title, author, isbn) VALUES (%s, %s, %s) RETURNING id",
        ("Multi Book 1", "Author", "998-9999999901"),
    )
    book2 = execute_insert(
        "INSERT INTO books (title, author, isbn) VALUES (%s, %s, %s) RETURNING id",
        ("Multi Book 2", "Author", "998-9999999902"),
    )
    resp1 = client.post(
        "/reservations",
        json={"book_id": book1["id"]},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert resp1.status_code == 201
    resp2 = client.post(
        "/reservations",
        json={"book_id": book2["id"]},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert resp2.status_code == 201


def test_return_nonexistent_reservation(client, user_token):
    response = client.patch(
        "/reservations/00000000-0000-0000-0000-000000000000/return",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 404


def test_list_my_reservations_empty(client, user_token):
    from app.db import get_connection
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM reservations")
        cursor.execute("UPDATE books SET available = TRUE")
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    response = client.get(
        "/reservations/me",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_admin_list_all_empty(client, admin_token):
    from app.db import get_connection
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM reservations")
        cursor.execute("UPDATE books SET available = TRUE")
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    response = client.get(
        "/reservations",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_unauthenticated_cannot_reserve(client):
    response = client.post(
        "/reservations",
        json={"book_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert response.status_code == 401


def test_unauthenticated_cannot_return(client):
    response = client.patch(
        "/reservations/00000000-0000-0000-0000-000000000000/return",
    )
    assert response.status_code == 401
