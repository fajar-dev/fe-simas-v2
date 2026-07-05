import type { Attachment } from "./attachment"

export interface AssetMaintenance {
  id: number
  assetId: number
  date: string
  note: string | null
  cost: number
  createdAt: string
  updatedAt: string
  asset: {
    id: number
    name: string
    code: string
  } | null
  createdBy: {
    id: number
    name: string
    photo: string | null
  } | null
  attachments: Attachment[]
}

export interface AssetMaintenancePayload {
  assetId: number
  date: string
  note?: string
  cost?: number
  attachmentIds?: number[]
}
