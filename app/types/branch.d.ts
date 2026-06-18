import type { ApiResponse, PaginationMeta } from './api'

export interface Branch {
    id: number
    code: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
}

export interface BranchPayload {
    code: string
    name: string
    description?: string
}
