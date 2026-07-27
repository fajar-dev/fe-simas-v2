import type { Attachment } from "./attachment"

export type ScheduleRecurrence = "none" | "weekly" | "monthly" | "yearly"

export interface ScheduleAssetRef {
  id: number
  name: string
  code: string
  image: string | null
}

export interface AssetSchedule {
  id: number
  title: string
  description: string | null
  startDate: string
  recurrence: ScheduleRecurrence
  daysOfWeek: number[] | null
  dayOfMonth: number | null
  month: number | null
  recurrenceEndDate: string | null
  assets: ScheduleAssetRef[]
  createdBy: {
    id: number
    name: string
    photo: string | null
  } | null
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

/** A single expanded calendar occurrence: the schedule plus the concrete date it lands on. */
export interface ScheduleOccurrence extends AssetSchedule {
  date: string
  isRecurring: boolean
}

export interface AssetSchedulePayload {
  assetIds: number[]
  title: string
  description?: string | null
  startDate: string
  recurrence: ScheduleRecurrence
  daysOfWeek?: number[] | null
  dayOfMonth?: number | null
  month?: number | null
  recurrenceEndDate?: string | null
  attachmentIds?: number[]
}
