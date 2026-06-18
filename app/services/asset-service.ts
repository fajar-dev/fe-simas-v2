import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Asset, AssetPayload } from "../types/asset"
import type { ApiResponse } from "../types/api"

export class AssetService {

    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(page = 1, perPage = 10, q = ''): Promise<ApiResponse<Asset[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<Asset[]>>(
                `/asset?page=${page}&limit=${perPage}&q=${q}`,
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

    async checkCode(code: string): Promise<ApiResponse<{ exists: boolean }>> {
        try {
            const response = await apiService.client.get<ApiResponse<{ exists: boolean }>>(
                `/asset/check-code?code=${encodeURIComponent(code)}`,
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
}

export const assetService = new AssetService()
