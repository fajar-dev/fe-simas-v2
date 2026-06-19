export interface Attachment {
  id: number
  originalName: string
  filename: string
  mimeType: string
  size: number
  url: string
  entityType: string | null
  entityId: number | null
  createdAt: string
  updatedAt: string
}
