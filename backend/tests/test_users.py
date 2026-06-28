def test_create_user(client, admin_token):
    response = client.post(
        "/users",
        json={"username": "newuser", "password": "newpass", "role": "user"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["role"] == "user"
    assert "id" in data


def test_create_duplicate_username(client, admin_token):
    client.post(
        "/users",
        json={"username": "dupuser", "password": "pass"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    response = client.post(
        "/users",
        json={"username": "dupuser", "password": "pass"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Username already exists"


def test_list_users(client, admin_token):
    response = client.get("/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_get_user(client, admin_token):
    list_resp = client.get("/users", headers={"Authorization": f"Bearer {admin_token}"})
    user_id = list_resp.json()[0]["id"]
    response = client.get(f"/users/{user_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()["id"] == user_id


def test_get_nonexistent_user(client, admin_token):
    response = client.get(
        "/users/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404


def test_update_user(client, admin_token):
    list_resp = client.get("/users", headers={"Authorization": f"Bearer {admin_token}"})
    user_id = list_resp.json()[0]["id"]
    response = client.put(
        f"/users/{user_id}",
        json={"username": "updateduser"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["username"] == "updateduser"


def test_delete_user(client, admin_token):
    create_resp = client.post(
        "/users",
        json={"username": "todelete", "password": "pass"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    user_id = create_resp.json()["id"]
    response = client.delete(f"/users/{user_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 204


def test_non_admin_cannot_create(client, user_token):
    response = client.post(
        "/users",
        json={"username": "hacker", "password": "pass"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403
