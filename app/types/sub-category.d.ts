export interface SubCategory {
    id: number
    code: string
    name: string
    description: string | null
    categoryId: number
    category: {
        id: number
        name: string
    } | null
    assetCount: number
    createdAt: string
    updatedAt: string
}

export interface SubCategoryPayload {
    code?: string
    name: string
    description?: string
    categoryId: number
}
