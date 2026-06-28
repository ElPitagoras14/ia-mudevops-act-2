def test_create_book(client, admin_token):
    response = client.post(
        "/books",
        json={"title": "New Book", "author": "Author", "isbn": "111-1111111111"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Book"
    assert data["available"] is True


def test_list_books(client, admin_token):
    response = client.get("/books", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5


def test_get_book(client, admin_token):
    list_resp = client.get("/books", headers={"Authorization": f"Bearer {admin_token}"})
    book_id = list_resp.json()[0]["id"]
    response = client.get(f"/books/{book_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()["id"] == book_id


def test_update_book(client, admin_token):
    list_resp = client.get("/books", headers={"Authorization": f"Bearer {admin_token}"})
    book_id = list_resp.json()[0]["id"]
    response = client.put(
        f"/books/{book_id}",
        json={"title": "Updated Title"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


def test_delete_book(client, admin_token):
    create_resp = client.post(
        "/books",
        json={"title": "To Delete", "author": "Author", "isbn": "222-2222222222"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    book_id = create_resp.json()["id"]
    response = client.delete(f"/books/{book_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 204


def test_non_admin_cannot_create(client, user_token):
    response = client.post(
        "/books",
        json={"title": "Hacker Book", "author": "Hacker", "isbn": "333-3333333333"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


def test_user_can_list(client, user_token):
    response = client.get("/books", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
