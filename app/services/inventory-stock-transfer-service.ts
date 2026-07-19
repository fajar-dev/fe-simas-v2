import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { InventoryStockTransferItem, InventoryStockTransfer } from "../types/inventory"
import type { ApiResponse } from "../types/api"

export class InventoryStockTransferService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(page = 1, perPage = 20, filters: { inventoryId: number }): Promise<ApiResponse<InventoryStockTransfer[]>> {
    try {
      const url = `/inventory-stock-transfer?inventoryId=${filters.inventoryId}&page=${page}&limit=${perPage}`
      const res = await apiService.client.get<ApiResponse<InventoryStockTransfer[]>>(url, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async create(payload: { fromBranchId: number; toBranchId: number; note?: string | null; attachmentIds?: number[]; items: InventoryStockTransferItem[] }): Promise<ApiResponse<{ referenceId: string; transferId: number }>> {
    try {
      const res = await apiService.client.post<ApiResponse<{ referenceId: string; transferId: number }>>(`/inventory-stock-transfer`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }
}

export const inventoryStockTransferService = new InventoryStockTransferService()
export default inventoryStockTransferService
