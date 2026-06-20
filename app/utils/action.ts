

export const getActionIcon = (module: string, action: string) => {
  const key = `${module}:${action}`
  const icons: Record<string, string> = {
    'asset:create': 'i-lucide-plus',
    'asset:update': 'i-lucide-edit-3',
    'holder:assign': 'i-lucide-user-plus',
    'holder:return': 'i-lucide-user-minus',
    'location:relocate': 'i-lucide-map-pin',
    'maintenance:create': 'i-lucide-wrench',
    'maintenance:update': 'i-lucide-refresh-cw',
    'maintenance:delete': 'i-lucide-trash',
    'status:update': 'i-lucide-activity',
  }
  return icons[key] || 'i-lucide-info'
}

export const getActionTheme = (module: string, action: string): { color: BadgeColor; label: string } => {
  const key = `${module}:${action}`
  const themes: Record<string, { color: BadgeColor; label: string }> = {
    'asset:create': { color: 'success', label: 'Asset Created' },
    'asset:update': { color: 'neutral', label: 'Asset Updated' },
    'holder:assign': { color: 'primary', label: 'Assigned' },
    'holder:return': { color: 'warning', label: 'Returned' },
    'location:relocate': { color: 'primary', label: 'Relocated' },
    'maintenance:create': { color: 'success', label: 'Maintenance Created' },
    'maintenance:update': { color: 'warning', label: 'Maintenance Updated' },
    'maintenance:delete': { color: 'error', label: 'Maintenance Deleted' },
    'status:update': { color: 'primary', label: 'Status Changed' },
  }
  return themes[key] || { color: 'neutral', label: `${module}:${action}` }
}
