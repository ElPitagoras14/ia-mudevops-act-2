import axios from 'axios';
import type {
  AuthResponse,
  Book,
  CreateBookPayload,
  CreateUserPayload,
  LoginCredentials,
  Reservation,
  UpdateBookPayload,
  UpdateUserPayload,
  User,
  UserMe,
} from '@/types';

const TOKEN_KEY = 'access_token';

const instance = axios.create({
  baseURL: 'http://localhost:8000',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const api = {
  login: (creds: LoginCredentials) =>
    instance.post<AuthResponse>('/auth/login', creds).then((r) => r.data),

  getMe: () => instance.get<UserMe>('/auth/me').then((r) => r.data),

  getBooks: () => instance.get<Book[]>('/books').then((r) => r.data),

  getBook: (id: string) =>
    instance.get<Book>(`/books/${id}`).then((r) => r.data),

  createBook: (data: CreateBookPayload) =>
    instance.post<Book>('/books', data).then((r) => r.data),

  updateBook: (id: string, data: UpdateBookPayload) =>
    instance.put<Book>(`/books/${id}`, data).then((r) => r.data),

  deleteBook: (id: string) => instance.delete(`/books/${id}`),

  getUsers: () => instance.get<User[]>('/users').then((r) => r.data),

  createUser: (data: CreateUserPayload) =>
    instance.post<User>('/users', data).then((r) => r.data),

  updateUser: (id: string, data: UpdateUserPayload) =>
    instance.put<User>(`/users/${id}`, data).then((r) => r.data),

  deleteUser: (id: string) => instance.delete(`/users/${id}`),

  reserveBook: (bookId: string) =>
    instance
      .post<Reservation>('/reservations', { book_id: bookId })
      .then((r) => r.data),

  getMyReservations: () =>
    instance
      .get<Reservation[]>('/reservations/me')
      .then((r) => r.data),

  getAllReservations: () =>
    instance
      .get<Reservation[]>('/reservations')
      .then((r) => r.data),

  returnBook: (reservationId: string) =>
    instance
      .patch<Reservation>(`/reservations/${reservationId}/return`)
      .then((r) => r.data),
};
