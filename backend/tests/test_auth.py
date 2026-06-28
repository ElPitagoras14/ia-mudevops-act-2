def test_login_success(client):
    response = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client):
    response = client.post("/auth/login", json={"username": "admin", "password": "wrong"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


def test_login_nonexistent_user(client):
    response = client.post("/auth/login", json={"username": "nobody", "password": "pass"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


def test_me_authenticated(client, admin_token):
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "admin"


def test_me_no_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401
