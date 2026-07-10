export type StockCondition = 'new' | 'used'

export interface Inventory {
  id: number
  code: string | null
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: { id: number; name: string; photo: string | null } | null
}

export interface InventoryPayload {
  code?: string | null
  name: string
  description?: string | null
  isActive?: boolean
}

export interface InventoryVariant {
  id: number
  productId: number
  name: string
  code: string | null
  unit: string
  isActive: boolean
  product?: { id: number; name: string; code: string | null } | null
}

export interface InventoryVariantPayload {
  productId: number
  name: string
  code?: string | null
  unit?: string
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
    product: { id: number; name: string; code: string | null } | null
  } | null
}

export interface InventoryStockTransferItem {
  variantId: number
  condition: StockCondition
  quantity: number
}

export type StockMovementType = 'entry' | 'adjustment' | 'transfer_out' | 'transfer_in' | 'assign_out' | 'return_in'

export interface InventoryStockMovement {
  id: number
  type: StockMovementType
  condition: StockCondition
  quantity: number
  balanceAfter: number | null
  referenceId: string | null
  note: string | null
  createdAt: string
  branch: { id: number; name: string } | null
  variant: { id: number; name: string; product: { id: number; name: string } | null } | null
  createdBy: { id: number; name: string; photo: string | null } | null
}

export interface InventoryStockHolding {
  id: number
  conditionAssigned: StockCondition
  quantity: number
  quantityReturned: number
  quantityRemaining: number
  assignedDate: string
  returnedDate: string | null
  assignNote: string | null
  returnNote: string | null
  assignHandoverId: number | null
  returnHandoverId: number | null
  employee: { id: number; name: string; employeeId: string } | null
  branch: { id: number; name: string } | null
  variant: {
    id: number
    name: string
    code: string | null
    unit: string
    product: { id: number; name: string; code: string | null } | null
  } | null
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
