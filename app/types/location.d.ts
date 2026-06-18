import type { ApiResponse } from './api'

export interface Location {
  id: number
  name: string
  description: string | null
  branchId: number
  branch: {
    id: number
    code: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface LocationPayload {
  name: string
  description?: string
  branchId: number
}
