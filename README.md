# Book Booker

Sistema de gestión de reservas de libros.

## Requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- [pnpm](https://pnpm.io/installation)

## Inicio rápido

### 1. Base de datos

```bash
docker run -d --name book-postgres ^
  -e POSTGRES_USER=book_user ^
  -e POSTGRES_PASSWORD=book_pass ^
  -e POSTGRES_DB=book_booker_test ^
  -p 5432:5432 ^
  postgres:18-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

El frontend corre en `http://localhost:3000` y el backend en `http://localhost:8000`.

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin   | admin123  | Admin |
| user    | user123   | User |

## Tests

### Requisitos previos

- Base de datos PostgreSQL corriendo (ver [Inicio rápido](#1-base-de-datos))
- Variables de entorno configuradas en `backend/.env` (ver `.env.example`)
- Dependencias instaladas en backend y frontend

### Backend

```bash
# 1. Asegúrate de tener las dependencias instaladas
cd backend
uv sync

# 2. Verifica que Docker esté corriendo y PostgreSQL esté levantado
docker run -d --name book-postgres ^
  -e POSTGRES_USER=book_user ^
  -e POSTGRES_PASSWORD=book_pass ^
  -e POSTGRES_DB=book_booker_test ^
  -p 5432:5432 ^
  postgres:18-alpine

# 3. Ejecutar todos los tests
uv run pytest

# 4. Ejecutar con más detalle
uv run pytest tests/ -v --tb=short

# 5. Ejecutar solo tests unitarios
uv run pytest tests/test_auth_unit.py tests/test_schemas_unit.py -v

# 6. Ejecutar solo tests de integración
uv run pytest tests/test_auth.py tests/test_books.py tests/test_users.py tests/test_reservations.py -v
```

El comando `pytest` usa `book_booker_test` como base de datos (configurado en `pyproject.toml` vía `pytest-env`). Los tests de integración ejecutan `database/init.sql` al inicio de la sesión y truncan las tablas al finalizar.

### Frontend

```bash
# 1. Instalar dependencias (solo la primera vez)
cd frontend
pnpm install

# 2. Ejecutar tests unitarios y de componentes (Vitest)
pnpm test

# 3. Ejecutar en modo watch (para desarrollo)
pnpm test:watch

# 4. Ejecutar tests E2E (Playwright) — requiere backend y frontend corriendo
pnpm test:e2e
```

Los tests de frontend usan Vitest + Testing Library con JSDOM. Los archivos de test se encuentran en `frontend/src/test/`.

### Tests E2E (Playwright)

```bash
# 1. Instalar Playwright (solo la primera vez)
cd frontend
npx playwright install chromium

# 2. Asegurar que backend y frontend estén corriendo:
#    Terminal 1: cd backend && uv run uvicorn app.main:app --reload
#    Terminal 2: cd frontend && pnpm run dev

# 3. Ejecutar tests E2E
cd frontend
pnpm test:e2e
```

> **Nota:** Los tests E2E requieren que la base de datos, el backend y el frontend estén ejecutándose simultáneamente. El archivo `playwright.config.ts` ya incluye la configuración de `webServer` para iniciar ambos servidores automáticamente si se desea.

### Estructura de tests

| Capa | Tipo | Framework | Archivos |
|------|------|-----------|----------|
| Backend | Unitarios | pytest | `test_auth_unit.py`, `test_schemas_unit.py` |
| Backend | Integración | pytest + TestClient | `test_auth.py`, `test_books.py`, `test_users.py`, `test_reservations.py` |
| Frontend | Unitarios/Componentes | Vitest + Testing Library | 12 archivos en `frontend/src/test/` |
| Frontend | E2E | Playwright | `frontend/src/test/e2e/` |

## Tasks de VSCode

El proyecto incluye tareas preconfiguradas en `.vscode/tasks.json`:

| Tarea | Descripción |
|-------|-------------|
| `Docker: PostgreSQL up` | Levanta la base de datos |
| `Backend: dev server` | Inicia el servidor de FastAPI |
| `Frontend: dev server` | Inicia el servidor de Vite |
| `Run All` | Ejecuta todo en secuencia |

Abrí las tareas con `Ctrl+Shift+B` (o `Cmd+Shift+B` en macOS).
