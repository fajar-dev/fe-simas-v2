import type { Attachment } from './attachment'
import type { TransactionType, HandoverStatus } from '../utils/enums'

export type { TransactionType, HandoverStatus }

export interface AssetHandoverItem {
  id: number
  note: string | null
  asset: {
    id: number
    name: string
    code: string
    image: string
  } | null
}

export interface AssetHandover {
  id: number
  received: {
    id: number
    name: string
    employeeId: string
    jobPosition: string
    photo: string | null
  } | null
  handedOver: {
    id: number
    name: string
    employeeId: string
    jobPosition: string
    photo: string | null
  } | null
  transactionType: TransactionType
  status: HandoverStatus
  note: string | null
  createdAt: string
  updatedAt: string
  items: AssetHandoverItem[]
  attachments: Attachment[]
  createdBy: {
    id: number
    name: string
    photo: string | null
  } | null
}

export interface HandoverItemPayload {
  assetId: number
  note?: string | null
}

export interface CreateAssetHandoverPayload {
  receivedById: number
  handedOverById: number
  date?: string | null
  transactionType: TransactionType
  note?: string | null
  items: HandoverItemPayload[]
}

