import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { AssetMaintenance, AssetMaintenancePayload } from "../types/asset-maintenance"
import type { ApiResponse } from "../types/api"

export class AssetMaintenanceService {
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
    ): Promise<ApiResponse<AssetMaintenance[]>> {
        try {
            let url = `/asset-maintenance?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            if (assetId) url += `&assetId=${assetId}`

            const response = await apiService.client.get<ApiResponse<AssetMaintenance[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<AssetMaintenance>> {
        try {
            const response = await apiService.client.get<ApiResponse<AssetMaintenance>>(
                `/asset-maintenance/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: AssetMaintenancePayload): Promise<ApiResponse<AssetMaintenance>> {
        try {
            const response = await apiService.client.post<ApiResponse<AssetMaintenance>>(
                `/asset-maintenance`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, payload: AssetMaintenancePayload): Promise<ApiResponse<AssetMaintenance>> {
        try {
            const response = await apiService.client.put<ApiResponse<AssetMaintenance>>(
                `/asset-maintenance/${id}`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async delete(id: number): Promise<ApiResponse<null>> {
        try {
            const response = await apiService.client.delete<ApiResponse<null>>(
                `/asset-maintenance/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const assetMaintenanceService = new AssetMaintenanceService()
export default assetMaintenanceService
