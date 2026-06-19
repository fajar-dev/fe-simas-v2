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
        search-placeholder="Search notes..."
        table-class="min-w-[600px]"
      >
        <template #actions>
          <UButton
            color="primary"
            variant="solid"
            icon="i-lucide-plus"
            @click="showAddModal = true"
          >
            Add Maintenance
          </UButton>
        </template>
      </DataTable>

      <!-- Add Modal -->
      <AddModal
        v-model="showAddModal"
        :lock-asset-id="assetId"
        @created="fetchMaintenances"
      />

      <!-- Update Modal -->
      <UpdateModal
        v-model="showUpdateModal"
        :maintenance="selectedMaintenance"
        :lock-asset-id="assetId"
        @updated="fetchMaintenances"
      />

      <!-- Delete Modal -->
      <DeleteModal 
        v-model="showDeleteModal" 
        title="Delete Maintenance Record" 
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
import AddModal from '~/components/asset-maintenance/AddModal.vue'
import UpdateModal from '~/components/asset-maintenance/UpdateModal.vue'
import DeleteModal from '~/components/DeleteModal.vue'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const assetId = Number(route.params.id)

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UIcon = resolveComponent('UIcon')

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

// Table columns
const columns: TableColumn<AssetMaintenance>[] = [
  {
    accessorKey: 'date',
    header: sortHeader('Maintenance Date', 'date'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-900 font-medium' }, row.original.date)
    }
  },
  {
    accessorKey: 'note',
    header: 'Notes',
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600 truncate max-w-md block' }, row.original.note || '-')
    }
  },
  {
    id: 'attachments',
    header: 'Attachments',
    cell: ({ row }) => {
      const attachments = row.original.attachments || []
      if (attachments.length === 0) return h('span', { class: 'text-neutral-400 text-xs' }, '-')

      const getAttachmentTheme = (mimeType: string) => {
        if (!mimeType) return { icon: 'i-lucide-file', badgeClass: 'bg-neutral-50 hover:bg-neutral-100/80 text-neutral-700 border-neutral-200/60 dark:bg-neutral-900/50 dark:hover:bg-neutral-800/80 dark:text-neutral-300 dark:border-neutral-800' }
        const type = mimeType.toLowerCase()
        if (type.startsWith('image/')) return { icon: 'i-lucide-image', badgeClass: 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/40' }
        if (type.includes('pdf')) return { icon: 'i-lucide-file-text', badgeClass: 'bg-rose-50 hover:bg-rose-100/80 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900/40' }
        if (type.includes('word') || type.includes('officedocument') || type.includes('excel') || type.includes('sheet') || type.includes('powerpoint') || type.includes('presentation')) return { icon: 'i-lucide-file-text', badgeClass: 'bg-blue-50 hover:bg-blue-100/80 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/40' }
        if (type.includes('zip') || type.includes('rar') || type.includes('compressed') || type.includes('tar') || type.includes('gzip')) return { icon: 'i-lucide-archive', badgeClass: 'bg-amber-50 hover:bg-amber-100/80 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/40' }
        return { icon: 'i-lucide-file', badgeClass: 'bg-neutral-50 hover:bg-neutral-100/80 text-neutral-700 border-neutral-200/60 dark:bg-neutral-900/50 dark:hover:bg-neutral-800/80 dark:text-neutral-300 dark:border-neutral-800' }
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
              class: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 border shadow-xs transform hover:-translate-y-0.5 max-w-[160px] cursor-pointer ${theme.badgeClass}`
            },
            [
              h(UIcon, { name: theme.icon, class: 'w-3.5 h-3.5 shrink-0 opacity-85' }),
              h('span', { class: 'truncate flex-1' }, att.originalName),
              h(UIcon, { name: 'i-lucide-download', class: 'w-3 h-3 shrink-0 opacity-50 hover:opacity-100 transition-opacity' })
            ]
          )
        })
      )
    }
  },
  {
    id: 'actions',
    header: 'Action',
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
  }
]

function getRowItems(row: Row<AssetMaintenance>) {
  return [
    {
      label: 'Edit Record',
      icon: 'i-lucide-edit',
      onSelect() {
        selectedMaintenance.value = row.original
        showUpdateModal.value = true
      }
    },
    {
      label: 'Delete Record',
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedMaintenance.value = row.original
        showDeleteModal.value = true
      }
    }
  ]
}

const toast = useToast()
const handleDelete = async () => {
  if (!selectedMaintenance.value) return
  isDeleting.value = true
  try {
    const response = await assetMaintenanceService.delete(selectedMaintenance.value.id)
    if (response.success) {
      toast.add({
        title: 'Asset maintenance record deleted successfully!',
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

onMounted(() => {
  fetchMaintenances()
})
</script>
