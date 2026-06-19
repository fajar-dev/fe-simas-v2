import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { SubCategory, SubCategoryPayload } from "../types/sub-category"
import type { ApiResponse } from "../types/api"

export class SubCategoryService {

    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(page = 1, perPage = 10, q = '', categoryId?: number, sortBy = '', order = ''): Promise<ApiResponse<SubCategory[]>> {
        try {
            let url = `/sub-category?page=${page}&limit=${perPage}&q=${q}`
            if (categoryId !== undefined) {
                url += `&categoryId=${categoryId}`
            }
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            const response = await apiService.client.get<ApiResponse<SubCategory[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getByCategoryId(categoryId: number): Promise<ApiResponse<SubCategory[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<SubCategory[]>>(
                `/sub-category/by-category/${categoryId}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<SubCategory>> {
        try {
            const response = await apiService.client.get<ApiResponse<SubCategory>>(
                `/sub-category/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: SubCategoryPayload): Promise<ApiResponse<SubCategory>> {
        try {
            const response = await apiService.client.post<ApiResponse<SubCategory>>(
                `/sub-category`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, payload: SubCategoryPayload): Promise<ApiResponse<SubCategory>> {
        try {
            const response = await apiService.client.put<ApiResponse<SubCategory>>(
                `/sub-category/${id}`,
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
                `/sub-category/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const subCategoryService = new SubCategoryService()
