export interface InventoryLog {
  id: number
  inventoryId: number
  module: string
  action: string
  description: string
  createdAt: string
  createdBy: {
    id: number
    name: string
    photo: string | null
    email: string
  } | null
}
