import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { AssetSchedule, ScheduleOccurrence, AssetSchedulePayload } from "../types/asset-schedule"
import type { ApiResponse } from "../types/api"

export class AssetScheduleService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(
    page = 1,
    perPage = 10,
    q = "",
    sortBy = "",
    order = "",
    filters: { assetId?: number; recurrence?: string } = {}
  ): Promise<ApiResponse<AssetSchedule[]>> {
    try {
      let url = `/asset-schedule?page=${page}&limit=${perPage}&q=${encodeURIComponent(q)}`
      if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`
      if (order) url += `&order=${encodeURIComponent(order)}`
      if (filters.assetId) url += `&assetId=${filters.assetId}`
      if (filters.recurrence) url += `&recurrence=${encodeURIComponent(filters.recurrence)}`

      const response = await apiService.client.get<ApiResponse<AssetSchedule[]>>(url, this.authHeaders)
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  /** Expanded occurrences within [from, to] (YYYY-MM-DD) — powers the calendar grid. */
  async getCalendar(
    from: string,
    to: string,
    filters: { assetId?: number; recurrence?: string } = {}
  ): Promise<ApiResponse<ScheduleOccurrence[]>> {
    try {
      let url = `/asset-schedule/calendar?from=${from}&to=${to}`
      if (filters.assetId) url += `&assetId=${filters.assetId}`
      if (filters.recurrence) url += `&recurrence=${encodeURIComponent(filters.recurrence)}`

      const response = await apiService.client.get<ApiResponse<ScheduleOccurrence[]>>(url, this.authHeaders)
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async getById(id: number): Promise<ApiResponse<AssetSchedule>> {
    try {
      const response = await apiService.client.get<ApiResponse<AssetSchedule>>(
        `/asset-schedule/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async create(payload: AssetSchedulePayload): Promise<ApiResponse<AssetSchedule>> {
    try {
      const response = await apiService.client.post<ApiResponse<AssetSchedule>>(
        `/asset-schedule`,
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async update(id: number, payload: Partial<AssetSchedulePayload>): Promise<ApiResponse<AssetSchedule>> {
    try {
      const response = await apiService.client.put<ApiResponse<AssetSchedule>>(
        `/asset-schedule/${id}`,
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
        `/asset-schedule/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

export const assetScheduleService = new AssetScheduleService()
export default assetScheduleService
