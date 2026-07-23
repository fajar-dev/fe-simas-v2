import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { InventoryStockBalance, InventoryStockEntryRow, StockCondition } from "../types/inventory"
import type { ApiResponse } from "../types/api"

export class InventoryStockService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getEntryTemplate(branchId: number, inventoryId: number): Promise<ApiResponse<InventoryStockEntryRow[]>> {
    try {
      const res = await apiService.client.get<ApiResponse<InventoryStockEntryRow[]>>(`/inventory/stock/entry-template?branchId=${branchId}&inventoryId=${inventoryId}`, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async entry(payload: { branchId: number; inventoryId: number; items: { variantId: number; new: number; used: number }[] }): Promise<ApiResponse<InventoryStockBalance[]>> {
    try {
      const res = await apiService.client.post<ApiResponse<InventoryStockBalance[]>>(`/inventory/stock/entry`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async getBalances(page = 1, perPage = 20, filters: { branchId?: number; inventoryId?: number; variantId?: number; condition?: StockCondition } = {}): Promise<ApiResponse<InventoryStockBalance[]>> {
    try {
      let url = `/inventory/stock?page=${page}&limit=${perPage}`
      if (filters.branchId) url += `&branchId=${filters.branchId}`
      if (filters.inventoryId) url += `&inventoryId=${filters.inventoryId}`
      if (filters.variantId) url += `&variantId=${filters.variantId}`
      if (filters.condition) url += `&condition=${filters.condition}`
      const res = await apiService.client.get<ApiResponse<InventoryStockBalance[]>>(url, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }
}

export const inventoryStockService = new InventoryStockService()
export default inventoryStockService
