import type { Attachment } from "./attachment"

export interface AssetNote {
  id: number
  date: string
  note: string | null
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
  labels?: { id: number; key: string; value: string }[]
}

export interface AssetNotePayload {
  assetId: number
  date: string
  note?: string
  attachmentIds?: number[]
  labels?: { key: string; value: string }[]
}
