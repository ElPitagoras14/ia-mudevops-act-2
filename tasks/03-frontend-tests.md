# Frontend Tests — Book Booker

Suite completa de tests para el frontend React + TanStack Router.

## Librerías

Ya instaladas en `package.json` (dev dependencies):
- `vitest` ^4.1.5
- `jsdom` ^28.1.0
- `@testing-library/react` ^16.3.0
- `@testing-library/dom` ^10.4.1
- `@testing-library/jest-dom` ^6.9.1
- `@testing-library/user-event` ^14.6.1

Instalar Playwright (no está en dependencias actuales):
```bash
cd frontend
pnpm add -D @playwright/test
npx playwright install chromium
```

Ejecución:
```bash
cd frontend
pnpm test          # Vitest (unitarios + integración)
pnpm test:e2e      # Playwright (interfaz) — requiere backend + frontend corriendo
```

## Tests unitarios

Tests de componentes y lógica en aislamiento, mockeando dependencias externas (API, router, auth context).

### `src/test/api.test.ts` — Cliente API (`lib/api.ts`)

Mockear `axios` para testear cada función sin servidor real.

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_login_sends_credentials` | `api.login()` envía POST a `/auth/login` con username y password |
| 2 | `test_get_me` | `api.getMe()` hace GET a `/auth/me` |
| 3 | `test_get_books` | `api.getBooks()` hace GET a `/books` |
| 4 | `test_create_book` | `api.createBook()` hace POST a `/books` con los datos del libro |
| 5 | `test_update_book` | `api.updateBook()` hace PUT a `/books/{id}` con los campos a actualizar |
| 6 | `test_delete_book` | `api.deleteBook()` hace DELETE a `/books/{id}` |
| 7 | `test_get_users` | `api.getUsers()` hace GET a `/users` |
| 8 | `test_create_user` | `api.createUser()` hace POST a `/users` con datos del usuario |
| 9 | `test_update_user` | `api.updateUser()` hace PUT a `/users/{id}` |
| 10 | `test_delete_user` | `api.deleteUser()` hace DELETE a `/users/{id}` |
| 11 | `test_reserve_book` | `api.reserveBook()` hace POST a `/reservations` con book_id |
| 12 | `test_get_my_reservations` | `api.getMyReservations()` hace GET a `/reservations/me` |
| 13 | `test_get_all_reservations` | `api.getAllReservations()` hace GET a `/reservations` |
| 14 | `test_return_book` | `api.returnBook()` hace PATCH a `/reservations/{id}/return` |

### `src/test/useAuth.test.tsx` — Hook de autenticación (`hooks/useAuth.tsx`)

Testear el `AuthProvider` y el hook `useAuth` envolviendo componentes en el provider.

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_initial_state_unauthenticated` | Sin token en localStorage → `isAuthenticated` es `false`, `user` es `null` |
| 2 | `test_login_success` | `login()` con credenciales válidas → setea `user` y `access_token` en localStorage |
| 3 | `test_login_failure` | `login()` con credenciales inválidas → lanza error, no setea user |
| 4 | `test_logout` | `logout()` → limpia token, limpia user, redirige a `/login` |
| 5 | `test_checkAuth_restores_session` | Con token válido en localStorage → `checkAuth()` hidrata `user` |
| 6 | `test_checkAuth_invalid_token` | Con token inválido en localStorage → `checkAuth()` limpia token y user |

### `src/test/login.test.tsx` — Página de login (`routes/login.tsx`)

Usar la página real con el router mockeado para evitar dependencia de TanStack Router.

| # | Test | Descripción | Happy path | Edge cases |
|---|------|-------------|------------|------------|
| 1 | `test_renders_login_form` | Renderiza campos username, password y botón Sign In | ✅ | — |
| 2 | `test_shows_error_empty_submit` | Click en Sign In con campos vacíos muestra error | — | Validación client-side |
| 3 | `test_calls_login_with_credentials` | Submit con credenciales llama a la función login del hook | ✅ | — |
| 4 | `test_shows_error_on_api_failure` | Login falla (401) → muestra mensaje de error | — | Error response de API |
| 5 | `test_redirects_when_already_authenticated` | Usuario ya autenticado → redirige a dashboard | — | Estado inicial autenticado |
| 6 | `test_disables_button_while_loading` | Botón se deshabilita durante el loading | — | Prevención doble submit |

### `src/test/navbar.test.tsx` — Barra de navegación (`components/Navbar.tsx`)

Usar el componente `Navbar` real con props mockeadas (o mock del contexto de auth).

| # | Test | Descripción | Happy path | Edge cases |
|---|------|-------------|------------|------------|
| 1 | `test_shows_admin_links` | Rol admin → ve Dashboard, Books, Users, Logout | ✅ | — |
| 2 | `test_shows_user_links` | Rol user → ve Dashboard, Books, My Reservations, Logout | ✅ | — |
| 3 | `test_hides_navbar_on_login_page` | En ruta `/login` → navbar no se renderiza | — | Ruta especial |
| 4 | `test_shows_username` | Muestra el username del usuario autenticado | ✅ | — |
| 5 | `test_logout_button_works` | Click en Logout → llama a logout del auth context | ✅ | — |
| 6 | `test_dashboard_link_visible` | Link a Dashboard visible para admin y user | ✅ | Ambos roles |

### `src/test/books.test.tsx` — Lista de libros (`routes/books/index.tsx`)

| # | Test | Descripción | Happy path | Edge cases |
|---|------|-------------|------------|------------|
| 1 | `test_renders_book_list` | Renderiza tabla con libros del API | ✅ | — |
| 2 | `test_shows_loading_state` | Mientras carga, muestra indicador de carga | — | Loading state |
| 3 | `test_shows_empty_state` | No hay libros → mensaje "No books found" | — | Empty state |
| 4 | `test_shows_error_state` | API falla → mensaje de error | — | Error state |
| 5 | `test_admin_sees_edit_delete` | Admin ve botones Edit y Delete por cada libro | ✅ | — |
| 6 | `test_user_sees_reserve_for_available` | User ve Reserve solo en libros disponibles | ✅ | — |
| 7 | `test_user_no_reserve_for_unavailable` | User NO ve Reserve en libros no disponibles | — | Condicional UI |
| 8 | `test_delete_requires_confirmation` | Click en Delete → muestra diálogo de confirmación | — | Confirmación antes de borrar |
| 9 | `test_search_filters_books` | Búsqueda por título/autor filtra la lista | ✅ | Filtro client-side |

### `src/test/book-create.test.tsx` — Crear libro (`routes/books/new.tsx`)

| # | Test | Descripción | Happy path | Edge cases |
|---|------|-------------|------------|------------|
| 1 | `test_renders_create_form` | Renderiza campos title, author, isbn y botón submit | ✅ | — |
| 2 | `test_creates_book_successfully` | Submit con datos válidos → llama a API y redirige a /books | ✅ | — |
| 3 | `test_shows_validation_errors` | Campos vacíos → muestra errores de validación | — | Validación client-side |
| 4 | `test_shows_duplicate_isbn_error` | API retorna 409 → muestra error "ISBN already exists" | — | Error del servidor |
| 5 | `test_cancels_and_goes_back` | Click en cancelar → navega de vuelta a /books | ✅ | Navegación |

### `src/test/book-edit.test.tsx` — Editar libro (`routes/books/$id.tsx`)

| # | Test | Descripción | Happy path | Edge cases |
|---|------|-------------|------------|------------|
| 1 | `test_prefills_form_with_book_data` | API retorna libro → precarga title, author, isbn | ✅ | — |
| 2 | `test_updates_book_successfully` | Submit con cambios → PUT a API y redirige | ✅ | — |
| 3 | `test_shows_404_for_nonexistent_book` | API retorna 404 → muestra "Book not found" | — | Error state |
| 4 | `test_cancels_edit` | Click cancelar → navega a /books | ✅ | Navegación |

### `src/test/users.test.tsx` — Lista de usuarios (`routes/users/index.tsx`)

| # | Test | Descripción | Happy path | Edge cases |
|---|------|-------------|------------|------------|
| 1 | `test_renders_user_list` | Renderiza tabla con usuarios del API | ✅ | — |
| 2 | `test_shows_loading_state` | Mientras carga, muestra indicador | — | Loading |
| 3 | `test_shows_empty_state` | No hay usuarios → mensaje | — | Empty |
| 4 | `test_shows_error_state` | API falla → mensaje de error | — | Error |
| 5 | `test_delete_user_confirmation` | Delete → diálogo de confirmación → confirma → DELETE a API | ✅ | — |
| 6 | `test_navigates_to_create` | Click "Create User" → navega a /users/new | ✅ | Navegación |

### `src/test/user-create.test.tsx` — Crear usuario (`routes/users/new.tsx`)

| # | Test | Descripción | Happy path | Edge cases |
|---|------|-------------|------------|------------|
| 1 | `test_renders_create_user_form` | Renderiza username, password, role select y submit | ✅ | — |
| 2 | `test_creates_user_successfully` | Submit válido → POST a API y redirige | ✅ | — |
| 3 | `test_shows_validation_errors` | Campos vacíos → errores de validación | — | Validación |
| 4 | `test_shows_duplicate_username_error` | API 409 → muestra "Username already exists" | — | Error servidor |
| 5 | `test_role_select_allows_admin_and_user` | Select de rol tiene opciones admin y user | ✅ | Opciones del select |

### `src/test/user-edit.test.tsx` — Editar usuario (`routes/users/$id.tsx`)

| # | Test | Descripción | Happy path | Edge cases |
|---|------|-------------|------------|------------|
| 1 | `test_prefills_form_with_user_data` | Precarga username y role | ✅ | — |
| 2 | `test_updates_user_successfully` | Submit → PUT a API y redirige | ✅ | — |
| 3 | `test_updates_password_optional` | Password vacío → no envía password en PUT | — | Campo opcional |
| 4 | `test_shows_404_for_nonexistent_user` | API 404 → "User not found" | — | Error |

### `src/test/reservations.test.tsx` — Lista de reservas (`routes/reservations/index.tsx`)

| # | Test | Descripción | Happy path | Edge cases |
|---|------|-------------|------------|------------|
| 1 | `test_renders_reservations_list` | Renderiza tabla con reservas del API | ✅ | — |
| 2 | `test_shows_active_badge` | Reserva activa (returned_at null) → badge "Active" verde | ✅ | — |
| 3 | `test_shows_returned_badge` | Reserva devuelta → badge "Returned" gris | ✅ | — |
| 4 | `test_return_button_for_active` | Reserva activa → botón "Return" | ✅ | — |
| 5 | `test_no_return_button_for_returned` | Reserva devuelta → NO botón "Return" | — | Condicional |
| 6 | `test_return_book_flow` | Click Return → confirmación → PATCH a API | ✅ | — |
| 7 | `test_shows_loading_state` | Cargando → indicador | — | Loading |
| 8 | `test_shows_empty_state` | Sin reservas → "No reservations" | — | Empty |
| 9 | `test_shows_error_state` | API falla → mensaje de error | — | Error |

## Tests de integración

Tests que combinan múltiples componentes con el contexto real de la aplicación (AuthProvider, Router).

### `src/test/integration/login-flow.test.tsx`

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_login_navigates_admin_dashboard` | Login como admin → redirige a `/dashboard/admin` |
| 2 | `test_login_navigates_user_dashboard` | Login como user → redirige a `/dashboard/user` |
| 3 | `test_login_failure_stays_on_login` | Login falla → permanece en `/login` con mensaje de error |
| 4 | `test_logout_redirects_to_login` | Logout → redirige a `/login`, navbar desaparece |

### `src/test/integration/route-guards.test.tsx`

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_unauthenticated_redirect_to_login` | Sin auth, navegar a `/books` → redirige a `/login` |
| 2 | `test_user_redirected_from_admin_route` | User navega a `/users` → redirige a `/dashboard/user` (o 404) |
| 3 | `test_admin_can_access_admin_routes` | Admin navega a `/users`, `/books/new`, `/books/$id/edit` → OK |

### `src/test/integration/reservation-flow.test.tsx`

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_user_reserves_and_returns_book` | Flujo completo: user ve libros → reserva → ve reserva activa → devuelve → ve devuelta |

## Tests de interfaz (Playwright)

Tests EZE (End-to-End) con Playwright contra el backend real + frontend real.

Requisitos:
- Docker compose up (PostgreSQL)
- Backend corriendo (`cd backend && uv run uvicorn app.main:app`)
- Frontend corriendo (`cd frontend && pnpm run dev`)

Configurar `playwright.config.ts` en la raíz del frontend:
```typescript
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './src/test/e2e',
  webServer: [
    { command: 'cd backend && uv run uvicorn app.main:app', port: 8000 },
    { command: 'cd frontend && pnpm run dev', port: 5173 },
  ],
  use: { baseURL: 'http://localhost:5173' },
});
```

### `src/test/e2e/login.spec.ts`

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_login_as_admin` | Navegar a /login, ingresar admin/admin123, verificar redirección a dashboard admin, ver navbar con Users |
| 2 | `test_login_as_user` | Navegar a /login, ingresar user/user123, verificar redirección a dashboard user, ver navbar con My Reservations |
| 3 | `test_login_invalid_credentials` | Ingresar credenciales inválidas, verificar mensaje de error, permanecer en /login |
| 4 | `test_access_login_when_authenticated` | Estando autenticado, navegar a /login → redirige a dashboard |

### `src/test/e2e/books-admin.spec.ts`

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_admin_creates_book` | Login admin → Books → Create Book → llenar formulario → submit → ver libro en lista |
| 2 | `test_admin_edits_book` | Login admin → Books → Edit → cambiar título → submit → ver título actualizado |
| 3 | `test_admin_deletes_book` | Login admin → Books → Delete → confirmar → ver libro eliminado de la lista |
| 4 | `test_admin_creates_duplicate_isbn` | Crear libro con ISBN existente → ver error "ISBN already exists" |

### `src/test/e2e/books-user.spec.ts`

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_user_views_books` | Login user → Books → ver lista de libros sin botones Edit/Delete |
| 2 | `test_user_reserves_book` | Login user → Books → Reserve en libro disponible → ver confirmación → ir a My Reservations → ver reserva activa |
| 3 | `test_user_returns_book` | Login user → My Reservations → Return → confirmar → ver badge "Returned" |

### `src/test/e2e/users-admin.spec.ts`

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_admin_creates_user` | Login admin → Users → Create → llenar formulario → submit → ver usuario en lista |
| 2 | `test_admin_edits_user` | Login admin → Users → Edit → cambiar username → submit → ver username actualizado |
| 3 | `test_admin_deletes_user` | Login admin → Users → Delete → confirmar → ver usuario eliminado |
| 4 | `test_admin_creates_duplicate_username` | Crear usuario con username existente → ver error "Username already exists" |

### `src/test/e2e/auth-guards.spec.ts`

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_unauthenticated_redirect` | Sin token, navegar a /books → redirige a /login |
| 2 | `test_user_blocked_from_admin` | Login user, navegar a /users → ver 404 o redirección |
| 3 | `test_admin_accesses_all_sections` | Login admin → navegar a /books, /users, /reservations → todo accesible |
| 4 | `test_logout_clears_session` | Estando autenticado, hacer logout → redirige a /login → no puede acceder a /books |

### `src/test/e2e/reservations-admin.spec.ts`

| # | Test | Descripción |
|---|------|-------------|
| 1 | `test_admin_views_all_reservations` | Login admin → Reservations → ver todas las reservas de todos los usuarios |
| 2 | `test_admin_cannot_return_other_users_book` | Admin ve reservas pero no puede devolverlas (botón Return no visible o falla) |
