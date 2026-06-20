export type BadgeColor = 'success' | 'neutral' | 'primary' | 'warning' | 'error'

export interface StatusConfig {
    label: string
    color: BadgeColor
    icon: string
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
    active: { label: 'Active', color: 'success', icon: 'i-lucide-circle-check' },
    idle: { label: 'Idle', color: 'neutral', icon: 'i-lucide-pause-circle' },
    under_repair: { label: 'Under Repair', color: 'warning', icon: 'i-lucide-wrench' },
    damaged: { label: 'Damaged', color: 'error', icon: 'i-lucide-alert-triangle' },
    lost: { label: 'Lost', color: 'error', icon: 'i-lucide-search-x' },
    sold: { label: 'Sold', color: 'primary', icon: 'i-lucide-banknote' },
    disposed: { label: 'Disposed', color: 'neutral', icon: 'i-lucide-trash-2' },
}

export const getStatusLabel = (status: string) => STATUS_CONFIG[status]?.label || status
export const getStatusColor = (status: string): BadgeColor => STATUS_CONFIG[status]?.color || 'neutral'
export const getStatusIcon = (status: string) => STATUS_CONFIG[status]?.icon || 'i-lucide-activity'
