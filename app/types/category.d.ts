import type { ApiResponse, PaginationMeta } from './api'

export interface Category {
    id: number
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
}

export interface CategoryPayload {
    name: string
    description?: string
}
