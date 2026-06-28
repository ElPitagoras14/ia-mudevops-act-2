# Database Spec — Book Booker

## Stack

- PostgreSQL 18
- Docker + docker-compose.yml (en la raíz del proyecto)
- Puerto: `5432`
- Base de datos: `book_booker`
- Usuario: `book_user`
- Contraseña: `book_pass`

## Docker Compose

Crear `docker-compose.yml` en la raíz del proyecto:

```yaml
services:
  db:
    image: postgres:18-alpine
    container_name: book_booker_db
    environment:
      POSTGRES_DB: book_booker
      POSTGRES_USER: book_user
      POSTGRES_PASSWORD: book_pass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U book_user -d book_booker"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

## Esquema de tablas

### Tabla: `users`

| Columna          | Tipo                     | Constraints                        |
|------------------|--------------------------|------------------------------------|
| id               | UUID                     | PRIMARY KEY DEFAULT gen_random_uuid() |
| username         | VARCHAR(50)              | NOT NULL UNIQUE                    |
| hashed_password  | VARCHAR(255)             | NOT NULL                           |
| role             | VARCHAR(10)              | NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user' |
| created_at       | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()             |

### Tabla: `books`

| Columna    | Tipo                     | Constraints                        |
|------------|--------------------------|------------------------------------|
| id         | UUID                     | PRIMARY KEY DEFAULT gen_random_uuid() |
| title      | VARCHAR(255)             | NOT NULL                           |
| author     | VARCHAR(255)             | NOT NULL                           |
| isbn       | VARCHAR(20)              | NOT NULL UNIQUE                    |
| available  | BOOLEAN                  | NOT NULL DEFAULT TRUE              |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()             |

### Tabla: `reservations`

| Columna     | Tipo                     | Constraints                        |
|-------------|--------------------------|------------------------------------|
| id          | UUID                     | PRIMARY KEY DEFAULT gen_random_uuid() |
| user_id     | UUID                     | NOT NULL REFERENCES users(id) ON DELETE CASCADE |
| book_id     | UUID                     | NOT NULL REFERENCES books(id) ON DELETE CASCADE |
| reserved_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()             |
| returned_at | TIMESTAMP WITH TIME ZONE | NULLABLE                           |

**Restricción adicional**: Un usuario no puede tener más de una reserva activa del mismo libro.

```sql
CREATE UNIQUE INDEX idx_active_reservation
ON reservations (user_id, book_id)
WHERE returned_at IS NULL;
```

## Script SQL completo (`database/init.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) NOT NULL UNIQUE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    reserved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    returned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_reservation
ON reservations (user_id, book_id)
WHERE returned_at IS NULL;

-- Seed data
-- Contraseña admin: admin123 (hash generado con pwdlib argon2)
-- Contraseña user: user123
INSERT INTO users (username, hashed_password, role) VALUES
    ('admin', '$argon2id$v=19$m=65536,t=3,p=4$hashed_admin_password_placeholder', 'admin'),
    ('user', '$argon2id$v=19$m=65536,t=3,p=4$hashed_user_password_placeholder', 'user');

INSERT INTO books (title, author, isbn, available) VALUES
    ('Cien años de soledad', 'Gabriel García Márquez', '978-8437604947', TRUE),
    ('Don Quijote de la Mancha', 'Miguel de Cervantes', '978-8420412146', TRUE),
    ('1984', 'George Orwell', '978-0451524935', TRUE),
    ('El principito', 'Antoine de Saint-Exupéry', '978-0156012195', TRUE),
    ('La sombra del viento', 'Carlos Ruiz Zafón', '978-8408079541', TRUE);
```

## Raw queries

Todas las queries se ejecutan con `psycopg2` usando `cursor.execute()`.

### Auth

| Operación | Query | Parámetros | Retorno |
|-----------|-------|------------|---------|
| Obtener usuario por username | `SELECT id, username, hashed_password, role FROM users WHERE username = %s` | `username: str` | `dict` o `None` |
| Obtener usuario por ID | `SELECT id, username, role, created_at FROM users WHERE id = %s` | `user_id: UUID` | `dict` o `None` |

### Users (Admin)

| Operación | Query | Parámetros | Retorno |
|-----------|-------|------------|---------|
| Listar todos | `SELECT id, username, role, created_at FROM users ORDER BY created_at DESC` | — | `list[dict]` |
| Crear | `INSERT INTO users (username, hashed_password, role) VALUES (%s, %s, %s) RETURNING id, username, role, created_at` | `username, hashed_password, role` | `dict` |
| Obtener por ID | `SELECT id, username, role, created_at FROM users WHERE id = %s` | `user_id: UUID` | `dict` o `None` |
| Actualizar | `UPDATE users SET username = %s, role = %s WHERE id = %s RETURNING id, username, role, created_at` | `username, role, user_id` | `dict` o `None` |
| Actualizar con password | `UPDATE users SET username = %s, hashed_password = %s, role = %s WHERE id = %s RETURNING id, username, role, created_at` | `username, hashed_password, role, user_id` | `dict` o `None` |
| Eliminar | `DELETE FROM users WHERE id = %s` | `user_id: UUID` | filas afectadas |

### Books

| Operación | Query | Parámetros | Retorno |
|-----------|-------|------------|---------|
| Listar todos | `SELECT id, title, author, isbn, available, created_at FROM books ORDER BY title ASC` | — | `list[dict]` |
| Crear | `INSERT INTO books (title, author, isbn) VALUES (%s, %s, %s) RETURNING id, title, author, isbn, available, created_at` | `title, author, isbn` | `dict` |
| Obtener por ID | `SELECT id, title, author, isbn, available, created_at FROM books WHERE id = %s` | `book_id: UUID` | `dict` o `None` |
| Actualizar | `UPDATE books SET title = %s, author = %s, isbn = %s WHERE id = %s RETURNING id, title, author, isbn, available, created_at` | `title, author, isbn, book_id` | `dict` o `None` |
| Eliminar | `DELETE FROM books WHERE id = %s` | `book_id: UUID` | filas afectadas |

### Reservations

| Operación | Query | Parámetros | Retorno |
|-----------|-------|------------|---------|
| Crear reserva | `INSERT INTO reservations (user_id, book_id) VALUES (%s, %s) RETURNING id, user_id, book_id, reserved_at` | `user_id, book_id` | `dict` |
| Verificar disponibilidad | `SELECT available FROM books WHERE id = %s FOR UPDATE` | `book_id` | `bool` o `None` |
| Marcar libro no disponible | `UPDATE books SET available = FALSE WHERE id = %s` | `book_id` | — |
| Marcar libro disponible | `UPDATE books SET available = TRUE WHERE id = %s` | `book_id` | — |
| Listar reservas de un usuario | `SELECT r.id, r.reserved_at, r.returned_at, b.id as book_id, b.title, b.author, b.isbn FROM reservations r JOIN books b ON r.book_id = b.id WHERE r.user_id = %s ORDER BY r.reserved_at DESC` | `user_id` | `list[dict]` |
| Listar todas las reservas (admin) | `SELECT r.id, r.reserved_at, r.returned_at, u.username, b.title, b.author FROM reservations r JOIN users u ON r.user_id = u.id JOIN books b ON r.book_id = b.id ORDER BY r.reserved_at DESC` | — | `list[dict]` |
| Devolver libro | `UPDATE reservations SET returned_at = NOW() WHERE id = %s AND returned_at IS NULL RETURNING id, book_id` | `reservation_id` | `dict` o `None` |
| Verificar propietario reserva | `SELECT id, user_id, book_id FROM reservations WHERE id = %s AND returned_at IS NULL` | `reservation_id` | `dict` o `None` |

## Notas

- Todas las queries se ejecutan dentro del contexto de `psycopg2` con `connection.cursor()`.
- Usar `cursor.rowcount` para verificar si una operación afectó filas.
- Usar `connection.commit()` después de escrituras.
- Usar `cursor.fetchone()` para queries que retornan una fila, `cursor.fetchall()` para múltiples.
- Usar `RETURNING` para obtener datos después de INSERT/UPDATE.
- Las transacciones que involucran verificar disponibilidad y crear reserva deben estar en la misma transacción para evitar race conditions.
