import type { Attachment } from "./attachment"

export interface AssetLocation {
  id: number
  date: string
  note: string | null
  source: string | null
  createdAt: string
  updatedAt: string
  asset: {
    id: number
    name: string
    code: string
  } | null
  location: {
    id: number
    name: string
    description: string | null
    branch?: {
      id: number
      code: string
      name: string
    }
  } | null
  createdBy: {
    id: number
    name: string
    photo: string | null
  } | null
  attachments: Attachment[]
}

export interface AssetLocationPayload {
  assetId: number
  locationId: number
  date: string
  note?: string
  attachmentIds?: number[]
}
