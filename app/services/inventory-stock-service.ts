import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { InventoryStockBalance, InventoryStockEntryRow, StockCondition, InventoryStockHolding, InventoryStockAssignItem, InventoryStockReturnItem } from "../types/inventory"
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

  async getHoldings(page = 1, perPage = 20, filters: { inventoryId?: number; branchId?: number; variantId?: number; employeeId?: number; active?: boolean } = {}): Promise<ApiResponse<InventoryStockHolding[]>> {
    try {
      let url = `/inventory/stock/holding?page=${page}&limit=${perPage}`
      if (filters.inventoryId) url += `&inventoryId=${filters.inventoryId}`
      if (filters.branchId) url += `&branchId=${filters.branchId}`
      if (filters.variantId) url += `&variantId=${filters.variantId}`
      if (filters.employeeId) url += `&employeeId=${filters.employeeId}`
      if (filters.active) url += `&active=true`
      const res = await apiService.client.get<ApiResponse<InventoryStockHolding[]>>(url, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async assign(payload: { employeeId: number; note?: string | null; items: InventoryStockAssignItem[] }): Promise<ApiResponse<InventoryStockHolding[]>> {
    try {
      const res = await apiService.client.post<ApiResponse<InventoryStockHolding[]>>(`/inventory/stock/assign`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async returnStock(payload: { employeeId: number; note?: string | null; items: InventoryStockReturnItem[] }): Promise<ApiResponse<null>> {
    try {
      const res = await apiService.client.post<ApiResponse<null>>(`/inventory/stock/return`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }
}

export const inventoryStockService = new InventoryStockService()
export default inventoryStockService
