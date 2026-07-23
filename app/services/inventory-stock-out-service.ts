import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { StockOutType, InventoryStockOut, InventoryStockAssignItem, InventoryStockReturnItem } from "../types/inventory"
import type { ApiResponse } from "../types/api"

export class InventoryStockOutService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(page = 1, perPage = 20, filters: { inventoryId?: number; branchId?: number; variantId?: number; employeeId?: number; active?: boolean } = {}): Promise<ApiResponse<InventoryStockOut[]>> {
    try {
      let url = `/inventory-stock-out?page=${page}&limit=${perPage}`
      if (filters.inventoryId) url += `&inventoryId=${filters.inventoryId}`
      if (filters.branchId) url += `&branchId=${filters.branchId}`
      if (filters.variantId) url += `&variantId=${filters.variantId}`
      if (filters.employeeId) url += `&employeeId=${filters.employeeId}`
      if (filters.active) url += `&active=true`
      const res = await apiService.client.get<ApiResponse<InventoryStockOut[]>>(url, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async assign(payload: { type: StockOutType; employeeId?: number | null; note?: string | null; attachmentIds?: number[]; items: InventoryStockAssignItem[] }): Promise<ApiResponse<InventoryStockOut[]>> {
    try {
      const res = await apiService.client.post<ApiResponse<InventoryStockOut[]>>(`/inventory-stock-out`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async returnStock(payload: { employeeId: number; note?: string | null; items: InventoryStockReturnItem[] }): Promise<ApiResponse<null>> {
    try {
      const res = await apiService.client.post<ApiResponse<null>>(`/inventory-stock-out/return`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }
}

export const inventoryStockOutService = new InventoryStockOutService()
export default inventoryStockOutService
