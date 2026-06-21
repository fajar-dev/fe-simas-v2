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

export interface ChartGroupItem {
    name: string
    count: number
    totalPrice: number
}

export interface LabelCountItem {
    label: string
    count: number
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

    async getAssetsByCategory(): Promise<ApiResponse<ChartGroupItem[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<ChartGroupItem[]>>(
                "/statistic/assets-by-category",
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getAssetsByLocation(): Promise<ApiResponse<ChartGroupItem[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<ChartGroupItem[]>>(
                "/statistic/assets-by-location",
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getAssetsBySubCategory(): Promise<ApiResponse<ChartGroupItem[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<ChartGroupItem[]>>(
                "/statistic/assets-by-sub-category",
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getAssetAging(): Promise<ApiResponse<LabelCountItem[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<LabelCountItem[]>>(
                "/statistic/asset-aging",
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getDataQuality(): Promise<ApiResponse<LabelCountItem[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<LabelCountItem[]>>(
                "/statistic/data-quality",
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const statisticService = new StatisticService()
