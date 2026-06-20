import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Asset, AssetPayload } from "../types/asset"
import type { ApiResponse } from "../types/api"

export class AssetService {

    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(page = 1, perPage = 10, q = '', sortBy = '', order = '', filters: Record<string, any> = {}): Promise<ApiResponse<Asset[]>> {
        try {
            let url = `/asset?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            // Append filter params
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null && value !== '') {
                    url += `&${key}=${encodeURIComponent(value)}`
                }
            }
            const response = await apiService.client.get<ApiResponse<Asset[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<Asset>> {
        try {
            const response = await apiService.client.get<ApiResponse<Asset>>(
                `/asset/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: AssetPayload): Promise<ApiResponse<Asset>> {
        try {
            const response = await apiService.client.post<ApiResponse<Asset>>(
                `/asset`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async checkCode(code: string, excludeId?: number): Promise<ApiResponse<{ exists: boolean }>> {
        try {
            let url = `/asset/check-code?code=${encodeURIComponent(code)}`
            if (excludeId) url += `&excludeId=${excludeId}`
            const response = await apiService.client.get<ApiResponse<{ exists: boolean }>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, payload: AssetPayload): Promise<ApiResponse<Asset>> {
        try {
            const response = await apiService.client.put<ApiResponse<Asset>>(
                `/asset/${id}`,
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
                `/asset/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async uploadImage(file: File): Promise<ApiResponse<{ path: string }>> {
        try {
            const formData = new FormData()
            formData.append("file", file)
            const response = await apiService.client.post<ApiResponse<{ path: string }>>(
                `/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${useAuth().state.token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getLabelKeys(): Promise<ApiResponse<string[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<string[]>>(
                `/asset/label-keys`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const assetService = new AssetService()
