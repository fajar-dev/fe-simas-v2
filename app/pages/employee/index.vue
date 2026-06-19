<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Employee Management"
      description="Manage employee"
    >
    </Header>

    <section class="space-y-5">
      <!-- Controls -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div class="flex flex-row items-center gap-2">
          <!-- Search -->
          <UInput 
            v-model="search" 
            icon="i-lucide-search" 
            size="md" 
            variant="outline" 
            placeholder="Search name or employee ID..." 
            class="w-full sm:w-64" 
          />

          <!-- Items per page -->
          <USelect 
            v-model="perPage" 
            :items="limitOptions" 
            class="w-20" 
          />
        </div>

        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-user-plus"
          class="w-full lg:w-auto justify-center"
          @click="showAddModal = true"
        >
          Add Employee
        </UButton>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <UTable 
          :data="data" 
          :columns="columns"
          :loading="isLoading"
          :ui="{ 
            th: 'bg-neutral-50 py-2.5', 
            td: 'text-neutral-900 py-3' 
          }"
          class="border border-neutral-200 rounded-md min-w-[768px]" 
        />
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <span class="text-sm text-neutral-500">
          Showing {{ meta.from || 0 }} to {{ meta.to || 0 }} of {{ meta.total }} results
        </span>
        <UPagination v-model:page="page" size="md" :total="meta.total" :items-per-page="perPage" />
      </div>
    </section>

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

// State
const search = ref('')
const limitOptions = ref([10, 25, 50, 100])
const perPage = ref(10)
const page = ref(1)
const data = ref<Employee[]>([])
const isLoading = ref(false)
const sortBy = ref('')
const order = ref<'ASC' | 'DESC'>('DESC')

const toggleSort = (column: string) => {
  if (sortBy.value === column) {
    order.value = order.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = column
    order.value = 'ASC'
  }
}

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

// Watch for page, perPage, and sort changes
watch([page, perPage, sortBy, order], () => {
  fetchEmployees()
})

// Watch search with debounce
let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchEmployees()
  }, 300)
})

const UIcon = resolveComponent('UIcon')

const sortHeader = (label: string, column: string) => {
  return () => {
    const isActive = sortBy.value === column
    const upColor = isActive && order.value === 'ASC' ? 'text-primary' : 'text-neutral-300'
    const downColor = isActive && order.value === 'DESC' ? 'text-primary' : 'text-neutral-300'
    return h('div', {
      class: 'flex items-center gap-1 cursor-pointer select-none hover:text-primary transition-colors',
      onClick: () => toggleSort(column)
    }, [
      h('span', label),
      h('div', { class: 'flex flex-col -space-y-1.5' }, [
        h(UIcon, { name: 'i-lucide-chevron-up', class: `w-3 h-3 ${upColor}` }),
        h(UIcon, { name: 'i-lucide-chevron-down', class: `w-3 h-3 ${downColor}` }),
      ])
    ])
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
          class: 'bg-primary-50 text-primary-700'
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
