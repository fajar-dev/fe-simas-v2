<template>
  <AssetDetailWrapper v-slot="{ asset, isLoading }">
    <UCard class="w-full">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-wrench" class="w-5 h-5 text-neutral-500" />
            <h3 class="text-sm font-semibold text-neutral-900">Maintenance Logs</h3>
          </div>
        </div>
      </template>

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
            size="sm"
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
    </UCard>
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

      // Render clickable mini badges for each attachment
      return h(
        'div',
        { class: 'flex flex-wrap gap-1.5 max-w-sm' },
        attachments.map(att => {
          return h(
            'a',
            {
              href: att.url,
              target: '_blank',
              class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-medium transition-colors border border-neutral-200 dark:border-neutral-700 truncate max-w-[150px]'
            },
            [
              h('span', { class: 'truncate' }, att.originalName)
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
