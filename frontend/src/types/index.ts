export type UserRole = 'admin' | 'user';

export interface UserMe {
  id: string;
  username: string;
  role: UserRole;
}

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

export interface CreateBookPayload {
  title: string;
  author: string;
  isbn: string;
}

export interface UpdateBookPayload {
  title?: string;
  author?: string;
  isbn?: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  role?: UserRole;
}

export interface ReserveBookPayload {
  book_id: string;
}
