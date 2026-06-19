import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Attachment } from "../types/attachment"
import type { ApiResponse } from "../types/api"

export class AttachmentService {
    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async upload(file: File): Promise<ApiResponse<Attachment>> {
        try {
            const formData = new FormData()
            formData.append("file", file)
            const response = await apiService.client.post<ApiResponse<Attachment>>(
                `/attachment`,
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

    async delete(id: number): Promise<ApiResponse<null>> {
        try {
            const response = await apiService.client.delete<ApiResponse<null>>(
                `/attachment/${id}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const attachmentService = new AttachmentService()
export default attachmentService
