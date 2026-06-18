import type { ApiResponse } from './api'

export interface User {
  id: number
  name: string
  email: string
  photo: string | null
  isActive: boolean
  createdAt: string
}

export interface UserPayload {
  name: string
  email: string
  password?: string
  photo?: string | null
  isActive: boolean
}
