import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import type { AuthResponse, Book, Reservation, User, UserMe } from '@/types'

const mockAxiosInstance = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}))

import { api } from '@/lib/api'

const mockPost = mockAxiosInstance.post
const mockGet = mockAxiosInstance.get
const mockPut = mockAxiosInstance.put
const mockPatch = mockAxiosInstance.patch
const mockDelete = mockAxiosInstance.delete

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('test_login_sends_credentials', async () => {
    const res: AuthResponse = { access_token: 'tok', token_type: 'bearer' }
    mockPost.mockResolvedValue({ data: res })
    const result = await api.login({ username: 'admin', password: 'admin123' })
    expect(mockPost).toHaveBeenCalledWith('/auth/login', { username: 'admin', password: 'admin123' })
    expect(result).toEqual(res)
  })

  it('test_get_me', async () => {
    const res: UserMe = { id: '1', username: 'admin', role: 'admin' }
    mockGet.mockResolvedValue({ data: res })
    const result = await api.getMe()
    expect(mockGet).toHaveBeenCalledWith('/auth/me')
    expect(result).toEqual(res)
  })

  it('test_get_books', async () => {
    const res: Book[] = [{ id: '1', title: 'B', author: 'A', isbn: '123', available: true, created_at: '2024-01-01' }]
    mockGet.mockResolvedValue({ data: res })
    const result = await api.getBooks()
    expect(mockGet).toHaveBeenCalledWith('/books')
    expect(result).toEqual(res)
  })

  it('test_create_book', async () => {
    const payload = { title: 'B', author: 'A', isbn: '123' }
    const res: Book = { ...payload, id: '1', available: true, created_at: '2024-01-01' }
    mockPost.mockResolvedValue({ data: res })
    const result = await api.createBook(payload)
    expect(mockPost).toHaveBeenCalledWith('/books', payload)
    expect(result).toEqual(res)
  })

  it('test_update_book', async () => {
    const payload = { title: 'B2' }
    const res: Book = { id: '1', title: 'B2', author: 'A', isbn: '123', available: true, created_at: '2024-01-01' }
    mockPut.mockResolvedValue({ data: res })
    const result = await api.updateBook('1', payload)
    expect(mockPut).toHaveBeenCalledWith('/books/1', payload)
    expect(result).toEqual(res)
  })

  it('test_delete_book', async () => {
    mockDelete.mockResolvedValue({})
    await api.deleteBook('1')
    expect(mockDelete).toHaveBeenCalledWith('/books/1')
  })

  it('test_get_users', async () => {
    const res: User[] = [{ id: '1', username: 'admin', role: 'admin', created_at: '2024-01-01' }]
    mockGet.mockResolvedValue({ data: res })
    const result = await api.getUsers()
    expect(mockGet).toHaveBeenCalledWith('/users')
    expect(result).toEqual(res)
  })

  it('test_create_user', async () => {
    const payload = { username: 'newu', password: 'pass', role: 'user' as const }
    const res: User = { id: '2', username: 'newu', role: 'user', created_at: '2024-01-01' }
    mockPost.mockResolvedValue({ data: res })
    const result = await api.createUser(payload)
    expect(mockPost).toHaveBeenCalledWith('/users', payload)
    expect(result).toEqual(res)
  })

  it('test_update_user', async () => {
    const payload = { username: 'updated' }
    const res: User = { id: '1', username: 'updated', role: 'admin', created_at: '2024-01-01' }
    mockPut.mockResolvedValue({ data: res })
    const result = await api.updateUser('1', payload)
    expect(mockPut).toHaveBeenCalledWith('/users/1', payload)
    expect(result).toEqual(res)
  })

  it('test_delete_user', async () => {
    mockDelete.mockResolvedValue({})
    await api.deleteUser('1')
    expect(mockDelete).toHaveBeenCalledWith('/users/1')
  })

  it('test_reserve_book', async () => {
    const res: Reservation = { id: 'r1', book_id: 'b1', reserved_at: '2024-01-01', returned_at: null }
    mockPost.mockResolvedValue({ data: res })
    const result = await api.reserveBook('b1')
    expect(mockPost).toHaveBeenCalledWith('/reservations', { book_id: 'b1' })
    expect(result).toEqual(res)
  })

  it('test_get_my_reservations', async () => {
    const res: Reservation[] = [{ id: 'r1', book_id: 'b1', reserved_at: '2024-01-01', returned_at: null }]
    mockGet.mockResolvedValue({ data: res })
    const result = await api.getMyReservations()
    expect(mockGet).toHaveBeenCalledWith('/reservations/me')
    expect(result).toEqual(res)
  })

  it('test_get_all_reservations', async () => {
    const res: Reservation[] = [{ id: 'r1', book_id: 'b1', reserved_at: '2024-01-01', returned_at: null }]
    mockGet.mockResolvedValue({ data: res })
    const result = await api.getAllReservations()
    expect(mockGet).toHaveBeenCalledWith('/reservations')
    expect(result).toEqual(res)
  })

  it('test_return_book', async () => {
    const res: Reservation = { id: 'r1', book_id: 'b1', reserved_at: '2024-01-01', returned_at: '2024-01-02' }
    mockPatch.mockResolvedValue({ data: res })
    const result = await api.returnBook('r1')
    expect(mockPatch).toHaveBeenCalledWith('/reservations/r1/return')
    expect(result).toEqual(res)
  })
})
