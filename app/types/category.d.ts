import type { ApiResponse, PaginationMeta } from './api'

export interface Category {
    id: number
    code: string
    name: string
    description: string | null
    assetCount: number
    inventoryCount: number
    createdAt: string
    updatedAt: string
}

export interface CategoryPayload {
    code?: string
    name: string
    description?: string
}
