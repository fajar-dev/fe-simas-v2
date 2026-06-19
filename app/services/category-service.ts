import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Category, CategoryPayload } from "../types/category"
import type { ApiResponse } from "../types/api"

export class CategoryService {

    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(page = 1, perPage = 10, q = '', sortBy = '', order = ''): Promise<ApiResponse<Category[]>> {
        try {
            let url = `/category?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            const response = await apiService.client.get<ApiResponse<Category[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<Category>> {
        try {
            const response = await apiService.client.get<ApiResponse<Category>>(
                `/category/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: CategoryPayload): Promise<ApiResponse<Category>> {
        try {
            const response = await apiService.client.post<ApiResponse<Category>>(
                `/category`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, payload: CategoryPayload): Promise<ApiResponse<Category>> {
        try {
            const response = await apiService.client.put<ApiResponse<Category>>(
                `/category/${id}`,
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
                `/category/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const categoryService = new CategoryService()
