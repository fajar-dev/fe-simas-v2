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
