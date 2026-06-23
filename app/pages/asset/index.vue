<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      :title="$t('pages.asset.index.title')"
      :description="$t('pages.asset.index.description')"
    >
    </Header>

    <DataTable
      v-model:search="search"
      v-model:page="page"
      v-model:perPage="perPage"
      :data="data"
      :columns="columns"
      :loading="isLoading"
      :from="meta.from"
      :to="meta.to"
      :total="meta.total"
      :search-placeholder="$t('pages.asset.index.searchPlaceholder')"
      table-class="min-w-[1200px]"
    >
      <template #actions>
        <div class="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          <!-- Import & Export -->
          <div v-if="hasPermission('asset:import', 'asset:export')" class="flex items-center gap-2 w-full sm:w-auto">
            <UButton
              v-if="hasPermission('asset:import')"
              color="primary"
              variant="outline"
              icon="i-lucide-upload"
              class="flex-1 sm:flex-none justify-center"
              @click="showImportModal = true"
            >
              {{ $t('pages.asset.index.importAsset') }}
            </UButton>
            <UButton
              v-if="hasPermission('asset:export')"
              color="primary"
              variant="soft"
              icon="i-lucide-download"
              :loading="isExporting"
              class="flex-1 sm:flex-none justify-center"
              @click="handleExport"
            >
              {{ $t('pages.asset.index.exportAsset') }}
            </UButton>
          </div>

          <!-- Main Actions -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <UButton
              v-if="hasPermission('asset:create')"
              color="primary"
              variant="solid"
              icon="i-lucide-plus"
              to="/asset/create"
              class="flex-1 sm:flex-none justify-center"
            >
              {{ $t('pages.asset.index.addAsset') }}
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-filter"
              class="relative flex-1 sm:flex-none justify-center"
              @click="showFilterDrawer = true"
            >
              {{ $t('pages.asset.index.filter') }}
              <UBadge
                v-if="activeFilterCount > 0"
                :label="String(activeFilterCount)"
                color="primary"
                size="sm"
                variant="solid"
              />
            </UButton>
          
            <!-- Column Checklist Dropdown/Popover -->
            <UPopover>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-table-properties"
            />
            
            <template #content>
              <div class="p-3 w-48 space-y-2 select-none">
                <div class="text-sm font-semibold text-neutral-600 mb-1">
                  {{ $t('pages.asset.index.customLabels') }}
                </div>
                <div v-if="availableLabelKeys.length === 0" class="text-xs text-neutral-400 italic">
                  {{ $t('pages.asset.index.noCustomLabels') }}
                </div>
                <div v-else class="space-y-1.5 max-h-48 overflow-y-auto">
                  <div v-for="key in availableLabelKeys" :key="key" class="flex items-center gap-2">
                    <UCheckbox
                      :id="`col-${key}`"
                      :model-value="activeLabelColumns.includes(key)"
                      :label="key"
                      @update:model-value="(val: boolean) => toggleLabelColumn(key, val)"
                    />
                  </div>
                </div>
              </div>
            </template>
          </UPopover>
          </div>
        </div>
      </template>
    </DataTable>

    <!-- Bulk Action Bar -->
    <Transition name="">
      <div
        v-if="selectedIds.length > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/90  backdrop-blur-md border border-neutral-200 shadow-lg rounded-lg px-5 py-3"
      >
        <span class="text-sm font-medium text-neutral-900 whitespace-nowrap">
          {{ $t('pages.asset.index.selectedItems', { count: selectedIds.length }) }}
        </span>
        <UButton
          v-if="hasPermission('asset-status:create')"
          color="primary"
          variant="solid"
          icon="i-lucide-arrow-left-right"
          @click="showBulkStatusModal = true"
        >
          <span class="hidden sm:block">
            {{ $t('pages.asset.index.bulkChangeStatus') }}
          </span>
        </UButton>
        <UButton
          v-if="hasPermission('asset:delete')"
          color="error"
          variant="solid"
          icon="i-lucide-trash"
          @click="showBulkDeleteModal = true"
        >
          <span class="hidden sm:block">
            {{ $t('pages.asset.index.bulkDelete') }}
          </span>
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          @click="selectedIds = []"
        >
        <span class="hidden sm:block">
            {{ $t('pages.asset.index.clearSelection') }}
          </span>
        </UButton>
      </div>
    </Transition>

    <!-- Delete Modal -->
    <DeleteModal 
      v-model="showDeleteModal" 
      :title="$t('pages.asset.index.deleteTitle')" 
      :item-name="selectedAsset?.name" 
      :loading="isDeleting"
      @confirm="handleDelete" 
    />

    <!-- Change Status Modal -->
    <AssetStatusUpdateModal
      v-if="selectedAsset"
      v-model="showStatusModal"
      :asset-id="selectedAsset.id"
      @created="fetchAssets"
    />

    <!-- Bulk Change Status Modal -->
    <AssetStatusBulkUpdateModal
      v-model="showBulkStatusModal"
      :asset-ids="selectedIds"
      @created="onBulkStatusCreated"
    />

    <!-- Bulk Delete Modal -->
    <DeleteModal
      v-model="showBulkDeleteModal"
      :title="$t('pages.asset.index.bulkDeleteTitle')"
      :loading="isBulkDeleting"
      @confirm="handleBulkDelete"
    >
      <template #description>
        {{ $t('pages.asset.index.bulkDeleteDescription', { count: selectedIds.length }) }}
      </template>
    </DeleteModal>

    <!-- Lightbox Modal -->
    <Lightbox />

    <!-- Filter Drawer -->
    <AssetFilterDrawer
      v-model:open="showFilterDrawer"
      :initial-filters="activeFilters"
      @apply="onApplyFilters"
    />

    <!-- Import Modal -->
    <AssetImportModal
      v-model="showImportModal"
      @imported="fetchAssets"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { assetService } from '~/services/asset-service'
import type { Asset } from '~/types/asset'

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const { hasPermission } = useAuth()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const NuxtImg = resolveComponent('NuxtImg')
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')
const UCheckbox = resolveComponent('UCheckbox')
const UPopover = resolveComponent('UPopover')
const AssetStatusBadge = resolveComponent('AssetStatusBadge')

// State
const data = ref<Asset[]>([])
const isLoading = ref(false)
const activeFilters = ref<Record<string, any>>({})
const availableLabelKeys = ref<string[]>([])
const activeLabelColumns = ref<string[]>([])

const fetchLabelKeys = async () => {
  const res = await assetService.getLabelKeys()
  if (res.success) {
    availableLabelKeys.value = res.data
  }
}

const toggleLabelColumn = (key: string, checked: boolean) => {
  if (checked) {
    if (!activeLabelColumns.value.includes(key)) {
      activeLabelColumns.value.push(key)
    }
  } else {
    activeLabelColumns.value = activeLabelColumns.value.filter(k => k !== key)
  }
}

watch(activeLabelColumns, (newVal) => {
  localStorage.setItem('active_label_columns', JSON.stringify(newVal))
}, { deep: true })

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchAssets(), { syncUrl: true, filters: activeFilters })
const selectedAsset = ref<Asset | null>(null)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const isExporting = ref(false)
const showStatusModal = ref(false)
const showBulkStatusModal = ref(false)
const showBulkDeleteModal = ref(false)
const isBulkDeleting = ref(false)
const showFilterDrawer = ref(false)
const showImportModal = ref(false)
const selectedIds = ref<number[]>([])

const activeFilterCount = computed(() => Object.keys(activeFilters.value).length)

// Pagination meta
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

const { openLightbox } = useLightbox()

// Fetch assets from API
const fetchAssets = async () => {
  isLoading.value = true
  try {
    const response = await assetService.getAll(page.value, perPage.value, search.value, sortBy.value, order.value, activeFilters.value)
    if (response.success) {
      data.value = response.data
      if (response.meta) {
        meta.total = response.meta.total
        meta.from = response.meta.from
        meta.to = response.meta.to
      }
    }
  } finally {
    isLoading.value = false
  }
}

const onApplyFilters = (filters: Record<string, any>) => {
  activeFilters.value = filters
  page.value = 1
  fetchAssets()
}

const handleExport = async () => {
  isExporting.value = true
  try {
    await assetService.exportExcel(search.value, sortBy.value, order.value, activeFilters.value, activeLabelColumns.value)
    useToast().add({ title: t('pages.asset.index.exportSuccess'), icon:'i-lucide-check', color: 'success' })
  } finally {
    isExporting.value = false
  }
}

// Table columns
const baseColumns: TableColumn<Asset>[] = [
  {
    id: 'select',
    header: () => {
      const allSelected = data.value.length > 0 && data.value.every(a => selectedIds.value.includes(a.id))
      const someSelected = data.value.some(a => selectedIds.value.includes(a.id)) && !allSelected
      return h(UCheckbox, {
        'modelValue': allSelected,
        'indeterminate': someSelected,
        'onUpdate:modelValue': (val: boolean) => {
          if (val) {
            const newIds = [...selectedIds.value]
            data.value.forEach(a => {
              if (!newIds.includes(a.id)) newIds.push(a.id)
            })
            selectedIds.value = newIds
          } else {
            const currentPageIds = data.value.map(a => a.id)
            selectedIds.value = selectedIds.value.filter(id => !currentPageIds.includes(id))
          }
        }
      })
    },
    cell: ({ row }) => {
      return h(UCheckbox, {
        'modelValue': selectedIds.value.includes(row.original.id),
        'onUpdate:modelValue': (val: boolean) => {
          if (val) {
            selectedIds.value = [...selectedIds.value, row.original.id]
          } else {
            selectedIds.value = selectedIds.value.filter(id => id !== row.original.id)
          }
        }
      })
    },
    meta: {
      class: {
        td: 'w-10',
        th: 'w-10'
      }
    }
  },
  {
    id: 'no',
    header: t('pages.asset.index.columnNo'),
    cell: ({ row }) => {
      const rowNumber = (page.value - 1) * perPage.value + row.index + 1
      return h('span', { class: 'text-neutral-500' }, rowNumber)
    }
  },
  {
    id: 'asset',
    header: sortHeader(t('pages.asset.index.columnAsset'), 'name'),
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
            navigateTo(`/asset/${row.original.id}`)
          }
        }, row.original.name),
        h('span', { class: 'text-xs text-neutral-500' }, row.original.code)
      ])

      return h('div', { class: 'flex items-center gap-3' }, [imageEl, textEl])
    }
  },
  {
    id: 'category',
    header: sortHeader(t('pages.asset.index.columnCategory'), 'category'),
    cell: ({ row }) => {
      const cat = row.original.subCategory?.category
      return h('span', { class: 'text-neutral-900' }, cat?.name || '-')
    }
  },
  {
    id: 'subCategory',
    header: sortHeader(t('pages.asset.index.columnSubCategory'), 'subCategory'),
    cell: ({ row }) => {
      const sub = row.original.subCategory
      return h('span', { class: 'text-neutral-900' }, sub?.name || '-')
    }
  },
  {
    accessorKey: 'brand',
    header: sortHeader(t('pages.asset.index.columnBrand'), 'brand'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.brand || '-')
    }
  },
  {
    accessorKey: 'model',
    header: sortHeader(t('pages.asset.index.columnModel'), 'model'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.model || '-')
    }
  },
  {
    id: 'lastLocation',
    header: sortHeader(t('pages.asset.index.columnLastLocation'), 'lastLocation'),
    cell: ({ row }) => {
      const lastLoc = row.original.lastLocation
      if (!lastLoc || !lastLoc.location) return h('span', { class: 'text-neutral-500 italic' }, '-')
      const locName = lastLoc.location.name
      const branchName = lastLoc.location.branch?.name
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'text-neutral-900 font-semibold' }, locName),
        branchName ? h('span', { class: 'text-xs text-neutral-500' }, branchName) : null
      ])
    }
  },
  {
    id: 'activeHolder',
    header: sortHeader(t('pages.asset.index.columnActiveHolder'), 'activeHolder'),
    cell: ({ row }) => {
      const holder = row.original.activeHolder
      if (!holder || !holder.employee) return h('span', { class: 'text-neutral-500 italic' }, '-')
      const emp = holder.employee
      return h('div', { class: 'flex items-center gap-2 min-w-0' }, [
        h(UAvatar, {
          src: emp.photo || undefined,
          alt: emp.name,
          class: 'bg-primary-50 text-primary-700',
          loading: 'lazy'
        }),
        h('div', { class: 'flex flex-col min-w-0' }, [
          h('span', { class: 'text-neutral-900 font-semibold truncate' }, emp.name),
          h('span', { class: 'text-xs text-neutral-500' }, emp.employeeId)
        ])
      ])
    }
  },
  {
    accessorKey: 'price',
    header: sortHeader(t('pages.asset.index.columnPrice'), 'price'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, formatCurrency(row.original.price))
    }
  },
  {
    accessorKey: 'purchaseDate',
    header: sortHeader(t('pages.asset.index.columnPurchaseDate'), 'purchaseDate'),
    cell: ({ row }) => {
      const date = row.original.purchaseDate
      const age = row.original.age
      if (!date) return h('span', { class: 'text-neutral-600' }, '-')
      return h('div', { class: 'flex flex-col min-w-0' }, [
        age ? h('span', { class: 'font-medium text-neutral-900' }, age) : null,
        h('span', { class: 'text-xs text-neutral-500' }, date)
      ])
    }
  },
  {
    id: 'lastStatus',
    header: t('pages.asset.index.columnStatus'),
    cell: ({ row }) => {
      const status = row.original.lastStatus
      if (!status) return h('span', { class: 'text-neutral-500 italic' }, '-')
      return h(AssetStatusBadge, {
        status: status.status,
        note: status.note,
        createdAt: status.createdAt,
      })
    }
  }
]

const trailingColumns: TableColumn<Asset>[] = [
  {
    id: 'actions',
    header: t('pages.asset.index.columnAction'),
    meta: {
      class: {
        td: 'text-right',
        th: 'text-right'
      }
    },
    cell: ({ row }) => {
      const items = getRowItems(row)
      if (items.flat().length === 0) return h('span', { class: 'text-neutral-400 text-xs' }, '-')
      return h(
        UDropdownMenu,
        {
          content: {
            align: 'end'
          },
          items: items,
          'aria-label': 'Actions dropdown'
        },
        () =>
          h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            'aria-label': 'Actions dropdown'
          })
      )
    }
  }
]

const columns = computed(() => {
  const list = [...baseColumns]
  activeLabelColumns.value.forEach(key => {
    list.push({
      id: `label:${key}`,
      header: sortHeader(key, `label:${key}`),
      cell: ({ row }) => {
        const label = row.original.labels?.find(l => l.key === key)
        return h('span', { class: 'text-neutral-600' }, label ? label.value : '-')
      }
    })
  })
  return [...list, ...trailingColumns]
})

function getRowItems(row: Row<Asset>) {
  const primaryActions = []
  if (hasPermission('asset:update')) {
    primaryActions.push({
      label: t('pages.asset.index.editAsset'),
      icon: 'i-lucide-edit',
      onSelect() {
        navigateTo(`/asset/${row.original.id}/edit`)
      }
    })
  }
  if (hasPermission('asset-status:create')) {
    primaryActions.push({
      label: t('pages.asset.index.changeStatus'),
      icon: 'i-lucide-arrow-left-right',
      onSelect() {
        selectedAsset.value = row.original
        showStatusModal.value = true
      }
    })
  }
  if (hasPermission('asset:delete')) {
    primaryActions.push({
      label: t('pages.asset.index.deleteAsset'),
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedAsset.value = row.original
        showDeleteModal.value = true
      }
    })
  }

  const historyActions = []
  if (row.original.hasLocation !== false && hasPermission('asset-location:read')) {
    historyActions.push({
      label: t('pages.asset.index.locationHistory'),
      icon: 'i-lucide-map-pin',
      onSelect() {
        navigateTo(`/asset/${row.original.id}/location`)
      }
    })
  }
  if (row.original.hasHolder !== false && hasPermission('asset-holder:read')) {
    historyActions.push({
      label: t('pages.asset.index.holderHistory'),
      icon: 'i-lucide-user',
      onSelect() {
        navigateTo(`/asset/${row.original.id}/holder`)
      }
    })
  }
  if (row.original.hasMaintenance !== false && hasPermission('asset-maintenance:read')) {
    historyActions.push({
      label: t('pages.asset.index.maintenanceHistory'),
      icon: 'i-lucide-wrench',
      onSelect() {
        navigateTo(`/asset/${row.original.id}/maintenance`)
      }
    })
  }

  if (primaryActions.length > 0 && historyActions.length > 0) {
    return [primaryActions, historyActions]
  }
  if (primaryActions.length > 0) {
    return [primaryActions]
  }
  if (historyActions.length > 0) {
    return [historyActions]
  }
  return []
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedAsset.value) return
  isDeleting.value = true
  try {
    const response = await assetService.delete(selectedAsset.value.id)
    if (response.success) {
      toast.add({
        title: t('pages.asset.index.deleteSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchAssets()
  } finally {
    isDeleting.value = false
  }
}

// Clear selection when page/search/perPage/filters change
watch([page, search, perPage, activeFilters], () => {
  selectedIds.value = []
})

const onBulkStatusCreated = () => {
  selectedIds.value = []
  fetchAssets()
}

const handleBulkDelete = async () => {
  isBulkDeleting.value = true
  try {
    const response = await assetService.bulkDelete(selectedIds.value)
    if (response.success) {
      const { deleted, failed } = response.data
      if (failed.length > 0) {
        toast.add({
          title: t('pages.asset.index.bulkDeletePartial', { deleted, failed: failed.length }),
          color: 'warning',
          icon: 'i-lucide-alert-triangle'
        })
      } else {
        toast.add({
          title: t('pages.asset.index.bulkDeleteSuccess', { count: deleted }),
          color: 'success',
          icon: 'i-lucide-circle-check'
        })
      }
      selectedIds.value = []
      showBulkDeleteModal.value = false
      fetchAssets()
    }
  } finally {
    isBulkDeleting.value = false
  }
}

// Save current query string when visiting the asset list page
const route = useRoute()
watch(() => route.fullPath, (newPath) => {
  if (route.path === '/asset' || route.path === '/asset/') {
    const queryStr = route.fullPath.split('?')[1] || ''
    localStorage.setItem('last_asset_query', queryStr)
  }
}, { immediate: true })

// Initial fetch
onMounted(() => {
  const saved = localStorage.getItem('active_label_columns')
  if (saved) {
    try {
      activeLabelColumns.value = JSON.parse(saved)
    } catch { /* ignore */ }
  }
  fetchAssets()
  fetchLabelKeys()
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
