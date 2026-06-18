import type { ApiResponse } from './api'

export interface Asset {
  id: number
  code: string
  name: string
  description: string | null
  modal: number | null
  price: number | null
  purchaseDate: string | null
  brand: string | null
  model: string | null
  image: string | null
  rawImage: string | null
  subCategoryId: number
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
  modal?: number
  price?: number
  purchaseDate?: string
  brand?: string
  model?: string
  image?: string | null
  subCategoryId: number
}

