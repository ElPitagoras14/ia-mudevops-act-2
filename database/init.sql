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
    ('admin', '$argon2id$v=19$m=65536,t=3,p=4$9x6aw1NiVWJTDYA55MKhcg$5I5h1/jG9rC+2SOe+xQoHyYEre76KiQsr4Z0ay2rGWg', 'admin'),
    ('user', '$argon2id$v=19$m=65536,t=3,p=4$2sEVSCl4Smq4b91490DT5A$aUfDDgQdVajpUs7bIyNcio6nNSfa62qo1iQZXnLalIA', 'user');

INSERT INTO books (title, author, isbn, available) VALUES
    ('Cien años de soledad', 'Gabriel García Márquez', '978-8437604947', TRUE),
    ('Don Quijote de la Mancha', 'Miguel de Cervantes', '978-8420412146', TRUE),
    ('1984', 'George Orwell', '978-0451524935', TRUE),
    ('El principito', 'Antoine de Saint-Exupéry', '978-0156012195', TRUE),
    ('La sombra del viento', 'Carlos Ruiz Zafón', '978-8408079541', TRUE);
