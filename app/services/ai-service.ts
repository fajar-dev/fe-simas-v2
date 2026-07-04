import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { ApiResponse } from "../types/api"

export interface DecodeResult {
    type: string
    content: string
}

export class AiService {
    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async decodeBarcode(file: File): Promise<ApiResponse<DecodeResult>> {
        try {
            const formData = new FormData()
            formData.append("image", file)
            const response = await apiService.client.post<ApiResponse<DecodeResult>>(
                `/ai/decode-barcode`,
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

export const aiService = new AiService()
export default aiService
