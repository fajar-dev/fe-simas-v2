export type BadgeColor = 'success' | 'neutral' | 'primary' | 'warning' | 'error'

export interface StatusConfig {
    i18nKey: string
    color: BadgeColor
    icon: string
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
    active: { i18nKey: 'common.statusActive', color: 'success', icon: 'i-lucide-circle-check' },
    idle: { i18nKey: 'common.statusIdle', color: 'neutral', icon: 'i-lucide-pause-circle' },
    under_repair: { i18nKey: 'common.statusUnderRepair', color: 'warning', icon: 'i-lucide-wrench' },
    damaged: { i18nKey: 'common.statusDamaged', color: 'error', icon: 'i-lucide-alert-triangle' },
    lost: { i18nKey: 'common.statusLost', color: 'error', icon: 'i-lucide-search-x' },
    sold: { i18nKey: 'common.statusSold', color: 'primary', icon: 'i-lucide-banknote' },
    disposed: { i18nKey: 'common.statusDisposed', color: 'neutral', icon: 'i-lucide-trash-2' },
}

export const getStatusLabel = (status: string) => {
    const config = STATUS_CONFIG[status]
    if (!config) return status
    const { t } = useI18n()
    return t(config.i18nKey)
}
export const getStatusColor = (status: string): BadgeColor => STATUS_CONFIG[status]?.color || 'neutral'
export const getStatusIcon = (status: string) => STATUS_CONFIG[status]?.icon || 'i-lucide-activity'

export const getStatusOptions = () => {
    const { t } = useI18n()
    return Object.entries(STATUS_CONFIG).map(([value, config]) => ({
        label: t(config.i18nKey),
        value,
    }))
}
