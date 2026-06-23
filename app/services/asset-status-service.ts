import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { AssetStatus } from "../types/asset"
import type { ApiResponse } from "../types/api"

export interface CreateAssetStatusPayload {
    assetId: number
    status: string
    note?: string | null
}

export interface BulkCreateAssetStatusPayload {
    assetIds: number[]
    status: string
    note?: string | null
}

export class AssetStatusService {

    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getByAssetId(assetId: number, page = 1, limit = 10): Promise<ApiResponse<AssetStatus[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<AssetStatus[]>>(
                `/asset-status?assetId=${assetId}&page=${page}&limit=${limit}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: CreateAssetStatusPayload): Promise<ApiResponse<AssetStatus>> {
        try {
            const response = await apiService.client.post<ApiResponse<AssetStatus>>(
                `/asset-status`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async bulkCreate(payload: BulkCreateAssetStatusPayload): Promise<ApiResponse<AssetStatus[]>> {
        try {
            const response = await apiService.client.post<ApiResponse<AssetStatus[]>>(
                `/asset-status/bulk`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const assetStatusService = new AssetStatusService()
