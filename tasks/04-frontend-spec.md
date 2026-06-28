# Frontend Spec — Book Booker

## Stack

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 20+ | Runtime |
| pnpm | latest | Package manager |
| Vite | latest | Bundler / dev server |
| React | 19+ | UI framework |
| TypeScript | 5+ (strict mode) | Tipado |
| TanStack React Router | latest | Routing (file-based) |
| Tailwind CSS | v4 | Estilos |
| shadcn/ui | latest | Componentes UI |
| Lucide React | latest | Iconos |
| Axios | latest | HTTP client |
| Vitest | latest | Test runner |
| @testing-library/react | latest | Testing de componentes |

## Inicialización del proyecto

```bash
cd frontend
pnpm create vite . --template react-ts
pnpm install
pnpm add @tanstack/react-router axios
pnpm add -D @tanstack/router-plugin @tanstack/react-router-devtools @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
npx shadcn@latest init -t vite --yes
```

## shadcn/ui — componentes a añadir

Usar el MCP de shadcn para añadir:

```bash
npx shadcn@latest add button card dialog input label table form badge select toast
```

## Estructura de directorios

```
frontend/
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts              # Plugin TanStack Router + React + path alias
├── tsconfig.json               # strict: true
├── tsconfig.app.json
├── components.json             # Configuración shadcn
├── tailwind.config.ts          # Config Tailwind (si aplica en v4)
├── postcss.config.js
├── index.html
└── src/
    ├── main.tsx                # Entry point, RouterProvider
    ├── App.tsx                 # RouterProvider wrapper
    ├── index.css               # Tailwind directives + shadcn theme
    ├── routeTree.gen.ts        # Auto-generado por TanStack Router
    ├── routes/
    │   ├── __root.tsx          # Layout raíz: navbar + Outlet
    │   ├── index.tsx           # Redirect según rol: /dashboard/admin o /dashboard/user
    │   ├── login.tsx           # Página de login
    │   ├── dashboard/
    │   │   ├── admin.tsx       # Dashboard admin
    │   │   └── user.tsx        # Dashboard user
    │   ├── books/
    │   │   ├── index.tsx       # Listado de libros
    │   │   ├── new.tsx         # Crear libro (admin)
    │   │   └── $id.tsx         # Editar libro (admin)
    │   ├── users/
    │   │   ├── index.tsx       # Listado de usuarios (admin)
    │   │   ├── new.tsx         # Crear usuario (admin)
    │   │   └── $id.tsx         # Editar usuario (admin)
    │   └── reservations/
    │       └── index.tsx       # Mis reservas (user)
    ├── components/
    │   ├── ui/                 # Componentes shadcn (generados)
    │   ├── Navbar.tsx          # Barra de navegación
    │   ├── ProtectedRoute.tsx  # Guard de autenticación/rol
    │   └── BookCard.tsx        # Componente reutilizable de libro
    ├── lib/
    │   ├── utils.ts            # Utilidades shadcn (cn)
    │   └── api.ts              # Instancia de Axios con interceptors
    ├── hooks/
    │   └── useAuth.ts          # Hook de autenticación (context)
    └── types/
        └── index.ts            # Tipos compartidos (User, Book, Reservation, etc.)
```

## Configuración de TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Tipos (`src/types/index.ts`)

```typescript
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
  created_at: string;
}

export interface Reservation {
  id: string;
  book_id: string;
  book_title?: string;
  book_author?: string;
  reserved_at: string;
  returned_at: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
```

## API Client (`src/lib/api.ts`)

- Crear instancia de Axios con `baseURL = 'http://localhost:8000'`.
- Interceptor de request: añadir header `Authorization: Bearer <token>` desde localStorage.
- Interceptor de response: si 401, limpiar token y redirigir a `/login`.
- Funciones helpers tipadas:

```typescript
export const api = {
  // Auth
  login: (creds: LoginCredentials) => api.post<AuthResponse>('/auth/login', creds),
  getMe: () => api.get<User>('/auth/me'),

  // Books
  getBooks: () => api.get<Book[]>('/books'),
  getBook: (id: string) => api.get<Book>(`/books/${id}`),
  createBook: (data: Omit<Book, 'id' | 'available' | 'created_at'>) => api.post<Book>('/books', data),
  updateBook: (id: string, data: Partial<Book>) => api.put<Book>(`/books/${id}`, data),
  deleteBook: (id: string) => api.delete(`/books/${id}`),

  // Users (admin)
  getUsers: () => api.get<User[]>('/users'),
  createUser: (data: { username: string; password: string; role: UserRole }) => api.post<User>('/users', data),
  updateUser: (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),

  // Reservations
  reserveBook: (bookId: string) => api.post<Reservation>('/reservations', { book_id: bookId }),
  getMyReservations: () => api.get<Reservation[]>('/reservations/me'),
  getAllReservations: () => api.get<Reservation[]>('/reservations'),
  returnBook: (reservationId: string) => api.patch<Reservation>(`/reservations/${reservationId}/return`),
};
```

## Auth Hook (`src/hooks/useAuth.ts`)

- Usar React Context + Provider.
- Estados: `user: User | null`, `isAuthenticated: boolean`, `isLoading: boolean`.
- Métodos:
  - `login(credentials)` — llama a API, guarda token en localStorage, setea user.
  - `logout()` — limpia token y user, redirige a `/login`.
  - `checkAuth()` — al montar, si hay token en localStorage, llama a `/auth/me` para restaurar sesión.
- Provider envuelve la app en `main.tsx`.

## Rutas (TanStack Router — file-based)

### Convención de archivos

| Archivo | Ruta URL | Componente | Auth | Roles |
|---------|----------|------------|------|-------|
| `routes/__root.tsx` | — | Layout con Navbar + Outlet | — | — |
| `routes/index.tsx` | `/` | Redirect según rol | Bearer | Cualquiera |
| `routes/login.tsx` | `/login` | Formulario de login | No | — |
| `routes/dashboard/admin.tsx` | `/dashboard/admin` | Dashboard de admin | Bearer | admin |
| `routes/dashboard/user.tsx` | `/dashboard/user` | Dashboard de user | Bearer | user |
| `routes/books/index.tsx` | `/books` | Listado de libros | Bearer | Cualquiera |
| `routes/books/new.tsx` | `/books/new` | Formulario crear libro | Bearer | admin |
| `routes/books/$id.tsx` | `/books/$id` | Formulario editar libro | Bearer | admin |
| `routes/users/index.tsx` | `/users` | Listado de usuarios | Bearer | admin |
| `routes/users/new.tsx` | `/users/new` | Formulario crear usuario | Bearer | admin |
| `routes/users/$id.tsx` | `/users/$id` | Formulario editar usuario | Bearer | admin |
| `routes/reservations/index.tsx` | `/reservations` | Mis reservas | Bearer | user |

### Protección de rutas

Usar `beforeLoad` en cada ruta protegida:

```typescript
export const Route = createFileRoute('/books')({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: BooksListPage,
});
```

Para rutas de admin, verificar además `context.auth.user.role === 'admin'`.

### Root Layout (`routes/__root.tsx`)

```typescript
// Navbar con:
// - Logo / nombre "Book Booker"
// - Links contextuales según rol:
//   Admin: Dashboard, Books, Users
//   User: Dashboard, Books, My Reservations
// - Botón de Logout
// - <Outlet /> para contenido de rutas hijas
// - <TanStackRouterDevtools /> en desarrollo
```

## Páginas

### Login Page (`routes/login.tsx`)
- Formulario centrado con Card de shadcn.
- Campos: username (Input), password (Input type=password), botón "Sign In" (Button).
- En éxito: guarda token, redirige según rol.
- En error: muestra toast/alert con mensaje.
- Si ya autenticado, redirige a dashboard.

### Dashboard Admin (`routes/dashboard/admin.tsx`)
- Tarjetas de resumen: total libros, total usuarios, reservas activas.
- Links rápidos a: Crear libro, Ver usuarios, Ver todas las reservas.

### Dashboard User (`routes/dashboard/user.tsx`)
- Tarjetas: libros disponibles, mis reservas activas.
- Links rápidos a: Ver libros, Mis reservas.

### Books List (`routes/books/index.tsx`)
- Tabla (Table de shadcn) con columnas: Título, Autor, ISBN, Disponible (Badge), Acciones.
- Admin: columna de acciones con botones Editar y Eliminar (Dialog de confirmación).
- User: botón "Reservar" si el libro está disponible.
- Búsqueda/filtro opcional por título o autor.

### Book Create/Edit (`routes/books/new.tsx` y `routes/books/$id.tsx`)
- Formulario con Inputs para: title, author, isbn.
- Validación: todos los campos requeridos, ISBN único.
- Edit: precargar datos del libro.
- Submit: llamar a API, redirigir a /books, mostrar toast de éxito.

### Users List (`routes/users/index.tsx`) — Admin
- Tabla: Username, Rol, Creado, Acciones.
- Botones: Editar, Eliminar (con confirmación).
- Botón "Crear Usuario" arriba.

### User Create/Edit (`routes/users/new.tsx` y `routes/users/$id.tsx`) — Admin
- Formulario: username, password (solo en create), role (Select: admin/user).
- Edit: precargar datos, password opcional.

### My Reservations (`routes/reservations/index.tsx`) — User
- Tabla: Libro, Autor, Fecha reserva, Fecha devolución, Estado.
- Estado: "Activo" (Badge verde) o "Devuelto" (Badge gray).
- Botón "Devolver" en reservas activas con confirmación.

## Tests (Vitest + Testing Library)

### Configuración (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### Test cases

#### Login
- Renderiza formulario de login.
- Muestra error con credenciales vacías.
- Submit exitoso redirige.

#### Dashboard
- Admin ve enlaces de admin.
- User no ve enlaces de admin.
- Usuario no autenticado redirige a login.

#### Books List
- Renderiza lista de libros.
- Admin ve botones de editar/eliminar.
- User ve botón de reservar.
- User no ve botones de admin.

#### Navbar
- Muestra links correctos según rol.
- Botón de logout funciona.
- No muestra navbar en login.

## Scripts de ejecución

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```
