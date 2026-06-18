import type { ApiResponse } from './api'

export interface Asset {
  id: number
  code: string
  name: string
  description: string | null
  price: number | null
  purchaseDate: string | null
  age: string | null
  brand: string | null
  model: string | null
  image: string | null
  subCategory: {
    id: number
    name: string
    category: {
      id: number
      name: string
    } | null
  } | null
  createdAt: string
  updatedAt: string
}

export interface AssetPayload {
  code: string
  name: string
  description?: string
  price?: number
  purchaseDate?: string
  brand?: string
  model?: string
  image?: string | null
  subCategoryId: number
}

