import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { InventoryStockIn } from "../types/inventory"
import type { ApiResponse } from "../types/api"

export class InventoryStockInService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(page = 1, perPage = 20, filters: { inventoryId: number }): Promise<ApiResponse<InventoryStockIn[]>> {
    try {
      const url = `/inventory-stock-in?inventoryId=${filters.inventoryId}&page=${page}&limit=${perPage}`
      const res = await apiService.client.get<ApiResponse<InventoryStockIn[]>>(url, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async create(payload: { inventoryId: number; note?: string | null; attachmentIds?: number[]; items: { branchId: number; variantId: number; new: number; used: number }[] }): Promise<ApiResponse<InventoryStockIn>> {
    try {
      const res = await apiService.client.post<ApiResponse<InventoryStockIn>>(`/inventory-stock-in`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }
}

export const inventoryStockInService = new InventoryStockInService()
export default inventoryStockInService
