export const formatDate = (timestamp: string) => {
  if (!timestamp) return '-'

  const ts = Number(timestamp)
  const date = isNaN(ts) ? new Date(timestamp) : new Date(ts)

  if (isNaN(date.getTime())) return timestamp

  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

export const formatIndonesianNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return ''
  return new Intl.NumberFormat('id-ID').format(value)
}

export const parseIndonesianNumber = (value: string): number | undefined => {
  const clean = value.replace(/\./g, '').replace(/[^0-9]/g, '')
  if (!clean) return undefined
  const parsed = parseInt(clean, 10)
  return isNaN(parsed) ? undefined : parsed
}

export const formatPriceShort = (tick: number) => {
  if (tick >= 1_000_000_000) return `Rp ${(tick / 1_000_000_000).toFixed(1)} M`
  if (tick >= 1_000_000) return `Rp ${(tick / 1_000_000).toFixed(1)} Jt`
  if (tick >= 1_000) return `Rp ${(tick / 1_000).toFixed(0)} Rb`
  return `Rp ${tick}`
}

// Truncate an ISO datetime to "YYYY-MM-DD HH:mm"
export const formatDateTime = (val: string) => {
  if (!val) return '-'
  return val.replace('T', ' ').slice(0, 16)
}

// Keep only the date part of an ISO datetime ("YYYY-MM-DD")
export const formatDateOnly = (val: string) => {
  if (!val) return '-'
  return val.split('T')[0]
}

// Human-readable file size
export const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// Current local time as a datetime-local input value ("YYYY-MM-DDTHH:mm")
export const getLocalDatetimeString = () => {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

// Icon + NuxtUI badge color for an attachment based on its mime type
export const getAttachmentBadgeTheme = (mimeType: string): { icon: string, color: BadgeColor } => {
  if (!mimeType) return { icon: 'i-lucide-file', color: 'neutral' }
  const type = mimeType.toLowerCase()
  if (type.startsWith('image/')) return { icon: 'i-lucide-image', color: 'success' }
  if (type.includes('pdf')) return { icon: 'i-lucide-file-text', color: 'error' }
  if (type.includes('word') || type.includes('officedocument') || type.includes('excel') || type.includes('sheet') || type.includes('powerpoint') || type.includes('presentation')) return { icon: 'i-lucide-file-text', color: 'primary' }
  if (type.includes('zip') || type.includes('rar') || type.includes('compressed') || type.includes('tar') || type.includes('gzip')) return { icon: 'i-lucide-archive', color: 'warning' }
  return { icon: 'i-lucide-file', color: 'neutral' }
}

// Icon + background classes for an attachment based on its mime type
export const getAttachmentTheme = (mimeType: string) => {
  const type = (mimeType || '').toLowerCase()
  if (type.startsWith('image/')) return { icon: 'i-lucide-image', bg: 'bg-success/10 text-success' }
  if (type.includes('pdf')) return { icon: 'i-lucide-file-text', bg: 'bg-error/10 text-error' }
  if (type.includes('word') || type.includes('officedocument') || type.includes('excel') || type.includes('sheet') || type.includes('powerpoint') || type.includes('presentation')) {
    return { icon: 'i-lucide-file-text', bg: 'bg-primary/10 text-primary' }
  }
  if (type.includes('zip') || type.includes('rar') || type.includes('compressed') || type.includes('tar') || type.includes('gzip')) {
    return { icon: 'i-lucide-archive', bg: 'bg-warning/10 text-warning' }
  }
  return { icon: 'i-lucide-file', bg: 'bg-neutral-100 text-neutral-500' }
}
