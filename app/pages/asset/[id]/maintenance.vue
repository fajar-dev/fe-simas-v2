<template>
  <AssetDetailWrapper v-slot="{ asset, isLoading }">
    <div class="space-y-4">
      <DataTable
        v-model:search="search"
        v-model:page="page"
        v-model:perPage="perPage"
        :data="data"
        :columns="columns"
        :loading="isLoadingLogs"
        :from="meta.from"
        :to="meta.to"
        :total="meta.total"
        :search-placeholder="$t('pages.asset.maintenance.searchPlaceholder')"
        table-class="min-w-[600px]"
      >
        <template #actions>
          <div class="flex flex-row gap-2">
            <UButton
              v-if="hasPermission('asset-maintenance:create')"
              class="w-full lg:w-auto justify-center"
              color="primary"
              variant="solid"
              icon="i-lucide-plus"
              @click="() => { showAddModal = true }"
            >
              {{ $t('pages.asset.maintenance.addMaintenance') }}
            </UButton>
            <UPopover>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-table-properties"
              />
              <template #content>
                <div class="p-3 w-48 space-y-2 select-none">
                  <div class="text-sm font-semibold text-neutral-600 mb-1">
                    {{ $t('common.customLabels') }}
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
                        @update:model-value="(val: boolean | 'indeterminate') => { if (typeof val === 'boolean') toggleLabelColumn(key, val) }"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </UPopover>
          </div>
        </template>
      </DataTable>

      <!-- Add Modal -->
      <AssetMaintenanceAddModal
        v-model="showAddModal"
        :lock-asset-id="assetId"
        @created="fetchMaintenances"
      />

      <!-- Update Modal -->
      <AssetMaintenanceUpdateModal
        v-model="showUpdateModal"
        :maintenance="selectedMaintenance"
        :lock-asset-id="assetId"
        @updated="fetchMaintenances"
      />

      <!-- Delete Modal -->
      <DeleteModal 
        v-model="showDeleteModal" 
        :title="$t('pages.asset.maintenance.deleteTitle')" 
        :item-name="selectedMaintenance?.note ? `maintenance note: '${selectedMaintenance.note}'` : `maintenance ID: ${selectedMaintenance?.id}`" 
        :loading="isDeleting"
        @confirm="handleDelete" 
      />
    </div>
  </AssetDetailWrapper>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { assetMaintenanceService } from '~/services/asset-maintenance-service'
import type { AssetMaintenance } from '~/types/asset-maintenance'

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const assetId = Number(route.params.id)
const { hasPermission } = useAuth()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

// State
const data = ref<AssetMaintenance[]>([])
const isLoadingLogs = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchMaintenances())

const selectedMaintenance = ref<AssetMaintenance | null>(null)
const showAddModal = ref(false)
const showUpdateModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)

const availableLabelKeys = ref<string[]>([])
const activeLabelColumns = ref<string[]>([])
const LABEL_STORAGE_KEY = 'asset_maintenance_label_columns'

// Pagination meta
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

// Fetch maintenance events for this specific asset
const fetchMaintenances = async () => {
  isLoadingLogs.value = true
  try {
    const response = await assetMaintenanceService.getAll(
      page.value,
      perPage.value,
      search.value,
      sortBy.value,
      order.value,
      assetId
    )
    if (response.success && response.data) {
      data.value = response.data
      if (response.meta) {
        meta.total = response.meta.total
        meta.from = response.meta.from
        meta.to = response.meta.to
      }
    }
  } finally {
    isLoadingLogs.value = false
  }
}

const loadLabelKeys = async () => {
  const res = await assetMaintenanceService.getLabelKeys(assetId)
  if (res.success) availableLabelKeys.value = res.data
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

// Table columns
const baseColumns: TableColumn<AssetMaintenance>[] = [
  {
    accessorKey: 'date',
    header: sortHeader(t('pages.asset.maintenance.columnMaintenanceDate'), 'date'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-900 font-medium' }, row.original.date)
    }
  },
  {
    accessorKey: 'note',
    header: sortHeader(t('pages.asset.maintenance.columnNotes'), 'note'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600 truncate max-w-md block' }, row.original.note || '-')
    }
  },
  {
    accessorKey: 'cost',
    header: sortHeader(t('pages.asset.maintenance.columnCost'), 'cost'),
    cell: ({ row }) => {
      const cost = row.original.cost ?? 0
      return h('span', { class: 'text-neutral-900 font-medium tabular-nums' }, `Rp ${Number(cost).toLocaleString('id-ID')}`)
    }
  },
  {
    id: 'attachments',
    header: t('pages.asset.maintenance.columnAttachments'),
    cell: ({ row }) => {
      const attachments = row.original.attachments || []
      if (attachments.length === 0) return h('span', { class: 'text-neutral-400 text-xs' }, '-')

      const getAttachmentTheme = (mimeType: string) => {
        if (!mimeType) return { icon: 'i-lucide-file', color: 'neutral' as const }
        const type = mimeType.toLowerCase()
        if (type.startsWith('image/')) return { icon: 'i-lucide-image', color: 'success' as const }
        if (type.includes('pdf')) return { icon: 'i-lucide-file-text', color: 'error' as const }
        if (type.includes('word') || type.includes('officedocument') || type.includes('excel') || type.includes('sheet') || type.includes('powerpoint') || type.includes('presentation')) return { icon: 'i-lucide-file-text', color: 'primary' as const }
        if (type.includes('zip') || type.includes('rar') || type.includes('compressed') || type.includes('tar') || type.includes('gzip')) return { icon: 'i-lucide-archive', color: 'warning' as const }
        return { icon: 'i-lucide-file', color: 'neutral' as const }
      }

      // Render clickable mini badges for each attachment
      return h(
        'div',
        { class: 'flex flex-wrap gap-2 max-w-sm' },
        attachments.map(att => {
          const theme = getAttachmentTheme(att.mimeType)
          return h(
            'a',
            {
              href: att.url,
              target: '_blank',
              class: 'cursor-pointer inline-block max-w-[160px]'
            },
            [
              h(UBadge, {
                color: theme.color,
                variant: 'subtle',
                icon: theme.icon,
                label: att.originalName,
                class: 'max-w-full truncate'
              })
            ]
          )
        })
      )
    }
  }
]

const createdByColumn: TableColumn<AssetMaintenance> = {
  accessorKey: 'createdBy',
  header: sortHeader(t('pages.asset.maintenance.columnCreatedBy'), 'createdBy'),
  cell: ({ row }) => {
    const creator = row.original.createdBy
    if (creator) {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UAvatar, {
          src: creator.photo || undefined,
          alt: creator.name,
          size: 'xs',
          class: 'bg-primary-50 text-primary-700',
          loading: 'lazy'
        }),
        h('span', { class: 'text-neutral-700 font-medium text-sm' }, creator.name)
      ])
    } else {
      return h('span', { class: 'text-neutral-500 italic text-sm' }, t('pages.asset.maintenance.system'))
    }
  }
}

const columns = computed(() => {
  const list = [...baseColumns]
  activeLabelColumns.value.forEach(key => {
    list.push({
      id: `label:${key}`,
      header: key,
      cell: ({ row }: any) => {
        const label = row.original.labels?.find((l: any) => l.key === key)
        return h('span', { class: 'text-neutral-600' }, label ? label.value : '-')
      }
    })
  })
  list.push(createdByColumn)
  if (hasPermission('asset-maintenance:update', 'asset-maintenance:delete')) {
    list.push({
      id: 'actions',
      header: t('pages.asset.maintenance.columnAction'),
      meta: {
        class: {
          td: 'text-right',
          th: 'text-right'
        }
      },
      cell: ({ row }) => {
        return h(
          UDropdownMenu,
          {
            content: { align: 'end' },
            items: getRowItems(row),
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
    })
  }
  return list
})

function getRowItems(row: Row<AssetMaintenance>) {
  const actions = []
  if (hasPermission('asset-maintenance:update')) {
    actions.push({
      label: t('pages.asset.maintenance.editRecord'),
      icon: 'i-lucide-edit',
      onSelect() {
        selectedMaintenance.value = row.original
        showUpdateModal.value = true
      }
    })
  }
  if (hasPermission('asset-maintenance:delete')) {
    actions.push({
      label: t('pages.asset.maintenance.deleteRecord'),
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedMaintenance.value = row.original
        showDeleteModal.value = true
      }
    })
  }
  return actions
}

const toast = useToast()
const handleDelete = async () => {
  if (!selectedMaintenance.value) return
  isDeleting.value = true
  try {
    const response = await assetMaintenanceService.delete(selectedMaintenance.value.id)
    if (response.success) {
      toast.add({
        title: t('pages.asset.maintenance.deleteSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchMaintenances()
  } finally {
    isDeleting.value = false
  }
}

watch(activeLabelColumns, (val) => {
  localStorage.setItem(LABEL_STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

onMounted(() => {
  const saved = localStorage.getItem(LABEL_STORAGE_KEY)
  if (saved) activeLabelColumns.value = JSON.parse(saved)
  loadLabelKeys()
  fetchMaintenances()
})
</script>
