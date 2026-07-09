import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { 
  AssetHandover, 
  CreateAssetHandoverPayload, 
} from "../types/asset-handover"
import type { ApiResponse } from "../types/api"

export class AssetHandoverService {
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
  ): Promise<ApiResponse<AssetHandover[]>> {
    try {
      let url = `/asset-handover?page=${page}&limit=${perPage}&q=${encodeURIComponent(q)}`
      if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`
      if (order) url += `&order=${encodeURIComponent(order)}`
      if (status) url += `&status=${encodeURIComponent(status)}`
      if (transactionType) url += `&transactionType=${encodeURIComponent(transactionType)}`

      const response = await apiService.client.get<ApiResponse<AssetHandover[]>>(
        url,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async getById(id: number): Promise<ApiResponse<AssetHandover>> {
    try {
      const response = await apiService.client.get<ApiResponse<AssetHandover>>(
        `/asset-handover/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async create(payload: CreateAssetHandoverPayload): Promise<ApiResponse<AssetHandover>> {
    try {
      const response = await apiService.client.post<ApiResponse<AssetHandover>>(
        `/asset-handover`,
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async cancel(id: number): Promise<ApiResponse<AssetHandover>> {
    try {
      const response = await apiService.client.post<ApiResponse<AssetHandover>>(
        `/asset-handover/${id}/cancel`,
        {},
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

export const assetHandoverService = new AssetHandoverService()
export default assetHandoverService
