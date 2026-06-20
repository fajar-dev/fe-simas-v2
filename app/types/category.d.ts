import type { ApiResponse, PaginationMeta } from './api'

export interface Category {
    id: number
    code: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
}

export interface CategoryPayload {
    code?: string
    name: string
    description?: string
}
