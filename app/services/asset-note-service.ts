import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { AssetNote, AssetNotePayload } from "../types/asset-note"
import type { ApiResponse } from "../types/api"

export class AssetNoteService {
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
    ): Promise<ApiResponse<AssetNote[]>> {
        try {
            let url = `/asset-note?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            if (assetId) url += `&assetId=${assetId}`

            const response = await apiService.client.get<ApiResponse<AssetNote[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<AssetNote>> {
        try {
            const response = await apiService.client.get<ApiResponse<AssetNote>>(
                `/asset-note/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: AssetNotePayload): Promise<ApiResponse<AssetNote>> {
        try {
            const response = await apiService.client.post<ApiResponse<AssetNote>>(
                `/asset-note`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, payload: AssetNotePayload): Promise<ApiResponse<AssetNote>> {
        try {
            const response = await apiService.client.put<ApiResponse<AssetNote>>(
                `/asset-note/${id}`,
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
                `/asset-note/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getLabelKeys(assetId?: number): Promise<ApiResponse<string[]>> {
        let url = `/asset-note/label-keys`
        if (assetId) url += `?assetId=${assetId}`
        const response = await apiService.client.get<ApiResponse<string[]>>(
            url, this.authHeaders
        )
        return response.data
    }
}

export const assetNoteService = new AssetNoteService()
export default assetNoteService
