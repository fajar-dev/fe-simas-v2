<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Role Management"
      description="Manage roles and permissions"
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
      search-placeholder="Search role name..."
      table-class="min-w-[768px]"
    >
      <template #actions>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="showAddModal = true"
        >
          Add Role
        </UButton>
      </template>
    </DataTable>

    <!-- Modals -->
    <RoleAddModal v-model="showAddModal" @created="fetchRoles" />
    <RoleUpdateModal v-model="showUpdateModal" :role="selectedRole" @updated="fetchRoles" />
    <DeleteModal 
      v-model="showDeleteModal" 
      title="Delete Role" 
      :item-name="selectedRole?.name" 
      :loading="isDeleting"
      @confirm="handleDelete" 
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { roleService } from '~/services/role-service'
import type { Role } from '~/types/role'

definePageMeta({
  layout: 'dashboard'
})

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')

// State
const data = ref<Role[]>([])
const isLoading = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchRoles())

const selectedRole = ref<Role | null>(null)

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

// Fetch roles from API
const fetchRoles = async () => {
  isLoading.value = true
  try {
    const response = await roleService.getAll(page.value, perPage.value, search.value)
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
const columns: TableColumn<Role>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => {
      const index = row.index + 1 + ((page.value - 1) * perPage.value)
      return h('span', { class: 'text-neutral-500' }, index)
    }
  },
  {
    accessorKey: 'name',
    header: sortHeader('Name', 'name'),
    cell: ({ row }) => {
      const name = row.original.name
      const isSuperAdmin = row.original.isSuperAdmin
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'font-medium text-neutral-900' }, name),
        ...(isSuperAdmin
          ? [h(UBadge, { color: 'warning', variant: 'subtle', size: 'sm' }, () => 'Super Admin')]
          : [])
      ])
    }
  },
  {
    accessorKey: 'permissions',
    header: 'Permissions',
    cell: ({ row }) => {
      const count = row.original.permissions?.length || 0
      const isSuperAdmin = row.original.isSuperAdmin
      if (isSuperAdmin) {
        return h(UBadge, { color: 'warning', variant: 'subtle' }, () => 'All Permissions')
      }
      return h(UBadge, { color: 'primary', variant: 'subtle' }, () => `${count} permissions`)
    }
  },
  {
    accessorKey: 'createdAt',
    header: sortHeader('Created At', 'createdAt'),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt)
      return h('span', { class: 'text-neutral-500' }, date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }))
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

function getRowItems(row: Row<Role>) {
  const items: any[] = [
    {
      label: 'Edit Role',
      icon: 'i-lucide-edit',
      onSelect() {
        selectedRole.value = row.original
        showUpdateModal.value = true
      }
    }
  ]

  if (!row.original.isSuperAdmin) {
    items.push({
      label: 'Delete Role',
      color: 'error',
      icon: 'i-lucide-trash',
      onSelect() {
        selectedRole.value = row.original
        showDeleteModal.value = true
      }
    })
  }

  return items
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedRole.value) return
  isDeleting.value = true
  try {
    const response = await roleService.delete(selectedRole.value.id)
    if (response.success) {
      toast.add({
        title: 'Role deleted successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchRoles()
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchRoles()
})
</script>
