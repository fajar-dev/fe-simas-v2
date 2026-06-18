import type { ApiResponse } from './api'

export interface AssetLabel {
  id?: number
  key: string
  value: string
}

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
  labels: AssetLabel[]
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
  labels?: AssetLabel[]
}
