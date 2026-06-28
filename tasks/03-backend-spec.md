# Backend Spec — Book Booker

## Stack

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.12+ | Lenguaje |
| uv | latest | Package manager |
| FastAPI | latest | Framework web |
| psycopg2 | latest | Driver PostgreSQL |
| PyJWT | latest | JWT tokens |
| pwdlib | latest | Hashing de contraseñas (argon2) |
| python-dotenv | latest | Variables de entorno |
| uvicorn | latest | Servidor ASGI |
| pytest | latest | Testing |

## Inicialización del proyecto

```bash
cd backend
uv init --vcs none
uv add fastapi uvicorn psycopg2-binary pyjwt pwdlib python-dotenv
uv add --dev pytest pytest-env
```

## Estructura de directorios

```
backend/
├── pyproject.toml
├── .env                        # Variables de entorno (no committear)
├── .env.example                # Template de .env
├── init.sql                    # Script de inicialización de DB
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, CORS, lifespan
│   ├── config.py               # Settings desde variables de entorno
│   ├── db.py                   # Conexión PostgreSQL con psycopg2
│   ├── auth.py                 # JWT: crear/verificar token, get_current_user, require_role
│   ├── schemas.py              # Pydantic models (request/response)
│   └── routers/
│       ├── __init__.py
│       ├── auth.py             # POST /auth/login, GET /auth/me
│       ├── users.py            # CRUD /users (admin only)
│       ├── books.py            # CRUD /books
│       └── reservations.py     # Reservar / devolver libros
└── tests/
    ├── __init__.py
    ├── conftest.py             # Fixtures: test client, test DB, auth headers
    ├── test_auth.py
    ├── test_users.py
    ├── test_books.py
    └── test_reservations.py
```

## Configuración (`app/config.py`)

```python
# Variables de entorno requeridas:
# DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES
# Usar python-dotenv para cargar .env
```

## Base de datos (`app/db.py`)

- Función `get_connection()` que retorna una conexión `psycopg2`.
- Usar `connection.autocommit = False` y manejar `commit()`/`rollback()` manualmente.
- Helper `execute_query(query, params=None)` que ejecuta y retorna resultados.
- Helper `execute_insert(query, params)` que ejecuta INSERT y retorna el `RETURNING` row.
- Cerrar cursor y conexión en un bloque `finally`.

## Autenticación (`app/auth.py`)

### OAuth2PasswordBearer

```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
```

### Funciones

| Función | Descripción |
|---------|-------------|
| `hash_password(password: str) -> str` | Hashea con pwdlib (argon2) |
| `verify_password(plain: str, hashed: str) -> bool` | Verifica contraseña |
| `create_access_token(data: dict) -> str` | Crea JWT con expiración, incluye `sub` (username) y `role` en el payload |
| `decode_token(token: str) -> dict` | Decodifica y valida JWT, retorna payload |
| `get_current_user(token: str = Depends(oauth2_scheme)) -> dict` | Extrae y valida usuario desde token |
| `require_role(required_role: str)` | Dependencia que verifica que el usuario tenga el rol requerido |

### Payload del JWT

```json
{
  "sub": "username",
  "role": "admin",
  "exp": 1234567890
}
```

## Schemas Pydantic (`app/schemas.py`)

### Auth
- `LoginRequest(username: str, password: str)`
- `TokenResponse(access_token: str, token_type: str)`
- `UserMeResponse(id: str, username: str, role: str)`

### Users
- `UserCreate(username: str, password: str, role: str = "user")`
- `UserUpdate(username: str | None = None, password: str | None = None, role: str | None = None)`
- `UserResponse(id: str, username: str, role: str, created_at: datetime)`

### Books
- `BookCreate(title: str, author: str, isbn: str)`
- `BookUpdate(title: str | None = None, author: str | None = None, isbn: str | None = None)`
- `BookResponse(id: str, title: str, author: str, isbn: str, available: bool, created_at: datetime)`

### Reservations
- `ReservationCreate(book_id: str)`
- `ReservationResponse(id: str, book_id: str, user_id: str, reserved_at: datetime, returned_at: datetime | None)`
- `ReservationDetailResponse(id: str, book_title: str, book_author: str, reserved_at: datetime, returned_at: datetime | None)`

## Endpoints REST

### Auth Router (`/auth`)

| Método | Ruta | Request Body | Response | Códigos | Auth |
|--------|------|-------------|----------|---------|------|
| POST | `/auth/login` | `LoginRequest` | `TokenResponse` | 200, 401 | No |
| GET | `/auth/me` | — | `UserMeResponse` | 200, 401 | Bearer |

### Users Router (`/users`) — Admin only

| Método | Ruta | Request Body | Response | Códigos | Auth |
|--------|------|-------------|----------|---------|------|
| GET | `/users` | — | `list[UserResponse]` | 200 | Admin |
| POST | `/users` | `UserCreate` | `UserResponse` | 201, 409 | Admin |
| GET | `/users/{user_id}` | — | `UserResponse` | 200, 404 | Admin |
| PUT | `/users/{user_id}` | `UserUpdate` | `UserResponse` | 200, 404 | Admin |
| DELETE | `/users/{user_id}` | — | 204 | 204, 404 | Admin |

### Books Router (`/books`)

| Método | Ruta | Request Body | Response | Códigos | Auth |
|--------|------|-------------|----------|---------|------|
| GET | `/books` | — | `list[BookResponse]` | 200 | Bearer |
| POST | `/books` | `BookCreate` | `BookResponse` | 201, 409 | Admin |
| GET | `/books/{book_id}` | — | `BookResponse` | 200, 404 | Bearer |
| PUT | `/books/{book_id}` | `BookUpdate` | `BookResponse` | 200, 404 | Admin |
| DELETE | `/books/{book_id}` | — | 204 | 204, 404 | Admin |

### Reservations Router (`/reservations`)

| Método | Ruta | Request Body | Response | Códigos | Auth |
|--------|------|-------------|----------|---------|------|
| POST | `/reservations` | `ReservationCreate` | `ReservationResponse` | 201, 400, 404 | User |
| GET | `/reservations/me` | — | `list[ReservationDetailResponse]` | 200 | User |
| GET | `/reservations` | — | `list[ReservationDetailResponse]` | 200 | Admin |
| PATCH | `/reservations/{reservation_id}/return` | — | `ReservationDetailResponse` | 200, 404, 409 | User |

## Reglas de negocio

### Reservar libro
1. Verificar que el libro existe y está disponible (`available = TRUE`).
2. Verificar que el usuario no tiene una reserva activa del mismo libro.
3. Usar una transacción: marcar libro como `available = FALSE` y crear reserva.
4. Si falla cualquier paso, hacer rollback.

### Devolver libro
1. Verificar que la reserva existe, pertenece al usuario autenticado y no ha sido devuelta.
2. Actualizar `returned_at` de la reserva.
3. Marcar libro como `available = TRUE`.

## Manejadores de error

| Situación | Código | Detail |
|-----------|--------|--------|
| Credenciales inválidas | 401 | "Invalid username or password" |
| Token expirado/inválido | 401 | "Could not validate credentials" |
| Permiso insuficiente | 403 | "Not enough permissions" |
| Recurso no encontrado | 404 | "{Resource} not found" |
| Conflicto (username duplicado) | 409 | "Username already exists" |
| Conflicto (ISBN duplicado) | 409 | "ISBN already exists" |
| Libro no disponible | 400 | "Book is not available" |
| Reserva ya devuelta | 409 | "Reservation already returned" |

## Tests

### Configuración (`conftest.py`)
- Usar `TestClient` de FastAPI.
- Crear una base de datos de prueba separada (o usar SQLite en memoria con psycopg2).
- Fixtures: `client`, `admin_token`, `user_token`, `test_book`, `test_reservation`.

### Test cases mínimos

#### `test_auth.py`
- `test_login_success` — credenciales válidas → 200 + token
- `test_login_invalid_password` — contraseña incorrecta → 401
- `test_login_nonexistent_user` — usuario no existe → 401
- `test_me_authenticated` — token válido → 200 + datos usuario
- `test_me_no_token` — sin token → 401

#### `test_users.py`
- `test_create_user` — admin crea usuario → 201
- `test_create_duplicate_username` → 409
- `test_list_users` → 200 + lista
- `test_get_user` → 200
- `test_get_nonexistent_user` → 404
- `test_update_user` → 200
- `test_delete_user` → 204
- `test_non_admin_cannot_create` → 403

#### `test_books.py`
- `test_create_book` → 201
- `test_list_books` → 200
- `test_get_book` → 200
- `test_update_book` → 200
- `test_delete_book` → 204
- `test_non_admin_cannot_create` → 403
- `test_user_can_list` → 200

#### `test_reservations.py`
- `test_reserve_book` → 201
- `test_reserve_unavailable_book` → 400
- `test_return_book` → 200
- `test_return_already_returned` → 409
- `test_return_other_users_reservation` → 404
- `test_list_my_reservations` → 200
- `test_admin_list_all` → 200

## Ejecución

```bash
# Desarrollo
cd backend
uv run uvicorn app.main:app --reload

# Tests
uv run pytest tests/ -v --tb=short
```
