import type { Attachment } from "./attachment"

export interface AssetMaintenance {
  id: number
  assetId: number
  date: string
  note: string | null
  createdAt: string
  updatedAt: string
  asset: {
    id: number
    name: string
    code: string
  } | null
  attachments: Attachment[]
}

export interface AssetMaintenancePayload {
  assetId: number
  date: string
  note?: string
  attachmentIds?: number[]
}
