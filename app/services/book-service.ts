import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { AssetHolder } from "../types/asset-holder"
import type { ApiResponse } from "../types/api"

export class BookService {
    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async borrow(payload: {
        assetId: number
        assignNote?: string | null
        attachmentIds?: number[]
    }): Promise<ApiResponse<AssetHolder>> {
        try {
            const response = await apiService.client.post<ApiResponse<AssetHolder>>(
                `/book/borrow`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async returnBook(payload: {
        assetHolderId: number
        returnNote?: string | null
        attachmentIds?: number[]
    }): Promise<ApiResponse<AssetHolder>> {
        try {
            const response = await apiService.client.post<ApiResponse<AssetHolder>>(
                `/book/return`,
                payload,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getMyBooks(): Promise<ApiResponse<AssetHolder[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<AssetHolder[]>>(
                `/book/my-books`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const bookService = new BookService()
export default bookService