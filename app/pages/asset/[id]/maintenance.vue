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
const UBadge = resolveComponent('UBadge')

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
