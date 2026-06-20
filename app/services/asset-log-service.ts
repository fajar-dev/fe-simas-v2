import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { AssetLog } from "../types/asset-log"
import type { ApiResponse } from "../types/api"

export class AssetLogService {
    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(
        page = 1,
        perPage = 10,
        q = '',
        sortBy = '',
        order = '',
        assetId?: number
    ): Promise<ApiResponse<AssetLog[]>> {
        try {
            let url = `/asset-log?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            if (assetId) url += `&assetId=${assetId}`

            const response = await apiService.client.get<ApiResponse<AssetLog[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const assetLogService = new AssetLogService()
export default assetLogService
