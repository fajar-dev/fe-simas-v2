import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Organization, OrganizationOption, OrganizationPayload } from "../types/organization"
import type { ApiResponse } from "../types/api"

export class OrganizationService {

    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(page = 1, perPage = 10, q = '', sortBy = '', order = ''): Promise<ApiResponse<Organization[]>> {
        try {
            let url = `/organization?page=${page}&limit=${perPage}&q=${q}`
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            const response = await apiService.client.get<ApiResponse<Organization[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    /** Flat, unpaginated — for parent pickers. */
    async getList(): Promise<ApiResponse<OrganizationOption[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<OrganizationOption[]>>(
                `/organization/list`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<Organization>> {
        try {
            const response = await apiService.client.get<ApiResponse<Organization>>(
                `/organization/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: OrganizationPayload): Promise<ApiResponse<Organization>> {
        try {
            const response = await apiService.client.post<ApiResponse<Organization>>(
                `/organization`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, payload: Partial<OrganizationPayload>): Promise<ApiResponse<Organization>> {
        try {
            const response = await apiService.client.put<ApiResponse<Organization>>(
                `/organization/${id}`,
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
                `/organization/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const organizationService = new OrganizationService()
