<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Branch Management"
      description="Manage branches"
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
      search-placeholder="Search branch..."
    >
      <template #actions>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="showAddModal = true"
        >
          Add Branch
        </UButton>
      </template>
    </DataTable>

    <!-- Modals -->
    <BranchAddModal v-model="showAddModal" @created="fetchBranches" />
    <BranchUpdateModal v-model="showUpdateModal" :branch="selectedBranch" @updated="fetchBranches" />
    <DeleteModal 
      v-model="showDeleteModal" 
      title="Delete Branch" 
      :item-name="selectedBranch?.name" 
      :loading="isDeleting"
      @confirm="handleDelete" 
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { branchService } from '~/services/branch-service'
import type { Branch } from '~/types/branch'

definePageMeta({
  layout: 'dashboard'
})

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// State
const data = ref<Branch[]>([])
const isLoading = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchBranches())

const selectedBranch = ref<Branch | null>(null)

// Modal states
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

// Fetch branches from API
const fetchBranches = async () => {
  isLoading.value = true
  try {
    const response = await branchService.getAll(page.value, perPage.value, search.value, sortBy.value, order.value)
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



// Table columns
const columns: TableColumn<Branch>[] = [
  {
    accessorKey: 'code',
    header: sortHeader('Code', 'code'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, row.original.code)
    }
  },
  {
    accessorKey: 'name',
    header: sortHeader('Name', 'name'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, row.original.name)
    }
  },
  {
    accessorKey: 'description',
    header: sortHeader('Description', 'description'),
    cell: ({ row }) => {
      const desc = row.original.description
      return h('span', { class: 'text-neutral-600' }, desc || '-')
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
          content: {
            align: 'end'
          },
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

function getRowItems(row: Row<Branch>) {
  return [
    {
      label: 'Edit Branch',
      icon: 'i-lucide-edit',
      onSelect() {
        selectedBranch.value = row.original
        showUpdateModal.value = true
      }
    },
    {
      label: 'Delete Branch',
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedBranch.value = row.original
        showDeleteModal.value = true
      }
    }
  ]
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedBranch.value) return
  isDeleting.value = true
  try {
    const response = await branchService.delete(selectedBranch.value.id)
    if (response.success) {
      toast.add({
        title: 'Branch deleted successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchBranches()
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchBranches()
})
</script>
