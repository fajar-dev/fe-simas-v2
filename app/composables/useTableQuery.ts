import { ref, watch, h, resolveComponent } from 'vue'

export function useTableQuery(onQueryChange: () => void, defaultSortBy: string = '', defaultOrder: 'ASC' | 'DESC' = 'DESC') {
  const search = ref('')
  const limitOptions = ref([10, 25, 50, 100])
  const perPage = ref(10)
  const page = ref(1)
  const sortBy = ref(defaultSortBy)
  const order = ref(defaultOrder)

  const toggleSort = (column: string) => {
    if (sortBy.value === column) {
      order.value = order.value === 'ASC' ? 'DESC' : 'ASC'
    } else {
      sortBy.value = column
      order.value = 'ASC'
    }
  }

  // Watch for pagination and sorting changes
  watch([page, perPage, sortBy, order], () => {
    onQueryChange()
  })

  // Watch search with debounce
  let searchTimeout: ReturnType<typeof setTimeout>
  watch(search, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      page.value = 1
      onQueryChange()
    }, 300)
  })

  const UIcon = resolveComponent('UIcon')

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
