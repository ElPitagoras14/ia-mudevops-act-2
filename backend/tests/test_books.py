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


def test_create_book_duplicate_isbn(client, admin_token):
    client.post(
        "/books",
        json={"title": "Original", "author": "Author", "isbn": "000-0000000001"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    response = client.post(
        "/books",
        json={"title": "Duplicate", "author": "Author", "isbn": "000-0000000001"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 409


def test_create_book_missing_fields(client, admin_token):
    response = client.post(
        "/books",
        json={},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422


def test_get_nonexistent_book(client, admin_token):
    response = client.get(
        "/books/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404


def test_get_book_invalid_uuid(client, admin_token):
    response = client.get(
        "/books/not-a-uuid",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422


def test_update_nonexistent_book(client, admin_token):
    response = client.put(
        "/books/00000000-0000-0000-0000-000000000000",
        json={"title": "Nope"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404


def test_update_book_partial(client, admin_token):
    create_resp = client.post(
        "/books",
        json={"title": "Partial", "author": "Author", "isbn": "000-0000000002"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    book_id = create_resp.json()["id"]
    response = client.put(
        f"/books/{book_id}",
        json={"author": "Only Author Changed"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["author"] == "Only Author Changed"
    assert response.json()["title"] == "Partial"


def test_delete_nonexistent_book(client, admin_token):
    response = client.delete(
        "/books/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404


def test_non_admin_cannot_update(client, user_token, test_book):
    response = client.put(
        f"/books/{test_book['id']}",
        json={"title": "Hacked"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


def test_non_admin_cannot_delete(client, user_token, test_book):
    response = client.delete(
        f"/books/{test_book['id']}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


def test_unauthenticated_cannot_access(client):
    response = client.get("/books")
    assert response.status_code == 401


def test_list_books_empty(client, admin_token):
    resp = client.get("/books", headers={"Authorization": f"Bearer {admin_token}"})
    for book in resp.json():
        client.delete(f"/books/{book['id']}", headers={"Authorization": f"Bearer {admin_token}"})
    response = client.get("/books", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json() == []
