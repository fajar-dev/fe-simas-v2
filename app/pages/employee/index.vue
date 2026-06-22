<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Employee Management"
      description="Manage employee"
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
      search-placeholder="Search name or employee ID..."
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
          Add Employee
        </UButton>
      </template>
    </DataTable>

    <!-- Modals -->
    <EmployeeAddModal v-model="showAddModal" @created="fetchEmployees" />
    <EmployeeUpdateModal v-model="showUpdateModal" :employee="selectedEmployee" @updated="fetchEmployees" />
    <DeleteModal 
      v-model="showDeleteModal" 
      title="Delete Employee" 
      :item-name="selectedEmployee?.name" 
      :loading="isDeleting"
      @confirm="handleDelete" 
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { employeeService } from '~/services/employee-service'
import type { Employee } from '~/types/employee'

definePageMeta({
  layout: 'dashboard'
})

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

// State
const data = ref<Employee[]>([])
const isLoading = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchEmployees())

const selectedEmployee = ref<Employee | null>(null)

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

// Fetch employees from API
const fetchEmployees = async () => {
  isLoading.value = true
  try {
    const response = await employeeService.getAll(page.value, perPage.value, search.value, sortBy.value, order.value)
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
const columns: TableColumn<Employee>[] = [
  {
    accessorKey: 'name',
    header: sortHeader('Employee', 'name'),
    cell: ({ row }) => {
      const name = row.original.name
      const employeeId = row.original.employeeId
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
          h('span', { class: 'text-xs text-neutral-500' }, employeeId)
        ])
      ])
    }
  },
  {
    accessorKey: 'jobPosition',
    header: sortHeader('Job Position', 'jobPosition'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium' }, row.original.jobPosition)
    }
  },
  {
    accessorKey: 'email',
    header: sortHeader('Email', 'email'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.email)
    }
  },
  {
    accessorKey: 'phone',
    header: sortHeader('Phone', 'phone'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.phone)
    }
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.original.isActive
      return h(
        UBadge,
        {
          color: isActive ? 'primary' : 'error',
          variant: 'subtle',
        },
        () => (isActive ? 'Active' : 'Inactive')
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

function getRowItems(row: Row<Employee>) {
  return [
    {
      label: 'Edit Employee',
      icon: 'i-lucide-edit',
      onSelect() {
        selectedEmployee.value = row.original
        showUpdateModal.value = true
      }
    },
    {
      label: 'Delete Employee',
      color: 'error',
      icon: 'i-lucide-trash',
      onSelect() {
        selectedEmployee.value = row.original
        showDeleteModal.value = true
      }
    }
  ]
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedEmployee.value) return
  isDeleting.value = true
  try {
    const response = await employeeService.delete(selectedEmployee.value.id)
    if (response.success) {
      toast.add({
        title: 'Employee deleted successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchEmployees()
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchEmployees()
})
</script>
