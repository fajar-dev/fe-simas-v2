import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { InventoryLog } from "../types/inventory-log"
import type { ApiResponse } from "../types/api"

export class InventoryLogService {
    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(
        page = 1,
        perPage = 10,
        q = '',
        sortBy = '',
        order = '',
        inventoryId?: number
    ): Promise<ApiResponse<InventoryLog[]>> {
        try {
            let url = `/inventory-log?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            if (inventoryId) url += `&inventoryId=${inventoryId}`

            const response = await apiService.client.get<ApiResponse<InventoryLog[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const inventoryLogService = new InventoryLogService()
export default inventoryLogService
