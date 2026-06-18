export interface UpdateProfilePayload {
  name: string
  email: string
  photo?: string | null
}

export interface UpdatePasswordPayload {
  oldPassword?: string
  newPassword: string
}
