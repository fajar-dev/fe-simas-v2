<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      :title="$t('pages.user.title')"
      :description="$t('pages.user.description')"
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
      :search-placeholder="$t('pages.user.searchPlaceholder')"
      table-class="min-w-[768px]"
    >
      <template #filters>
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          class="w-full md:w-28"
        />
      </template>
      <template #actions v-if="hasPermission('user:create')">
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="() => { showAddModal = true }"
        >
          {{ $t('pages.user.addUser') }}
        </UButton>
      </template>
    </DataTable>

    <!-- Modals -->
    <UserAddModal v-model="showAddModal" @created="fetchUsers" />
    <UserUpdateModal v-model="showUpdateModal" :user="selectedUser" @updated="fetchUsers" />
    <DeleteModal 
      v-model="showDeleteModal" 
      :title="$t('pages.user.deleteTitle')" 
      :item-name="selectedUser?.name" 
      :loading="isDeleting"
      @confirm="handleDelete" 
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { userService } from '~/services/user-service'
import type { User } from '~/types/user'

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const { hasPermission } = useAuth()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

// State
const data = ref<User[]>([])
const isLoading = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchUsers())

const selectedUser = ref<User | null>(null)

// Modal states
const showAddModal = ref(false)
const showUpdateModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)

// Status filter
const statusFilter = ref('true')
const statusOptions = computed(() => [
  { label: t('common.all'), value: 'all' },
  { label: t('common.active'), value: 'true' },
  { label: t('common.inactive'), value: 'false' },
])

watch(statusFilter, () => {
  page.value = 1
  fetchUsers()
})

// Pagination meta
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

// Fetch users from API
const fetchUsers = async () => {
  isLoading.value = true
  try {
    const response = await userService.getAll(page.value, perPage.value, search.value, statusFilter.value === 'all' ? '' : statusFilter.value, sortBy.value, order.value)
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
const baseColumns: TableColumn<User>[] = [
  {
    accessorKey: 'name',
    header: sortHeader(t('pages.user.columnUserProfile'), 'name'),
    cell: ({ row }) => {
      const name = row.original.name
      const email = row.original.email
      const photo = row.original.photo
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, { 
          src: photo || undefined, 
          alt: name, 
          size: 'lg',
          class: 'bg-primary-50 text-primary-700',
          loading: 'lazy'
        }),
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-medium text-neutral-900' }, name),
          h('span', { class: 'text-xs text-neutral-500' }, email)
        ])
      ])
    }
  },
  {
    accessorKey: 'isActive',
    header: sortHeader(t('pages.user.columnStatus'), 'isActive'),
    cell: ({ row }) => {
      const isActive = row.original.isActive
      return h(
        UBadge,
        {
          color: isActive ? 'primary' : 'error',
          variant: 'subtle',
        },
        () => (isActive ? t('common.active') : t('common.inactive'))
      )
    }
  },
  {
    accessorKey: 'role',
    header: t('pages.user.columnRole'),
    cell: ({ row }) => {
      const role = row.original.role
      return role
        ? h(UBadge, { color: 'neutral', variant: 'subtle' }, () => role.name)
        : h('span', { class: 'text-xs text-neutral-400' }, '-')
    }
  },
  {
    accessorKey: 'employee',
    header: t('pages.user.columnEmployee'),
    cell: ({ row }) => {
      const employee = row.original.employee
      if (!employee) return h('span', { class: 'text-xs text-neutral-400' }, '-')
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-sm font-medium text-neutral-900' }, employee.name),
        h('span', { class: 'text-xs text-neutral-500' }, employee.employeeId)
      ])
    }
  }
]

const columns = computed(() => {
  const list = [...baseColumns]
  if (hasPermission('user:update', 'user:delete')) {
    list.push({
      id: 'actions',
      header: t('pages.user.columnAction'),
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

function getRowItems(row: Row<User>) {
  const actions = []
  if (hasPermission('user:update')) {
    actions.push({
      label: t('pages.user.editUser'),
      icon: 'i-lucide-edit',
      onSelect() {
        selectedUser.value = row.original
        showUpdateModal.value = true
      }
    })
  }
  if (hasPermission('user:delete')) {
    actions.push({
      label: t('pages.user.deleteUser'),
      color: 'error',
      icon: 'i-lucide-trash',
      onSelect() {
        selectedUser.value = row.original
        showDeleteModal.value = true
      }
    })
  }
  return actions
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedUser.value) return
  isDeleting.value = true
  try {
    const response = await userService.delete(selectedUser.value.id)
    if (response.success) {
      toast.add({
        title: t('pages.user.deleteSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchUsers()
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchUsers()
})
</script>
