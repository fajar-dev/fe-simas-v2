import { UIcon } from '#components'
import type { Ref } from 'vue'

interface TableQueryOptions {
  defaultSortBy?: string
  defaultOrder?: 'ASC' | 'DESC'
  syncUrl?: boolean
  filters?: Ref<Record<string, any>>
}

export function useTableQuery(onQueryChange: () => void, options: TableQueryOptions = {}) {
  const { defaultSortBy = '', defaultOrder = 'DESC', syncUrl = false, filters } = options

  const route = syncUrl ? useRoute() : null
  const router = syncUrl ? useRouter() : null

  // Initialize from URL query params if syncUrl enabled
  const search = ref(syncUrl ? ((route!.query.q as string) || '') : '')
  const limitOptions = ref([10, 25, 50, 100])
  const perPage = ref(syncUrl ? (Number(route!.query.perPage) || 10) : 10)
  const page = ref(syncUrl ? (Number(route!.query.page) || 1) : 1)
  const sortBy = ref(syncUrl ? ((route!.query.sortBy as string) || defaultSortBy) : defaultSortBy)
  const order = ref<'ASC' | 'DESC'>(
    syncUrl
      ? ((route!.query.order as string)?.toUpperCase() === 'ASC' ? 'ASC' : (route!.query.order as string)?.toUpperCase() === 'DESC' ? 'DESC' : defaultOrder)
      : defaultOrder
  )

  // Initialize filters from URL query params
  if (syncUrl && filters) {
    const query = route!.query
    const parsedFilters: Record<string, any> = {}
    
    const numberFields = ['categoryId', 'subCategoryId', 'branchId', 'locationId', 'holderId', 'priceMin', 'priceMax']
    const stringFields = ['holderStatus', 'purchaseDateFrom', 'purchaseDateTo']
    
    numberFields.forEach(field => {
      if (query[field] !== undefined && query[field] !== '') {
        parsedFilters[field] = Number(query[field])
      }
    })
    
    stringFields.forEach(field => {
      if (query[field] !== undefined && query[field] !== '') {
        parsedFilters[field] = query[field]
      }
    })
    
    filters.value = parsedFilters
  }

  // Sync state to URL query params (only if enabled)
  const syncToUrl = () => {
    if (!syncUrl || !router) return
    const query: Record<string, any> = {}
    if (page.value > 1) query.page = String(page.value)
    if (perPage.value !== 10) query.perPage = String(perPage.value)
    if (search.value) query.q = search.value
    if (sortBy.value) query.sortBy = sortBy.value
    if (sortBy.value && order.value) query.order = order.value
    
    // Append filters to URL query
    if (filters && filters.value) {
      for (const [key, value] of Object.entries(filters.value)) {
        if (value !== undefined && value !== null && value !== '') {
          query[key] = String(value)
        }
      }
    }
    
    router.replace({ query })
  }

  const toggleSort = (column: string) => {
    if (sortBy.value === column) {
      order.value = order.value === 'ASC' ? 'DESC' : 'ASC'
    } else {
      sortBy.value = column
      order.value = 'ASC'
    }
  }

  // Watch for pagination, sorting and filter changes
  const watchSources = [page, perPage, sortBy, order] as any[]
  if (filters) {
    watchSources.push(filters)
  }

  watch(watchSources, () => {
    syncToUrl()
    onQueryChange()
  }, { deep: true })

  // Watch search with debounce
  let searchTimeout: ReturnType<typeof setTimeout>
  watch(search, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      page.value = 1
      syncToUrl()
      onQueryChange()
    }, 300)
  })

  const sortHeader = (label: string, column: string) => {
    return () => {
      const isActive = sortBy.value === column
      const upColor = isActive && order.value === 'ASC' ? 'text-primary' : 'text-neutral-300'
      const downColor = isActive && order.value === 'DESC' ? 'text-primary' : 'text-neutral-300'
      return h('div', {
        class: 'flex items-center gap-1 cursor-pointer select-none hover:text-primary transition-colors',
        onClick: () => toggleSort(column)
      }, [
        h('span', label),
        h('div', { class: 'flex flex-col -space-y-1.5' }, [
          h(UIcon, { name: 'i-lucide-chevron-up', class: `w-3 h-3 ${upColor}` }),
          h(UIcon, { name: 'i-lucide-chevron-down', class: `w-3 h-3 ${downColor}` }),
        ])
      ])
    }
  }

  return {
    search,
    limitOptions,
    perPage,
    page,
    sortBy,
    order,
    toggleSort,
    sortHeader
  }
}
