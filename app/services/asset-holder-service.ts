import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { AssetHolder, AssignAssetPayload, ReturnAssetPayload } from "../types/asset-holder"
import type { ApiResponse } from "../types/api"

export class AssetHolderService {
    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(
        page = 1,
        perPage = 10,
        q = '',
        sortBy = '',
        order = '',
        assetId?: number,
        employeeId?: number
    ): Promise<ApiResponse<AssetHolder[]>> {
        try {
            let url = `/asset-holder?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            if (assetId) url += `&assetId=${assetId}`
            if (employeeId) url += `&employeeId=${employeeId}`

            const response = await apiService.client.get<ApiResponse<AssetHolder[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<AssetHolder>> {
        try {
            const response = await apiService.client.get<ApiResponse<AssetHolder>>(
                `/asset-holder/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getActiveHolder(assetId: number): Promise<ApiResponse<AssetHolder | null>> {
        try {
            const response = await apiService.client.get<ApiResponse<AssetHolder | null>>(
                `/asset-holder/active/${assetId}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: AssignAssetPayload): Promise<ApiResponse<AssetHolder>> {
        try {
            const response = await apiService.client.post<ApiResponse<AssetHolder>>(
                `/asset-holder`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async returnAsset(id: number, payload: ReturnAssetPayload): Promise<ApiResponse<AssetHolder>> {
        try {
            const response = await apiService.client.post<ApiResponse<AssetHolder>>(
                `/asset-holder/${id}/return`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const assetHolderService = new AssetHolderService()
export default assetHolderService
