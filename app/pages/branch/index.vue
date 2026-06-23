<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      :title="$t('pages.branch.title')"
      :description="$t('pages.branch.description')"
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
      :search-placeholder="$t('pages.branch.searchPlaceholder')"
    >
      <template #actions v-if="hasPermission('branch:create')">
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="showAddModal = true"
        >
          {{ $t('pages.branch.addBranch') }}
        </UButton>
      </template>
    </DataTable>

    <!-- Modals -->
    <BranchAddModal v-model="showAddModal" @created="fetchBranches" />
    <BranchUpdateModal v-model="showUpdateModal" :branch="selectedBranch" @updated="fetchBranches" />
    <DeleteModal 
      v-model="showDeleteModal" 
      :title="$t('pages.branch.deleteTitle')" 
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

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const { hasPermission } = useAuth()

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
const baseColumns: TableColumn<Branch>[] = [
  {
    accessorKey: 'code',
    header: sortHeader(t('pages.branch.columnCode'), 'code'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, row.original.code)
    }
  },
  {
    accessorKey: 'name',
    header: sortHeader(t('pages.branch.columnName'), 'name'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, row.original.name)
    }
  },
  {
    accessorKey: 'description',
    header: sortHeader(t('pages.branch.columnDescription'), 'description'),
    cell: ({ row }) => {
      const desc = row.original.description
      return h('span', { class: 'text-neutral-600' }, desc || '-')
    }
  },
  {
    accessorKey: 'email',
    header: sortHeader(t('pages.branch.columnEmail'), 'email'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.email || '-')
    }
  },
  {
    accessorKey: 'phone',
    header: sortHeader(t('pages.branch.columnPhone'), 'phone'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.phone || '-')
    }
  },
  {
    accessorKey: 'address',
    header: sortHeader(t('pages.branch.columnAddress'), 'address'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.address || '-')
    }
  }
]

const columns = computed(() => {
  const list = [...baseColumns]
  if (hasPermission('branch:update', 'branch:delete')) {
    list.push({
      id: 'actions',
      header: t('pages.branch.columnAction'),
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
    })
  }
  return list
})

function getRowItems(row: Row<Branch>) {
  const actions = []
  if (hasPermission('branch:update')) {
    actions.push({
      label: t('pages.branch.editBranch'),
      icon: 'i-lucide-edit',
      onSelect() {
        selectedBranch.value = row.original
        showUpdateModal.value = true
      }
    })
  }
  if (hasPermission('branch:delete')) {
    actions.push({
      label: t('pages.branch.deleteBranch'),
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedBranch.value = row.original
        showDeleteModal.value = true
      }
    })
  }
  return actions
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
        title: t('pages.branch.deleteSuccess'),
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
