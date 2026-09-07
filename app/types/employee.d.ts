export interface Employee {
  id: number
  employeeId: string
  name: string
  jobPosition: string
  email: string
  phone: string
  photo: string | null
  isActive: boolean
  organizationId: number | null
  organization: { id: number; name: string } | null
  assetCount: number
  createdAt: string
}

export interface EmployeePayload {
  employeeId: string
  name: string
  jobPosition: string
  email: string
  phone: string
  photo?: string | null
  isActive?: boolean
  organizationId?: number | null
}
