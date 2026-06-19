<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Category Management"
      description="Manage asset categories"
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
            placeholder="Search category..." 
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
          Add Category
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
    <CategoryAddModal v-model="showAddModal" @created="fetchCategories" />
    <CategoryUpdateModal v-model="showUpdateModal" :category="selectedCategory" @updated="fetchCategories" />
    <DeleteModal 
      v-model="showDeleteModal" 
      title="Delete Category" 
      :item-name="selectedCategory?.name" 
      :loading="isDeleting"
      @confirm="handleDelete" 
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { categoryService } from '~/services/category-service'
import type { Category } from '~/types/category'

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
const data = ref<Category[]>([])
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

const selectedCategory = ref<Category | null>(null)

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

// Fetch categories from API
const fetchCategories = async () => {
  isLoading.value = true
  try {
    const response = await categoryService.getAll(page.value, perPage.value, search.value, sortBy.value, order.value)
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
  fetchCategories()
})

// Watch search with debounce
let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchCategories()
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
const columns: TableColumn<Category>[] = [
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

function getRowItems(row: Row<Category>) {
  return [
    {
      label: 'Edit Category',
      icon: 'i-lucide-edit',
      onSelect() {
        selectedCategory.value = row.original
        showUpdateModal.value = true
      }
    },
    {
      label: 'Delete Category',
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedCategory.value = row.original
        showDeleteModal.value = true
      }
    }
  ]
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedCategory.value) return
  isDeleting.value = true
  try {
    const response = await categoryService.delete(selectedCategory.value.id)
    if (response.success) {
      toast.add({
        title: 'Category deleted successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchCategories()
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchCategories()
})
</script>
