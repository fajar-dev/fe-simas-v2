export interface AssetLog {
  id: number
  assetId: number
  action: string
  description: string
  createdAt: string
  createdBy: {
    id: number
    name: string
    photo: string | null
    email: string
  } | null
}
