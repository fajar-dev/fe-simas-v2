import type { Attachment } from "./attachment"

export interface AssetHolder {
  id: number
  assetId: number
  employeeId: number
  assignedDate: string
  returnedDate: string | null
  assignNote: string | null
  returnNote: string | null
  handoverId: number | null
  createdAt: string
  updatedAt: string
  asset: {
    id: number
    name: string
    code: string
  } | null
  employee: {
    id: number
    name: string
    employeeId: string
    jobPosition: string
    email: string
    phone: string
    photo: string | null
  } | null
  createdBy: {
    id: number
    name: string
    photo: string | null
  } | null
  returnedBy: {
    id: number
    name: string
    photo: string | null
  } | null
  handover: {
    id: number
    status: string
    transactionType: string
    note: string | null
    createdAt: string
  } | null
  attachments: Attachment[]
}

export interface AssignAssetPayload {
  assetId: number
  employeeId: number
  assignedDate: string
  assignNote?: string
  attachmentIds?: number[]
}

export interface ReturnAssetPayload {
  returnedDate: string
  returnNote?: string
  attachmentIds?: number[]
}
