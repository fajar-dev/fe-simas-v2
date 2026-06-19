import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Branch, BranchPayload } from "../types/branch"
import type { ApiResponse } from "../types/api"

export class BranchService {

    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(page = 1, perPage = 10, q = '', sortBy = '', order = ''): Promise<ApiResponse<Branch[]>> {
        try {
            let url = `/branch?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            const response = await apiService.client.get<ApiResponse<Branch[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<Branch>> {
        try {
            const response = await apiService.client.get<ApiResponse<Branch>>(
                `/branch/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: BranchPayload): Promise<ApiResponse<Branch>> {
        try {
            const response = await apiService.client.post<ApiResponse<Branch>>(
                `/branch`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, payload: BranchPayload): Promise<ApiResponse<Branch>> {
        try {
            const response = await apiService.client.put<ApiResponse<Branch>>(
                `/branch/${id}`,
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
                `/branch/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const branchService = new BranchService()
