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
