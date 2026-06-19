<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Asset Maintenance"
      description="Manage and track maintenance history of company assets"
    />

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
      search-placeholder="Search note or asset..."
      table-class="min-w-[960px]"
    >
      <template #actions>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="showAddModal = true"
        >
          Add Maintenance
        </UButton>
      </template>
    </DataTable>

    <!-- Add Modal -->
    <AddModal
      v-model="showAddModal"
      @created="fetchMaintenances"
    />

    <!-- Update Modal -->
    <UpdateModal
      v-model="showUpdateModal"
      :maintenance="selectedMaintenance"
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
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { assetMaintenanceService } from '~/services/asset-maintenance-service'
import type { AssetMaintenance } from '~/types/asset-maintenance'
import AddModal from '~/components/asset-maintenance/AddModal.vue'
import UpdateModal from '~/components/asset-maintenance/UpdateModal.vue'

definePageMeta({
  layout: 'dashboard'
})

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')

// State
const data = ref<AssetMaintenance[]>([])
const isLoading = ref(false)

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

// Fetch maintenance events
const fetchMaintenances = async () => {
  isLoading.value = true
  try {
    const response = await assetMaintenanceService.getAll(
      page.value,
      perPage.value,
      search.value,
      sortBy.value,
      order.value
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
    isLoading.value = false
  }
}

// Table columns
const columns: TableColumn<AssetMaintenance>[] = [
  {
    id: 'asset',
    header: sortHeader('Asset', 'asset'),
    cell: ({ row }) => {
      const asset = row.original.asset
      if (!asset) return h('span', { class: 'text-neutral-400' }, '-')
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'font-semibold text-neutral-900 truncate' }, asset.name),
        h('span', { class: 'text-xs text-neutral-500 font-mono' }, asset.code)
      ])
    }
  },
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
      return h('span', { class: 'text-neutral-600 truncate max-w-xs block' }, row.original.note || '-')
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
