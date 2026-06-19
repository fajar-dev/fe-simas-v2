<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Location Management"
      description="Manage branch locations"
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
            placeholder="Search location..." 
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
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="showAddModal = true"
        >
          Add Location
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
          class="border border-neutral-200 rounded-md" 
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
    <LocationAddModal v-model="showAddModal" @created="fetchLocations" />
    <LocationUpdateModal v-model="showUpdateModal" :location="selectedLocation" @updated="fetchLocations" />
    <DeleteModal 
      v-model="showDeleteModal" 
      title="Delete Location" 
      :item-name="selectedLocation?.name" 
      :loading="isDeleting"
      @confirm="handleDelete" 
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { locationService } from '~/services/location-service'
import type { Location } from '~/types/location'

definePageMeta({
  layout: 'dashboard'
})

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// State
const search = ref('')
const limitOptions = ref([10, 25, 50, 100])
const perPage = ref(10)
const page = ref(1)
const data = ref<Location[]>([])
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

const selectedLocation = ref<Location | null>(null)

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

// Fetch locations from API
const fetchLocations = async () => {
  isLoading.value = true
  try {
    const response = await locationService.getAll(page.value, perPage.value, search.value, sortBy.value, order.value)
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
  fetchLocations()
})

// Watch search with debounce
let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchLocations()
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
const columns: TableColumn<Location>[] = [
  {
    accessorKey: 'name',
    header: sortHeader('Name', 'name'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, row.original.name)
    }
  },
  {
    id: 'branch',
    header: sortHeader('Branch', 'branch'),
    cell: ({ row }) => {
      const branch = row.original.branch
      if (!branch) return '-'
      return h('span', { class: 'font-medium text-neutral-900' }, `[${branch.code}] ${branch.name}`)
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

function getRowItems(row: Row<Location>) {
  return [
    {
      label: 'Edit Location',
      icon: 'i-lucide-edit',
      onSelect() {
        selectedLocation.value = row.original
        showUpdateModal.value = true
      }
    },
    {
      label: 'Delete Location',
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedLocation.value = row.original
        showDeleteModal.value = true
      }
    }
  ]
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedLocation.value) return
  isDeleting.value = true
  try {
    const response = await locationService.delete(selectedLocation.value.id)
    if (response.success) {
      toast.add({
        title: 'Location deleted successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchLocations()
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchLocations()
})
</script>
