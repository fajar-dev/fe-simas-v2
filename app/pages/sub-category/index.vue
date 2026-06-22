<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Sub Category Management"
      description="Manage asset sub categories"
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
      search-placeholder="Search sub category..."
    >
      <template #actions v-if="hasPermission('sub-category:create')">
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="showAddModal = true"
        >
          Add Sub Category
        </UButton>
      </template>
    </DataTable>

    <!-- Modals -->
    <SubCategoryAddModal v-model="showAddModal" @created="fetchSubCategories" />
    <SubCategoryUpdateModal v-model="showUpdateModal" :sub-category="selectedSubCategory" @updated="fetchSubCategories" />
    <DeleteModal 
      v-model="showDeleteModal" 
      title="Delete Sub Category" 
      :item-name="selectedSubCategory?.name" 
      :loading="isDeleting"
      @confirm="handleDelete" 
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { subCategoryService } from '~/services/sub-category-service'
import type { SubCategory } from '~/types/sub-category'

definePageMeta({
  layout: 'dashboard'
})

const { hasPermission } = useAuth()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// State
const data = ref<SubCategory[]>([])
const isLoading = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchSubCategories())

const selectedSubCategory = ref<SubCategory | null>(null)

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

// Fetch sub categories from API
const fetchSubCategories = async () => {
  isLoading.value = true
  try {
    const response = await subCategoryService.getAll(page.value, perPage.value, search.value, undefined, sortBy.value, order.value)
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
const baseColumns: TableColumn<SubCategory>[] = [
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
    id: 'category',
    header: sortHeader('Category', 'category'),
    cell: ({ row }) => {
      const cat = row.original.category
      if (!cat) return '-'
      return h('span', { class: 'font-medium text-neutral-900' }, cat.name)
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
  if (hasPermission('sub-category:update', 'sub-category:delete')) {
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

function getRowItems(row: Row<SubCategory>) {
  const actions = []
  if (hasPermission('sub-category:update')) {
    actions.push({
      label: 'Edit Sub Category',
      icon: 'i-lucide-edit',
      onSelect() {
        selectedSubCategory.value = row.original
        showUpdateModal.value = true
      }
    })
  }
  if (hasPermission('sub-category:delete')) {
    actions.push({
      label: 'Delete Sub Category',
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedSubCategory.value = row.original
        showDeleteModal.value = true
      }
    })
  }
  return actions
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedSubCategory.value) return
  isDeleting.value = true
  try {
    const response = await subCategoryService.delete(selectedSubCategory.value.id)
    if (response.success) {
      toast.add({
        title: 'Sub category deleted successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchSubCategories()
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchSubCategories()
})
</script>
