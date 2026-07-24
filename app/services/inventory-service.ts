import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Inventory, InventoryPayload } from "../types/inventory"
import type { ApiResponse } from "../types/api"

export class InventoryService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(page = 1, perPage = 10, q = '', sortBy = '', order = '', filters: Record<string, any> = {}): Promise<ApiResponse<Inventory[]>> {
    try {
      let url = `/inventory?page=${page}&limit=${perPage}&q=${encodeURIComponent(q)}`
      if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`
      if (order) url += `&order=${encodeURIComponent(order)}`
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue
        if (key === 'labels' && Array.isArray(value)) {
          for (const label of value) {
            if (label.key && label.value) {
              url += `&label.${encodeURIComponent(label.key)}=${encodeURIComponent(label.value)}`
            }
          }
        } else if (Array.isArray(value) && value.length > 0) {
          url += `&${key}=${value.join(',')}`
        } else if (!Array.isArray(value)) {
          url += `&${key}=${encodeURIComponent(value)}`
        }
      }
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

  async getLabelKeys(): Promise<ApiResponse<string[]>> {
    try {
      const res = await apiService.client.get<ApiResponse<string[]>>(`/inventory/label-keys`, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async uploadImage(file: File): Promise<ApiResponse<{ path: string }>> {
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await apiService.client.post<ApiResponse<{ path: string }>>(`/upload?type=inventory`, formData, {
        headers: { Authorization: `Bearer ${useAuth().state.token}`, "Content-Type": "multipart/form-data" }
      })
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
