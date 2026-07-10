import type { Attachment } from './attachment'
import type { HandoverCustomField } from './handover-field'
import type { TransactionType, HandoverStatus } from '../utils/enums'

export type { TransactionType, HandoverStatus }

export interface HandoverItem {
  id: number
  note: string | null
  asset: {
    id: number
    name: string
    code: string
    image: string
  } | null
}

export interface Handover {
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
  customFields: HandoverCustomField[]
  parentHandover: {
    id: number
    transactionType: TransactionType
    status: HandoverStatus
  } | null
  createdAt: string
  updatedAt: string
  items: HandoverItem[]
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

export interface CreateHandoverPayload {
  receivedById: number
  handedOverById: number
  date?: string | null
  transactionType: TransactionType
  note?: string | null
  customFields?: Record<string, string | number | null>
  items: HandoverItemPayload[]
}

