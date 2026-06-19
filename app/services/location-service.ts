import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Location, LocationPayload } from "../types/location"
import type { ApiResponse } from "../types/api"

export class LocationService {

    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getAll(page = 1, perPage = 10, q = '', branchId?: number, sortBy = '', order = ''): Promise<ApiResponse<Location[]>> {
        try {
            let url = `/location?page=${page}&limit=${perPage}&q=${q}`
            if (branchId !== undefined) {
                url += `&branchId=${branchId}`
            }
            if (sortBy) url += `&sortBy=${sortBy}`
            if (order) url += `&order=${order}`
            const response = await apiService.client.get<ApiResponse<Location[]>>(
                url,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getByBranchId(branchId: number): Promise<ApiResponse<Location[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<Location[]>>(
                `/location/by-branch/${branchId}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getById(id: number): Promise<ApiResponse<Location>> {
        try {
            const response = await apiService.client.get<ApiResponse<Location>>(
                `/location/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async create(payload: LocationPayload): Promise<ApiResponse<Location>> {
        try {
            const response = await apiService.client.post<ApiResponse<Location>>(
                `/location`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async update(id: number, payload: LocationPayload): Promise<ApiResponse<Location>> {
        try {
            const response = await apiService.client.put<ApiResponse<Location>>(
                `/location/${id}`,
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
                `/location/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const locationService = new LocationService()
