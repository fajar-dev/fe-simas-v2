

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
    'note:create': 'i-lucide-sticky-note',
    'note:update': 'i-lucide-sticky-note',
    'note:delete': 'i-lucide-trash',
    'status:update': 'i-lucide-activity',
    'inventory:create': 'i-lucide-plus',
    'inventory:update': 'i-lucide-edit-3',
    'stock:entry': 'i-lucide-settings-2',
    'stock:stock_in': 'i-lucide-package-plus',
    'stock:transfer': 'i-lucide-arrow-left-right',
    'stock:assign': 'i-lucide-user-plus',
    'stock:return': 'i-lucide-user-minus',
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
    'note:create': { color: 'success', label: 'Note Created' },
    'note:update': { color: 'warning', label: 'Note Updated' },
    'note:delete': { color: 'error', label: 'Note Deleted' },
    'status:update': { color: 'primary', label: 'Status Changed' },
    'inventory:create': { color: 'success', label: 'Item Created' },
    'inventory:update': { color: 'neutral', label: 'Item Updated' },
    'stock:entry': { color: 'neutral', label: 'Stock Entry' },
    'stock:stock_in': { color: 'success', label: 'Stock In' },
    'stock:transfer': { color: 'primary', label: 'Transfer' },
    'stock:assign': { color: 'primary', label: 'Assigned' },
    'stock:return': { color: 'warning', label: 'Returned' },
  }
  return themes[key] || { color: 'neutral', label: `${module}:${action}` }
}
