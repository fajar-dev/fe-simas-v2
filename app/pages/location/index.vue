<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Location Management"
      description="Manage branch locations"
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
      search-placeholder="Search location..."
    >
      <template #actions v-if="hasPermission('location:create')">
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="showAddModal = true"
        >
          Add Location
        </UButton>
      </template>
    </DataTable>

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

const { hasPermission } = useAuth()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// State
const data = ref<Location[]>([])
const isLoading = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchLocations())

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
    const response = await locationService.getAll(page.value, perPage.value, search.value, undefined, sortBy.value, order.value)
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
const baseColumns: TableColumn<Location>[] = [
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
  }
]

const columns = computed(() => {
  const list = [...baseColumns]
  if (hasPermission('location:update', 'location:delete')) {
    list.push({
      id: 'actions',
      header: 'Action',
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

function getRowItems(row: Row<Location>) {
  const actions = []
  if (hasPermission('location:update')) {
    actions.push({
      label: 'Edit Location',
      icon: 'i-lucide-edit',
      onSelect() {
        selectedLocation.value = row.original
        showUpdateModal.value = true
      }
    })
  }
  if (hasPermission('location:delete')) {
    actions.push({
      label: 'Delete Location',
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedLocation.value = row.original
        showDeleteModal.value = true
      }
    })
  }
  return actions
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
