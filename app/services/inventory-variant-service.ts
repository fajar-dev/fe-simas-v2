import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { InventoryVariant, InventoryVariantPayload } from "../types/inventory"
import type { ApiResponse } from "../types/api"

export class InventoryVariantService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getByInventory(inventoryId: number): Promise<ApiResponse<InventoryVariant[]>> {
    try {
      const res = await apiService.client.get<ApiResponse<InventoryVariant[]>>(`/inventory-variant?inventoryId=${inventoryId}`, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async create(payload: InventoryVariantPayload): Promise<ApiResponse<InventoryVariant>> {
    try {
      const res = await apiService.client.post<ApiResponse<InventoryVariant>>(`/inventory-variant`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async update(id: number, payload: Omit<InventoryVariantPayload, 'inventoryId'>): Promise<ApiResponse<InventoryVariant>> {
    try {
      const res = await apiService.client.put<ApiResponse<InventoryVariant>>(`/inventory-variant/${id}`, payload, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }

  async remove(id: number): Promise<ApiResponse<null>> {
    try {
      const res = await apiService.client.delete<ApiResponse<null>>(`/inventory-variant/${id}`, this.authHeaders)
      return res.data
    } catch (error: any) { return handleServiceError(error) }
  }
}

export const inventoryVariantService = new InventoryVariantService()
export default inventoryVariantService
