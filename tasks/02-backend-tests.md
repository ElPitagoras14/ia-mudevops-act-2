# Backend Tests — Book Booker

Suite completa de tests para el backend FastAPI.

## Librerías

Ya instaladas en `pyproject.toml` (dev dependencies):
- `pytest` >=9.1.1
- `pytest-env` >=1.6.0
- `httpx` >=0.28.1 (para TestClient)

Ejecución:
```bash
cd backend
uv run pytest tests/ -v --tb=short
```

## Tests unitarios

Tests de funciones puras que no requieren base de datos.

### `test_auth_unit.py` — Funciones de autenticación

| Test | Descripción | Happy path | Edge cases |
|------|-------------|------------|------------|
| `test_hash_password_returns_hash` | `hash_password()` retorna un hash válido de argon2 | Verificar que empieza con `$argon2id$` | — |
| `test_verify_password_correct` | `verify_password()` retorna True con contraseña correcta | Hashear y verificar misma contraseña → True | — |
| `test_verify_password_incorrect` | `verify_password()` retorna False con contraseña incorrecta | Hashear y verificar distinta contraseña → False | — |
| `test_create_access_token_contains_sub` | `create_access_token()` incluye `sub` en el payload | Decodificar token y verificar `sub` | — |
| `test_create_access_token_contains_role` | `create_access_token()` incluye `role` en el payload | Decodificar token y verificar `role` | — |
| `test_create_access_token_expiry` | `create_access_token()` setea exp en el futuro | Decodificar y verificar `exp` > now | — |
| `test_decode_token_valid` | `decode_token()` decodifica un token válido | Payload coincide con el original | — |
| `test_decode_token_expired` | `decode_token()` lanza excepción con token expirado | — | Token con `exp` en el pasado → HTTPException 401 |
| `test_decode_token_invalid_signature` | `decode_token()` lanza excepción con firma inválida | — | Token firmado con otra key → HTTPException 401 |
| `test_decode_token_malformed` | `decode_token()` lanza excepción con token malformado | — | String aleatorio → HTTPException 401 |

### `test_schemas_unit.py` — Validación de schemas Pydantic

| Test | Descripción | Happy path | Edge cases |
|------|-------------|------------|------------|
| `test_login_request_valid` | LoginRequest acepta username y password válidos | Campos correctos | — |
| `test_login_request_empty_username` | LoginRequest rechaza username vacío | — | `username: ""` → ValidationError |
| `test_user_create_valid` | UserCreate acepta datos válidos | Campos correctos | — |
| `test_user_create_invalid_role` | UserCreate rechaza rol inválido | — | `role: "superadmin"` → ValidationError |
| `test_book_create_valid` | BookCreate acepta datos válidos | Campos correctos | — |
| `test_book_create_missing_field` | BookCreate rechaza campos faltantes | — | Missing `title` → ValidationError |
| `test_reservation_create_valid` | ReservationCreate acepta book_id válido | UUID válido | — |
| `test_reservation_create_invalid_uuid` | ReservationCreate rechaza UUID inválido | — | `book_id: "not-a-uuid"` → ValidationError |

## Tests de integración

Tests de los endpoints REST usando `TestClient` de FastAPI + base de datos PostgreSQL real (base `book_booker_test`).

Configuración existente en `conftest.py`:
- Fixtures: `client`, `admin_token`, `user_token`, `test_book`, `test_reservation`
- `setup_test_db` (session scope): ejecuta `init.sql` al inicio, trunca tablas al final
- `pytest-env` setea `DB_NAME=book_booker_test`

### `test_auth.py` — Endpoints `/auth/login` y `/auth/me`

| # | Test | Descripción | Código | Auth |
|---|------|-------------|--------|------|
| 1 | `test_login_success` | Login con credenciales correctas | 200 + token | No |
| 2 | `test_login_invalid_password` | Login con contraseña incorrecta | 401 | No |
| 3 | `test_login_nonexistent_user` | Login con usuario inexistente | 401 | No |
| 4 | `test_login_missing_username` | Login sin enviar username | 422 | No |
| 5 | `test_login_missing_password` | Login sin enviar password | 422 | No |
| 6 | `test_me_authenticated` | GET /auth/me con token válido | 200 + datos usuario | Bearer |
| 7 | `test_me_no_token` | GET /auth/me sin token | 401 | No |
| 8 | `test_me_invalid_token` | GET /auth/me con token malformado | 401 | Bearer |
| 9 | `test_me_expired_token` | GET /auth/me con token expirado | 401 | Bearer |

### `test_books.py` — Endpoints `/books`

| # | Test | Descripción | Código | Auth |
|---|------|-------------|--------|------|
| 1 | `test_create_book` | Admin crea libro correctamente | 201 | Admin |
| 2 | `test_create_book_duplicate_isbn` | Admin crea libro con ISBN existente | 409 | Admin |
| 3 | `test_create_book_missing_fields` | Admin crea libro sin campos requeridos | 422 | Admin |
| 4 | `test_list_books` | Listar libros retorna lista | 200 | Bearer |
| 5 | `test_list_books_empty` | Listar libros cuando no hay ninguno (después de truncar) | 200 + [] | Bearer |
| 6 | `test_get_book` | Obtener libro por ID existente | 200 | Bearer |
| 7 | `test_get_nonexistent_book` | Obtener libro con UUID inexistente | 404 | Bearer |
| 8 | `test_get_book_invalid_uuid` | Obtener libro con UUID malformado | 422 | Bearer |
| 9 | `test_update_book` | Admin actualiza libro existente | 200 | Admin |
| 10 | `test_update_nonexistent_book` | Admin actualiza libro inexistente | 404 | Admin |
| 11 | `test_update_book_partial` | Admin actualiza solo un campo del libro | 200 | Admin |
| 12 | `test_delete_book` | Admin elimina libro existente | 204 | Admin |
| 13 | `test_delete_nonexistent_book` | Admin elimina libro inexistente | 404 | Admin |
| 14 | `test_non_admin_cannot_create` | User no puede crear libro | 403 | User |
| 15 | `test_non_admin_cannot_update` | User no puede actualizar libro | 403 | User |
| 16 | `test_non_admin_cannot_delete` | User no puede eliminar libro | 403 | User |
| 17 | `test_user_can_list` | User puede listar libros | 200 | User |
| 18 | `test_unauthenticated_cannot_access` | Usuario sin token no puede acceder | 401 | No |

### `test_users.py` — Endpoints `/users`

| # | Test | Descripción | Código | Auth |
|---|------|-------------|--------|------|
| 1 | `test_create_user` | Admin crea usuario correctamente | 201 | Admin |
| 2 | `test_create_duplicate_username` | Admin crea usuario con username existente | 409 | Admin |
| 3 | `test_create_user_invalid_role` | Admin crea usuario con rol inválido | 422 | Admin |
| 4 | `test_list_users` | Admin lista usuarios | 200 | Admin |
| 5 | `test_get_user` | Admin obtiene usuario por ID | 200 | Admin |
| 6 | `test_get_nonexistent_user` | Admin obtiene usuario inexistente | 404 | Admin |
| 7 | `test_update_user` | Admin actualiza usuario existente | 200 | Admin |
| 8 | `test_update_user_change_password` | Admin actualiza contraseña de usuario | 200 | Admin |
| 9 | `test_update_nonexistent_user` | Admin actualiza usuario inexistente | 404 | Admin |
| 10 | `test_delete_user` | Admin elimina usuario existente | 204 | Admin |
| 11 | `test_delete_nonexistent_user` | Admin elimina usuario inexistente | 404 | Admin |
| 12 | `test_non_admin_cannot_create` | User no puede crear usuario | 403 | User |
| 13 | `test_non_admin_cannot_list` | User no puede listar usuarios | 403 | User |
| 14 | `test_non_admin_cannot_update` | User no puede actualizar usuario | 403 | User |
| 15 | `test_non_admin_cannot_delete` | User no puede eliminar usuario | 403 | User |
| 16 | `test_unauthenticated_cannot_access` | Sin token no puede acceder a /users | 401 | No |

### `test_reservations.py` — Endpoints `/reservations`

| # | Test | Descripción | Código | Auth |
|---|------|-------------|--------|------|
| 1 | `test_reserve_book` | User reserva libro disponible | 201 | User |
| 2 | `test_reserve_unavailable_book` | User reserva libro no disponible | 400 | User |
| 3 | `test_reserve_nonexistent_book` | User reserva libro que no existe | 404 | User |
| 4 | `test_reserve_same_book_twice` | User reserva el mismo libro activo dos veces (duplicado parcial index) | 400/409 | User |
| 5 | `test_reserve_multiple_books` | User puede reservar 2 libros diferentes simultáneamente | 201 | User |
| 6 | `test_return_book` | User devuelve su propia reserva activa | 200 | User |
| 7 | `test_return_already_returned` | User devuelve una reserva ya devuelta | 409 | User |
| 8 | `test_return_nonexistent_reservation` | User devuelve reserva inexistente | 404 | User |
| 9 | `test_return_other_users_reservation` | Admin intenta devolver reserva de otro usuario | 404 | Admin |
| 10 | `test_list_my_reservations` | User lista sus propias reservas | 200 | User |
| 11 | `test_list_my_reservations_empty` | User sin reservas lista vacío | 200 + [] | User |
| 12 | `test_admin_list_all` | Admin lista todas las reservas | 200 | Admin |
| 13 | `test_admin_list_all_empty` | Admin lista cuando no hay reservas | 200 + [] | Admin |
| 14 | `test_unauthenticated_cannot_reserve` | Sin token no puede reservar | 401 | No |
| 15 | `test_unauthenticated_cannot_return` | Sin token no puede devolver | 401 | No |

## Tests de interfaz

No aplica para el backend. Los tests de interfaz (E2E con Playwright) se especifican en `03-frontend-tests.md`.
