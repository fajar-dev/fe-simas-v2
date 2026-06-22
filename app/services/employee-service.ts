import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Employee, EmployeePayload } from "../types/employee"
import type { ApiResponse } from "../types/api"

export class EmployeeService {

    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(page = 1, perPage = 10, q = '', sortBy = '', order = ''): Promise<ApiResponse<Employee[]>> {
        try {
            let url = `/employee?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            const response = await apiService.client.get<ApiResponse<Employee[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getList(isActive?: boolean): Promise<ApiResponse<{ id: number; name: string; employeeId: string; photo: string | null }[]>> {
        try {
            let url = `/employee/list`
            if (isActive !== undefined) url += `?isActive=${isActive}`
            const response = await apiService.client.get<ApiResponse<{ id: number; name: string; employeeId: string; photo: string | null }[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<Employee>> {
        try {
            const response = await apiService.client.get<ApiResponse<Employee>>(
                `/employee/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: EmployeePayload): Promise<ApiResponse<Employee>> {
        try {
            const response = await apiService.client.post<ApiResponse<Employee>>(
                `/employee`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, payload: EmployeePayload): Promise<ApiResponse<Employee>> {
        try {
            const response = await apiService.client.put<ApiResponse<Employee>>(
                `/employee/${id}`,
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
                `/employee/${id}`,
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
                `/upload?type=employees`,
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

export const employeeService = new EmployeeService()
