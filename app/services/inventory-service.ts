import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Inventory, InventoryPayload } from "../types/inventory"
import type { ApiResponse } from "../types/api"

export class InventoryService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(page = 1, perPage = 10, q = '', sortBy = '', order = ''): Promise<ApiResponse<Inventory[]>> {
    try {
      let url = `/inventory?page=${page}&limit=${perPage}&q=${encodeURIComponent(q)}`
      if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`
      if (order) url += `&order=${encodeURIComponent(order)}`
      const res = await apiService.client.get<ApiResponse<Inventory[]>>(url, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async getList(): Promise<ApiResponse<Inventory[]>> {
    try {
      const res = await apiService.client.get<ApiResponse<Inventory[]>>(`/inventory/list`, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async getById(id: number): Promise<ApiResponse<Inventory>> {
    try {
      const res = await apiService.client.get<ApiResponse<Inventory>>(`/inventory/${id}`, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async create(payload: InventoryPayload): Promise<ApiResponse<Inventory>> {
    try {
      const res = await apiService.client.post<ApiResponse<Inventory>>(`/inventory`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async update(id: number, payload: InventoryPayload): Promise<ApiResponse<Inventory>> {
    try {
      const res = await apiService.client.put<ApiResponse<Inventory>>(`/inventory/${id}`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async remove(id: number): Promise<ApiResponse<null>> {
    try {
      const res = await apiService.client.delete<ApiResponse<null>>(`/inventory/${id}`, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }
}

export const inventoryService = new InventoryService()
export default inventoryService
