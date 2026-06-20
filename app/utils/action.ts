export type BadgeColor = 'success' | 'neutral' | 'primary' | 'warning' | 'error'

export const getActionIcon = (action: string) => {
  const icons: Record<string, string> = {
    create: 'i-lucide-plus',
    update: 'i-lucide-edit-3',
    assign: 'i-lucide-user-plus',
    return: 'i-lucide-user-minus',
    relocate: 'i-lucide-map-pin',
    maintenance_create: 'i-lucide-wrench',
    maintenance_update: 'i-lucide-refresh-cw',
    maintenance_delete: 'i-lucide-trash',
  }
  return icons[action] || 'i-lucide-info'
}

export const getActionTheme = (action: string): { color: BadgeColor; label: string } => {
  const themes: Record<string, { color: BadgeColor; label: string }> = {
    create: { color: 'success', label: 'Create' },
    update: { color: 'neutral', label: 'Update' },
    assign: { color: 'primary', label: 'Assign' },
    return: { color: 'warning', label: 'Return' },
    relocate: { color: 'primary', label: 'Relocate' },
    maintenance_create: { color: 'success', label: 'Maintenance Create' },
    maintenance_update: { color: 'warning', label: 'Maintenance Update' },
    maintenance_delete: { color: 'error', label: 'Maintenance Delete' },
  }
  return themes[action] || { color: 'neutral', label: action }
}
