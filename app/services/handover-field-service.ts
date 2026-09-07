import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { HandoverField, HandoverFieldInput } from "../types/handover-field"
import type { ApiResponse } from "../types/api"

export class HandoverFieldService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getByType(transactionType: 'assign' | 'return'): Promise<ApiResponse<HandoverField[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<HandoverField[]>>(
        `/handover-field?transactionType=${transactionType}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async replace(transactionType: 'assign' | 'return', fields: HandoverFieldInput[]): Promise<ApiResponse<HandoverField[]>> {
    try {
      const response = await apiService.client.put<ApiResponse<HandoverField[]>>(
        `/handover-field/${transactionType}`,
        { fields },
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

export const handoverFieldService = new HandoverFieldService()
export default handoverFieldService
