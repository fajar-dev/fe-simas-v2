import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { ApiResponse } from "../types/api"

export interface StatisticSummary {
    totalAssets: number
    totalPrice: number
    totalBookValue: number
    totalDepreciation: number
    totalCategories: number
    totalSubCategories: number
    totalLocations: number
    totalBranches: number
    totalActiveEmployees: number
}

export interface ChartGroupItem {
    name: string
    count: number
    totalPrice: number
    totalBookValue?: number
}

export interface LabelCountItem {
    label: string
    count: number
}

export interface DepreciationStat {
    summary: {
        totalWithDepreciation: number
        totalMonthlyDepreciation: number
        totalAccumulatedDepreciation: number
        totalBookValue: number
    }
    statusBreakdown: LabelCountItem[]
    byCategory: { name: string; originalPrice: number; bookValue: number }[]
}

export class StatisticService {
    private get authHeaders() {
        return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
    }

    private statusQuery(statuses?: string[]): string {
        if (!statuses?.length) return ""
        return `?status=${statuses.join(",")}`
    }

    async getSummary(statuses?: string[]): Promise<ApiResponse<StatisticSummary>> {
        try {
            const response = await apiService.client.get<ApiResponse<StatisticSummary>>(
                `/statistic/summary${this.statusQuery(statuses)}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getAssetsByCategory(statuses?: string[]): Promise<ApiResponse<ChartGroupItem[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<ChartGroupItem[]>>(
                `/statistic/assets-by-category${this.statusQuery(statuses)}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getAssetsByLocation(statuses?: string[]): Promise<ApiResponse<ChartGroupItem[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<ChartGroupItem[]>>(
                `/statistic/assets-by-location${this.statusQuery(statuses)}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getAssetsBySubCategory(statuses?: string[]): Promise<ApiResponse<ChartGroupItem[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<ChartGroupItem[]>>(
                `/statistic/assets-by-sub-category${this.statusQuery(statuses)}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getAssetAging(statuses?: string[]): Promise<ApiResponse<LabelCountItem[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<LabelCountItem[]>>(
                `/statistic/asset-aging${this.statusQuery(statuses)}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getDataQuality(statuses?: string[]): Promise<ApiResponse<LabelCountItem[]>> {
        try {
            const response = await apiService.client.get<ApiResponse<LabelCountItem[]>>(
                `/statistic/data-quality${this.statusQuery(statuses)}`,
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }

    async getDepreciation(): Promise<ApiResponse<DepreciationStat>> {
        try {
            const response = await apiService.client.get<ApiResponse<DepreciationStat>>(
                "/statistic/depreciation",
                this.authHeaders
            )
            return response.data
        } catch (error: any) {
            return handleServiceError(error)
        }
    }
}

export const statisticService = new StatisticService()
