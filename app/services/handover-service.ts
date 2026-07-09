import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { 
  Handover, 
  CreateHandoverPayload, 
} from "../types/handover"
import type { ApiResponse } from "../types/api"

export class HandoverService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(
    page = 1,
    perPage = 10,
    q = '',
    sortBy = '',
    order = '',
    status = '',
    transactionType = ''
  ): Promise<ApiResponse<Handover[]>> {
    try {
      let url = `/handover?page=${page}&limit=${perPage}&q=${encodeURIComponent(q)}`
      if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`
      if (order) url += `&order=${encodeURIComponent(order)}`
      if (status) url += `&status=${encodeURIComponent(status)}`
      if (transactionType) url += `&transactionType=${encodeURIComponent(transactionType)}`

      const response = await apiService.client.get<ApiResponse<Handover[]>>(
        url,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async getById(id: number): Promise<ApiResponse<Handover>> {
    try {
      const response = await apiService.client.get<ApiResponse<Handover>>(
        `/handover/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async create(payload: CreateHandoverPayload): Promise<ApiResponse<Handover>> {
    try {
      const response = await apiService.client.post<ApiResponse<Handover>>(
        `/handover`,
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async cancel(id: number): Promise<ApiResponse<Handover>> {
    try {
      const response = await apiService.client.post<ApiResponse<Handover>>(
        `/handover/${id}/cancel`,
        {},
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

export const handoverService = new HandoverService()
export default handoverService
