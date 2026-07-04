import type { ApiResponse } from './api'

export interface User {
    id: number
    name: string
    email: string
    photo: string
    isActive: boolean
    employee?: {id: number, employeeId: string, name: string} | null
    hasPassword?: boolean
    role?: { id: number; name: string; isSuperAdmin: boolean; permissions: { id: number; key: string }[] } | null
}

export interface AuthData {
    user: User
    accessToken: string
    refreshToken: string
}



export type AuthResponse = ApiResponse<AuthData>