import type { Attachment } from './attachment'
import type { HandoverCustomField } from './handover-field'
import type { TransactionType, HandoverStatus } from '../utils/enums'

export type { TransactionType, HandoverStatus }

export type HandoverItemKind = 'asset' | 'stock'

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

export interface HandoverStockItem {
  id: number
  condition: 'new' | 'used'
  quantity: number
  note: string | null
  branch: { id: number; name: string } | null
  variant: {
    id: number
    name: string
    code: string | null
    unit: string
    inventory: { id: number; name: string; code: string | null } | null
  } | null
}

export interface HandoverStockItemPayload {
  variantId: number
  branchId: number
  condition: 'new' | 'used'
  quantity: number
  note?: string | null
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
  itemKind: HandoverItemKind
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
  stockItems: HandoverStockItem[]
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
  itemKind?: HandoverItemKind
  note?: string | null
  customFields?: Record<string, string | number | null>
  items?: HandoverItemPayload[]
  stockItems?: HandoverStockItemPayload[]
}

