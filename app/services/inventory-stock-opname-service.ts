import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { InventoryStockOpname } from "../types/inventory"
import type { ApiResponse } from "../types/api"

export class InventoryStockOpnameService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(page = 1, perPage = 20, filters: { inventoryId: number }): Promise<ApiResponse<InventoryStockOpname[]>> {
    try {
      const url = `/inventory-stock-opname?inventoryId=${filters.inventoryId}&page=${page}&limit=${perPage}`
      const res = await apiService.client.get<ApiResponse<InventoryStockOpname[]>>(url, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async create(payload: { inventoryId: number; branchId: number; note?: string | null; attachmentIds?: number[]; items: { variantId: number; new: number; used: number }[] }): Promise<ApiResponse<InventoryStockOpname>> {
    try {
      const res = await apiService.client.post<ApiResponse<InventoryStockOpname>>(`/inventory-stock-opname`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }
}

export const inventoryStockOpnameService = new InventoryStockOpnameService()
export default inventoryStockOpnameService
