import type { Attachment } from './attachment'

export type StockCondition = 'new' | 'used'
export type StockOutType = 'employee' | 'other'

export interface InventoryLabelItem {
  id?: number
  key: string
  value: string
}

export interface Inventory {
  id: number
  code: string | null
  name: string
  description: string | null
  image: string | null
  unit: string
  isActive: boolean
  category: { id: number; name: string } | null
  subCategory: { id: number; name: string } | null
  labels: InventoryLabelItem[]
  attachments: Attachment[]
  variantCount?: number
  balanceCount?: number
  createdAt: string
  updatedAt: string
  createdBy: { id: number; name: string; photo: string | null } | null
}

export interface InventoryInitialStock {
  branchId: number
  new: number
  used: number
}

export interface InventoryVariantInput {
  name: string
  code?: string | null
  image?: string | null
  description?: string | null
  initialStock?: InventoryInitialStock[]
}

export interface InventoryPayload {
  code?: string | null
  name: string
  description?: string | null
  image?: string | null
  unit?: string | null
  subCategoryId?: number | null
  isActive?: boolean
  labels?: { key: string; value: string }[]
  variants?: InventoryVariantInput[]
  attachmentIds?: number[]
}

export interface InventoryVariant {
  id: number
  inventoryId: number
  name: string
  code: string | null
  image: string | null
  description: string | null
  isActive: boolean
  inventory?: { id: number; name: string; code: string | null } | null
}

export interface InventoryVariantPayload {
  inventoryId: number
  name: string
  code?: string | null
  image?: string | null
  description?: string | null
  isActive?: boolean
}

/** One row of the nested input table. */
export interface InventoryStockEntryRow {
  variantId: number
  name: string
  code: string | null
  unit: string
  new: number
  used: number
}

export interface InventoryStockBalance {
  id: number
  condition: StockCondition
  quantity: number
  updatedAt: string
  branch: { id: number; name: string } | null
  variant: {
    id: number
    name: string
    code: string | null
    unit: string
    inventory: { id: number; name: string; code: string | null } | null
  } | null
}

export interface InventoryStockTransferItem {
  variantId: number
  condition: StockCondition
  quantity: number
}

/** A persisted transfer document (history row). */
export interface InventoryStockTransfer {
  id: number
  note: string | null
  createdAt: string
  fromBranch: { id: number; name: string } | null
  toBranch: { id: number; name: string } | null
  createdBy: { id: number; name: string; photo: string | null } | null
  items: {
    id: number
    condition: StockCondition
    quantity: number
    variant: { id: number; name: string; code: string | null; inventory: { id: number; name: string } | null } | null
  }[]
  attachments: Attachment[]
}

/** A stock-in document (incoming stock) — header + line items, like a transfer. */
export interface InventoryStockIn {
  id: number
  note: string | null
  createdAt: string
  createdBy: { id: number; name: string; photo: string | null } | null
  items: {
    id: number
    condition: StockCondition
    quantity: number
    balanceAfter: number | null
    branch: { id: number; name: string } | null
    variant: { id: number; name: string; code: string | null; inventory: { id: number; name: string } | null } | null
  }[]
  attachments: Attachment[]
}

export interface InventoryStockOutLineItem {
  id: number
  conditionAssigned: StockCondition
  quantity: number
  quantityReturned: number
  quantityRemaining: number
  returnedDate: string | null
  returnNote: string | null
  returnHandoverId: number | null
  branch: { id: number; name: string } | null
  variant: {
    id: number
    name: string
    code: string | null
    unit: string
    inventory: { id: number; name: string; code: string | null } | null
  } | null
}

/** A stock-out document — header + line items, like a stock-in document. */
export interface InventoryStockOut {
  id: number
  type: StockOutType
  assignedDate: string
  assignNote: string | null
  assignHandoverId: number | null
  employee: { id: number; name: string; employeeId: string } | null
  createdAt: string
  createdBy: { id: number; name: string; photo: string | null } | null
  items: InventoryStockOutLineItem[]
  attachments: Attachment[]
}

export interface InventoryStockAssignItem {
  variantId: number
  branchId: number
  condition: StockCondition
  quantity: number
}

export interface InventoryStockReturnItem {
  variantId: number
  branchId: number
  quantity: number
}
