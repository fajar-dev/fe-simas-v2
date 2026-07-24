<template>
  <div class="space-y-6">
    <Header :title="$t('pages.inventory.item.title')" :description="$t('pages.inventory.item.description')" />

    <DataTable
      v-model:search="search"
      v-model:page="page"
      v-model:perPage="perPage"
      v-model:expanded="expanded"
      :data="data"
      :columns="columns"
      :loading="isLoading"
      :from="meta.from"
      :to="meta.to"
      :total="meta.total"
      :search-placeholder="$t('pages.inventory.item.searchPlaceholder')"
      table-class="min-w-[1000px]"
    >
      <template #expanded="{ row }">
        <div v-if="loadingVariants[row.original.id]" class="p-4 flex items-center gap-2 text-sm text-neutral-500">
          <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" /> {{ $t('common.loading') }}
        </div>
        <UTable
          v-else
          v-model:expanded="variantExpanded[row.original.id]"
          :expanded-options="{ getRowCanExpand: () => true }"
          :data="variantsCache[row.original.id] || []"
          :columns="variantColumns"
          :ui="{ th: 'bg-neutral-50 py-2', td: 'py-2' }"
          class="border border-neutral-200 rounded-md"
        >
          <template #expanded="{ row: variantRow }">
            <UTable
              :data="variantRow.original.branches"
              :columns="branchColumns"
              :ui="{ th: 'bg-neutral-50 py-2', td: 'py-2' }"
              class="border border-neutral-200 rounded-md"
            />
          </template>
        </UTable>
      </template>

      <template #actions>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UButton v-if="hasPermission('inventory:create')" color="primary" variant="solid" icon="i-lucide-plus" class="flex-1 sm:flex-none justify-center" @click="() => { navigateTo('/inventory/create') }">
            {{ $t('pages.inventory.item.add') }}
          </UButton>
          <UButton
            v-if="hasPermission('inventory:export')"
            color="primary"
            variant="soft"
            icon="i-lucide-download"
            :loading="isExporting"
            class="flex-1 sm:flex-none justify-center"
            @click="handleExport"
          >
            {{ $t('pages.inventory.item.exportInventory') }}
          </UButton>
          <UButton color="neutral" variant="soft" icon="i-lucide-filter" class="relative flex-1 sm:flex-none justify-center" @click="() => { showFilterDrawer = true }">
            {{ $t('pages.inventory.item.filter') }}
            <UBadge v-if="activeFilterCount > 0" :label="String(activeFilterCount)" color="primary" size="sm" variant="solid" />
          </UButton>
          <UPopover>
            <UButton color="neutral" variant="ghost" icon="i-lucide-table-properties" />
            <template #content>
              <div class="p-3 w-48 space-y-2 select-none">
                <div class="text-sm font-semibold text-neutral-600 mb-1">{{ $t('pages.inventory.item.labels') }}</div>
                <div v-if="availableLabelKeys.length === 0" class="text-xs text-neutral-400 italic">{{ $t('pages.inventory.item.noCustomLabels') }}</div>
                <div v-else class="space-y-1.5 max-h-48 overflow-y-auto">
                  <div v-for="key in availableLabelKeys" :key="key" class="flex items-center gap-2">
                    <UCheckbox :model-value="activeLabelColumns.includes(key)" :label="key" @update:model-value="(v: boolean | 'indeterminate') => toggleLabelColumn(key, v === true)" />
                  </div>
                </div>
              </div>
            </template>
          </UPopover>
        </div>
      </template>
    </DataTable>

    <InventoryVariantManagerModal v-model="showVariantModal" :inventory="selectedItem" @changed="fetchItems" />
    <DeleteModal v-model="showDeleteModal" :item-name="selectedItem?.name" :loading="deleting" @confirm="confirmDelete" />
    <!-- Lightbox Modal -->
    <Lightbox />

    <!-- Filter Drawer -->
    <InventoryFilterDrawer
      v-model:open="showFilterDrawer"
      :initial-filters="activeFilters"
      @apply="onApplyFilters"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { inventoryService } from '~/services/inventory-service'
import { inventoryVariantService } from '~/services/inventory-variant-service'
import { inventoryStockService } from '~/services/inventory-stock-service'
import type { Inventory, InventoryVariant } from '~/types/inventory'

interface BranchStockRow {
  branchId: number
  name: string
  newStock: number
  usedStock: number
}

interface VariantStockRow extends InventoryVariant {
  newStock: number
  usedStock: number
  branches: BranchStockRow[]
}

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const { hasPermission } = useAuth()
const toast = useToast()
const { openLightbox } = useLightbox()

const UButton = resolveComponent('UButton')
const NuxtImg = resolveComponent('NuxtImg')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UIcon = resolveComponent('UIcon')

const data = ref<Inventory[]>([])
const isLoading = ref(false)
const meta = reactive({ total: 0, from: 0, to: 0 })

const expanded = ref<Record<string, boolean>>({})
const variantsCache = reactive<Record<number, VariantStockRow[]>>({})
const loadingVariants = reactive<Record<number, boolean>>({})
const variantExpanded = reactive<Record<number, Record<string, boolean>>>({})

const toggleVariantRow = async (row: Row<Inventory>) => {
  const opening = !row.getIsExpanded()
  row.toggleExpanded()
  const id = row.original.id
  if (opening && !variantsCache[id]) {
    variantExpanded[id] = {}
    loadingVariants[id] = true
    try {
      const [variantsRes, balancesRes] = await Promise.all([
        inventoryVariantService.getByInventory(id),
        inventoryStockService.getBalances(1, 500, { inventoryId: id })
      ])
      if (variantsRes.success && variantsRes.data) {
        const stockByVariant = new Map<number, { new: number, used: number, branches: Map<number, BranchStockRow> }>()
        for (const b of balancesRes.data ?? []) {
          if (!b.variant || !b.branch) continue
          let entry = stockByVariant.get(b.variant.id)
          if (!entry) {
            entry = { new: 0, used: 0, branches: new Map() }
            stockByVariant.set(b.variant.id, entry)
          }
          if (b.condition === 'new') entry.new += b.quantity
          else entry.used += b.quantity

          let branchEntry = entry.branches.get(b.branch.id)
          if (!branchEntry) {
            branchEntry = { branchId: b.branch.id, name: b.branch.name, newStock: 0, usedStock: 0 }
            entry.branches.set(b.branch.id, branchEntry)
          }
          if (b.condition === 'new') branchEntry.newStock += b.quantity
          else branchEntry.usedStock += b.quantity
        }
        variantsCache[id] = variantsRes.data.map(v => {
          const entry = stockByVariant.get(v.id)
          return {
            ...v,
            newStock: entry?.new ?? 0,
            usedStock: entry?.used ?? 0,
            branches: entry ? Array.from(entry.branches.values()) : [],
          }
        })
      }
    } finally {
      loadingVariants[id] = false
    }
  }
}

const branchColumns: TableColumn<BranchStockRow>[] = [
  { accessorKey: 'name', header: t('common.branch'), cell: ({ row }) => h('span', { class: 'text-neutral-800 text-sm' }, row.original.name) },
  { accessorKey: 'newStock', header: t('pages.inventory.condition.new'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h('span', { class: 'text-emerald-600 text-sm font-medium' }, String(row.original.newStock)) },
  { accessorKey: 'usedStock', header: t('pages.inventory.condition.used'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h('span', { class: 'text-amber-600 text-sm font-medium' }, String(row.original.usedStock)) },
]

const variantColumns: TableColumn<VariantStockRow>[] = [
  { id: 'expand', header: '', meta: { class: { td: 'w-8', th: 'w-8' } }, cell: ({ row }) => {
    if (!row.original.branches.length) return null
    return h('button', {
      type: 'button',
      class: 'flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer',
      onClick: (e: Event) => { e.stopPropagation(); row.toggleExpanded() }
    }, [
      h(UIcon, { name: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right', class: 'w-4 h-4' })
    ])
  } },
  { accessorKey: 'name', header: t('common.name'), cell: ({ row }) => {
    const img = row.original.image
    const imageEl = img
      ? h(NuxtImg, { src: img, alt: row.original.name, class: 'w-9 h-9 object-cover rounded-md border border-neutral-200 shrink-0' })
      : h('div', { class: 'w-9 h-9 bg-neutral-100 rounded-md flex items-center justify-center border border-neutral-200 shrink-0' }, [
          h('span', { class: 'text-neutral-400 text-xs' }, 'N/A')
        ])
    const textEl = h('div', { class: 'flex flex-col min-w-0' }, [
      h('span', { class: 'text-neutral-900 font-medium text-sm' }, row.original.name),
      h('span', { class: 'text-xs text-neutral-500' }, row.original.code || '-')
    ])
    return h('div', { class: 'flex items-center gap-3' }, [imageEl, textEl])
  } },
  { accessorKey: 'description', header: t('common.description'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, row.original.description || '-') },
  { accessorKey: 'newStock', header: t('pages.inventory.condition.new'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h('span', { class: 'text-emerald-600 text-sm font-medium' }, String(row.original.newStock)) },
  { accessorKey: 'usedStock', header: t('pages.inventory.condition.used'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h('span', { class: 'text-amber-600 text-sm font-medium' }, String(row.original.usedStock)) },
]

const selectedItem = ref<Inventory | null>(null)
const showVariantModal = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)

const availableLabelKeys = ref<string[]>([])
const activeLabelColumns = ref<string[]>([])

const showFilterDrawer = ref(false)
const activeFilters = ref<Record<string, any>>({})
const activeFilterCount = computed(() => Object.keys(activeFilters.value).length)
const isExporting = ref(false)

const onApplyFilters = (filters: Record<string, any>) => {
  activeFilters.value = filters
}

const handleExport = async () => {
  isExporting.value = true
  try {
    await inventoryService.exportExcel(search.value, sortBy.value, order.value, activeFilters.value, activeLabelColumns.value)
    toast.add({ title: t('pages.inventory.item.exportSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
  } finally {
    isExporting.value = false
  }
}

const { search, page, perPage, sortBy, order, sortHeader } = useTableQuery(() => fetchItems(), { syncUrl: true, defaultSortBy: 'createdAt', defaultOrder: 'DESC', filters: activeFilters })

const fetchItems = async () => {
  isLoading.value = true
  try {
    const res = await inventoryService.getAll(page.value, perPage.value, search.value, sortBy.value, order.value, activeFilters.value)
    if (res.success && res.data) {
      data.value = res.data
      expanded.value = {}
      if (res.meta) { meta.total = res.meta.total; meta.from = res.meta.from; meta.to = res.meta.to }
    }
  } finally {
    isLoading.value = false
  }
}

const toggleLabelColumn = (key: string, on: boolean) => {
  activeLabelColumns.value = on
    ? [...activeLabelColumns.value, key]
    : activeLabelColumns.value.filter(k => k !== key)
  localStorage.setItem('inventory_label_columns', JSON.stringify(activeLabelColumns.value))
}

const columns = computed<TableColumn<Inventory>[]>(() => {
  const list: TableColumn<Inventory>[] = [
    {
      id: 'expand',
      header: '',
      meta: { class: { td: 'w-8', th: 'w-8' } },
      cell: ({ row }) => {
        if (!row.original.variantCount) return null
        return h('button', {
          type: 'button',
          class: 'flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer',
          onClick: (e: Event) => { e.stopPropagation(); toggleVariantRow(row) }
        }, [
          h(UIcon, { name: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right', class: 'w-4 h-4' })
        ])
      }
    },
    {
      id: 'no',
      header: t('pages.inventory.item.columnNo'),
      meta: { class: { td: 'w-12 text-neutral-500', th: 'w-12' } },
      cell: ({ row }) => h('span', { class: 'text-neutral-500' }, (page.value - 1) * perPage.value + row.index + 1)
    },
    {
    accessorKey: 'name',
    header: sortHeader(t('common.name'), 'name'),
    cell: ({ row }) => {
      const img = row.original.image
      const imageEl = img
        ? h(NuxtImg, {
            src: img,
            alt: row.original.name,
            class: 'w-10 h-10 object-cover rounded-md border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors shadow-2xs shrink-0',
            onClick: (e: Event) => {
              e.stopPropagation()
              openLightbox(img)
            }
          })
        : h('div', { class: 'w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center border border-neutral-200 shrink-0' }, [
            h('span', { class: 'text-neutral-400 text-xs' }, 'N/A')
          ])

      const textEl = h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { 
          class: 'font-semibold cursor-pointer hover:underline truncate',
          onClick: (e: Event) => {
            e.stopPropagation()
            navigateTo(`/inventory/${row.original.id}`)
          }
        }, row.original.name),
        h('span', { class: 'text-xs text-neutral-500' }, row.original.code || '-')
      ])

      return h('div', { class: 'flex items-center gap-3' }, [imageEl, textEl])
    }
  },
    { accessorKey: 'category', header: sortHeader(t('common.category'), 'category'), cell: ({ row }) => h('span', { class: 'text-neutral-700' }, row.original.category?.name || '-') },
    { accessorKey: 'subCategory', header: sortHeader(t('common.subCategory'), 'subCategory'), cell: ({ row }) => h('span', { class: 'text-neutral-700' }, row.original.subCategory?.name || '-') },
    { accessorKey: 'unit', header: sortHeader(t('pages.inventory.unit.label'), 'unit', 'center'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () => row.original.unit || '-') },
    { accessorKey: 'newCount', header: sortHeader(t('pages.inventory.condition.new'), 'newCount', 'center'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h('span', { class: 'text-emerald-600 text-sm font-medium' }, String(row.original.newCount ?? 0)) },
    { accessorKey: 'usedCount', header: sortHeader(t('pages.inventory.condition.used'), 'usedCount', 'center'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h('span', { class: 'text-amber-600 text-sm font-medium' }, String(row.original.usedCount ?? 0)) },
  ]

  for (const key of activeLabelColumns.value) {
    list.push({
      id: `label:${key}`,
      header: key,
      cell: ({ row }) => h('span', { class: 'text-neutral-600' }, row.original.labels?.find(l => l.key === key)?.value || '-')
    })
  }

  list.push({
    id: 'actions',
    header: t('common.actions'),
    meta: { class: { td: 'text-right', th: 'text-right' } },
    cell: ({ row }) => h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row), 'aria-label': 'Actions' },
      () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost' }))
  })
  return list
})

function getRowItems(row: Row<Inventory>) {
  const item = row.original
  const items: any[] = [{
    label: t('pages.inventory.detail.open'),
    icon: 'i-lucide-eye',
    onSelect() { navigateTo(`/inventory/${item.id}`) }
  }, {
    label: t('pages.inventory.variant.manageTitle'),
    icon: 'i-lucide-layers',
    onSelect() { selectedItem.value = item; showVariantModal.value = true }
  }]
  if (hasPermission('inventory:update')) {
    items.push({ label: t('common.edit'), icon: 'i-lucide-edit-3', onSelect() { navigateTo(`/inventory/${item.id}/edit`) } })
  }
  if (hasPermission('inventory:delete')) {
    items.push({ label: t('common.delete'), icon: 'i-lucide-trash-2', color: 'error' as const, onSelect() { selectedItem.value = item; showDeleteModal.value = true } })
  }
  return items
}

const confirmDelete = async () => {
  if (!selectedItem.value) return
  deleting.value = true
  try {
    const res = await inventoryService.remove(selectedItem.value.id)
    if (res.success) {
      toast.add({ title: t('common.delete'), color: 'success', icon: 'i-lucide-circle-check' })
      showDeleteModal.value = false
      fetchItems()
    } else {
      toast.add({ title: res.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  const saved = localStorage.getItem('inventory_label_columns')
  if (saved) { try { activeLabelColumns.value = JSON.parse(saved) } catch { /* ignore */ } }
  fetchItems()
  const keys = await inventoryService.getLabelKeys()
  if (keys.success && keys.data) availableLabelKeys.value = keys.data
})

// Save current query string when visiting the inventory list page
const route = useRoute()
watch(() => route.fullPath, () => {
  if (route.path === '/inventory' || route.path === '/inventory/') {
    const queryStr = route.fullPath.split('?')[1] || ''
    localStorage.setItem('last_inventory_query', queryStr)
  }
}, { immediate: true })
</script>
