export interface Permission {
  id: number
  key: string
  module: string
  action: string
}

export interface Role {
  id: number
  name: string
  isSuperAdmin: boolean
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export interface RolePayload {
  name: string
  permissionIds: number[]
}
