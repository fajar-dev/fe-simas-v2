export interface AssetLocation {
  id: number
  assetId: number
  locationId: number
  date: string
  note: string | null
  createdAt: string
  updatedAt: string
  asset: {
    id: number
    name: string
    code: string
  } | null
  location: {
    id: number
    name: string
    description: string | null
  } | null
  createdBy: {
    id: number
    name: string
    photo: string | null
  } | null
}

export interface AssetLocationPayload {
  assetId: number
  locationId: number
  date: string
  note?: string
}
