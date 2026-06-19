import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { AssetLocation, AssetLocationPayload } from "../types/asset-location"
import type { ApiResponse } from "../types/api"

export class AssetLocationService {
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
    ): Promise<ApiResponse<AssetLocation[]>> {
        try {
            let url = `/asset-location?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            if (assetId) url += `&assetId=${assetId}`

            const response = await apiService.client.get<ApiResponse<AssetLocation[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<AssetLocation>> {
        try {
            const response = await apiService.client.get<ApiResponse<AssetLocation>>(
                `/asset-location/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: AssetLocationPayload): Promise<ApiResponse<AssetLocation>> {
        try {
            const response = await apiService.client.post<ApiResponse<AssetLocation>>(
                `/asset-location`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const assetLocationService = new AssetLocationService()
export default assetLocationService
