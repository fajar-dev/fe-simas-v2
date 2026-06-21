import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { ApiResponse } from "../types/api"

export interface StatisticSummary {
    totalAssets: number
    totalPrice: number
    totalCategories: number
    totalSubCategories: number
    totalLocations: number
    totalBranches: number
}

export class StatisticService {
    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    async getSummary(): Promise<ApiResponse<StatisticSummary>> {
        try {
            const response = await apiService.client.get<ApiResponse<StatisticSummary>>(
                "/statistic/summary",
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const statisticService = new StatisticService()
