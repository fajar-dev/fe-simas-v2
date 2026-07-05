import type { ApiResponse } from './api'

export interface AssetLabel {
  id?: number
  key: string
  value: string
}

export interface AssetStatus {
  id: number
  assetId: number
  status: string
  note: string | null
  createdAt: string
  createdBy?: {
    id: number
    name: string
    photo: string | null
  } | null
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
  bleTagMac: string | null
  image: string | null
  usefulLife: number | null
  depreciation: {
    monthlyDepreciation: number
    accumulatedDepreciation: number
    bookValue: number
  } | null
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
  hasHolder: boolean
  hasMaintenance: boolean
  hasLocation: boolean
  activeHolder?: {
    id: number
    employeeId: number
    assignedDate: string
    employee: {
      id: number
      name: string
      employeeId: string
      jobPosition: string
      photo: string | null
    } | null
  } | null
  lastLocation?: {
    id: number
    date: string
    location: {
      id: number
      name: string
      branch: {
        id: number
        name: string
      } | null
    } | null
  } | null
  lastStatus?: {
    id: number
    status: string
    note: string | null
    createdAt: string
    createdBy?: {
      id: number
      name: string
      photo: string | null
    } | null
  } | null
  createdBy?: {
    id: number
    name: string
    photo: string | null
  } | null
  attachments?: {
    id: number
    originalName: string
    mimeType: string
    size: number
    url: string
  }[]
}

export interface AssetPayload {
  code: string
  name: string
  description?: string
  price?: number
  purchaseDate?: string
  brand?: string
  model?: string
  bleTagMac?: string | null
  image?: string | null
  subCategoryId: number
  labels?: AssetLabel[]
  hasHolder?: boolean
  hasMaintenance?: boolean
  hasLocation?: boolean
  usefulLife?: number

  employeeId?: number | null
  assignedDate?: string | null
  assignNote?: string | null
  assignAttachmentIds?: number[] | null
  locationId?: number | null
  locationDate?: string | null
  locationNote?: string | null
  locationAttachmentIds?: number[] | null
  attachmentIds?: number[] | null
  status?: string | null
  statusNote?: string | null
}
