export interface SubCategory {
    id: number
    name: string
    description: string | null
    categoryId: number
    category: {
        id: number
        name: string
    } | null
    createdAt: string
    updatedAt: string
}

export interface SubCategoryPayload {
    name: string
    description?: string
    categoryId: number
}
