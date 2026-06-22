import type { ApiResponse, PaginationMeta } from './api'

export interface Branch {
    id: number
    code: string
    name: string
    description: string | null
    address: string | null
    email: string | null
    phone: string | null
    createdAt: string
    updatedAt: string
}

export interface BranchPayload {
    code?: string
    name: string
    description?: string
    address?: string
    email?: string
    phone?: string
}
