export type HandoverFieldType = 'text' | 'number' | 'select' | 'radio' | 'date' | 'datetime'

export interface HandoverField {
  id: number
  transactionType: 'assign' | 'return'
  label: string
  key: string
  type: HandoverFieldType
  options: string[] | null
  required: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface HandoverFieldInput {
  label: string
  type: HandoverFieldType
  options?: string[] | null
  required?: boolean
}

/** Snapshot of a custom field stored on a handover. */
export interface HandoverCustomField {
  key: string
  label: string
  type: string
  value: string | null
}
