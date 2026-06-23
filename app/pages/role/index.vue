<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      :title="$t('pages.role.title')"
      :description="$t('pages.role.description')"
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
      :search-placeholder="$t('pages.role.searchPlaceholder')"
      table-class="min-w-[768px]"
    >
      <template #actions v-if="hasPermission('role:create')">
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="showAddModal = true"
        >
          {{ $t('pages.role.addRole') }}
        </UButton>
      </template>
    </DataTable>

    <!-- Modals -->
    <RoleAddModal v-model="showAddModal" @created="fetchRoles" />
    <RoleUpdateModal v-model="showUpdateModal" :role="selectedRole" @updated="fetchRoles" />
    <DeleteModal 
      v-model="showDeleteModal" 
      :title="$t('pages.role.deleteTitle')" 
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

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const { hasPermission } = useAuth()

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
const baseColumns: TableColumn<Role>[] = [
  {
    id: 'no',
    header: t('pages.role.columnNo'),
    cell: ({ row }) => {
      const index = row.index + 1 + ((page.value - 1) * perPage.value)
      return h('span', { class: 'text-neutral-500' }, index)
    }
  },
  {
    accessorKey: 'name',
    header: sortHeader(t('pages.role.columnName'), 'name'),
    cell: ({ row }) => {
      const name = row.original.name
      const isSuperAdmin = row.original.isSuperAdmin
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'font-medium text-neutral-900' }, name),
        ...(isSuperAdmin
          ? [h(UBadge, { color: 'warning', variant: 'subtle', size: 'sm' }, () => t('pages.role.superAdmin'))]
          : [])
      ])
    }
  },
  {
    accessorKey: 'permissions',
    header: t('pages.role.columnPermissions'),
    cell: ({ row }) => {
      const count = row.original.permissions?.length || 0
      const isSuperAdmin = row.original.isSuperAdmin
      if (isSuperAdmin) {
        return h(UBadge, { color: 'warning', variant: 'subtle' }, () => t('pages.role.allPermissions'))
      }
      return h(UBadge, { color: 'primary', variant: 'subtle' }, () => t('pages.role.permissionCount', { count }))
    }
  },
  {
    accessorKey: 'createdAt',
    header: sortHeader(t('pages.role.columnCreatedAt'), 'createdAt'),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt)
      return h('span', { class: 'text-neutral-500' }, date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }))
    }
  }
]

const columns = computed(() => {
  const list = [...baseColumns]
  if (hasPermission('role:update', 'role:delete')) {
    list.push({
      id: 'actions',
      header: t('pages.role.columnAction'),
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

function getRowItems(row: Row<Role>) {
  const items: any[] = []

  if (hasPermission('role:update')) {
    items.push({
      label: t('pages.role.editRole'),
      icon: 'i-lucide-edit',
      onSelect() {
        selectedRole.value = row.original
        showUpdateModal.value = true
      }
    })
  }

  if (hasPermission('role:delete') && !row.original.isSuperAdmin) {
    items.push({
      label: t('pages.role.deleteRole'),
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
        title: t('pages.role.deleteSuccess'),
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
