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
    maximumFractionDigits: 0
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
