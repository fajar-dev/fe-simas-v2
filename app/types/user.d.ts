import type { ApiResponse } from './api'

export interface User {
  id: number
  name: string
  email: string
  photo: string | null
  isActive: boolean
  role?: { id: number; name: string } | null
  employee?: {
    id: number
    name: string
    employeeId: string
    jobPosition: string
    photo: string | null
  } | null
  createdAt: string
}

export interface UserPayload {
  name: string
  email: string
  password?: string
  photo?: string | null
  isActive: boolean
  roleId?: number | null
  employeeId?: number | null
}

