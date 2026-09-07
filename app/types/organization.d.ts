export interface Organization {
  id: number
  parentId: number | null
  parent: { id: number; name: string } | null
  name: string
  type: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Flat item from GET /organization/list — for dropdowns/parent pickers. */
export interface OrganizationOption {
  id: number
  parentId: number | null
  name: string
  type: string
  isActive: boolean
}

export interface OrganizationPayload {
  name: string
  type: string
  description?: string | null
  parentId?: number | null
  isActive?: boolean
}
