import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { ApiResponse } from "../types/api"

export interface FeedbackItem {
  timestamp: string
  userId: string
  name: string
  images: string[]
  url: string
  message: string
  type: string
  category: string
  reply?: string | null
}

export interface FeedbackPayload {
  message: string
  type: string
  url?: string
  images: File[]
}

export class FeedbackService {
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  async getAll(): Promise<ApiResponse<FeedbackItem[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<FeedbackItem[]>>(
        "/feedback",
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  async create(payload: FeedbackPayload): Promise<ApiResponse<null>> {
    try {
      const formData = new FormData()
      formData.append("message", payload.message)
      formData.append("type", payload.type)
      if (payload.url) {
        formData.append("url", payload.url)
      }
      if (payload.images && payload.images.length > 0) {
        payload.images.forEach((file) => {
          formData.append("images[]", file)
        })
      }

      const response = await apiService.client.post<ApiResponse<null>>(
        "/feedback",
        formData,
        {
          headers: {
            ...this.authHeaders.headers,
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

export const feedbackService = new FeedbackService()
