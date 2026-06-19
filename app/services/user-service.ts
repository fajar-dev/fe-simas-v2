import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { User, UserPayload } from "../types/user"
import type { ApiResponse } from "../types/api"

export class UserService {

    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(page = 1, perPage = 10, q = '', isActive = '', sortBy = '', order = ''): Promise<ApiResponse<User[]>> {
        try {
            let url = `/user?page=${page}&limit=${perPage}&q=${q}`
            if (isActive !== '') {
                url += `&isActive=${isActive}`
            }
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            const response = await apiService.client.get<ApiResponse<User[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.client.get<ApiResponse<User>>(
                `/user/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: UserPayload): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.client.post<ApiResponse<User>>(
                `/user`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, payload: UserPayload): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.client.put<ApiResponse<User>>(
                `/user/${id}`,
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
                `/user/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async uploadPhoto(file: File): Promise<ApiResponse<{ path: string }>> {
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

export const userService = new UserService()
