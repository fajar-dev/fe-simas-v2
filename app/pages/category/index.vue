<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      :title="$t('pages.category.title')"
      :description="$t('pages.category.description')"
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
      :search-placeholder="$t('pages.category.searchPlaceholder')"
    >
      <template #actions v-if="hasPermission('category:create')">
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="showAddModal = true"
        >
          {{ $t('pages.category.addCategory') }}
        </UButton>
      </template>
    </DataTable>

    <!-- Modals -->
    <CategoryAddModal v-model="showAddModal" @created="fetchCategories" />
    <CategoryUpdateModal v-model="showUpdateModal" :category="selectedCategory" @updated="fetchCategories" />
    <DeleteModal 
      v-model="showDeleteModal" 
      :title="$t('pages.category.deleteTitle')" 
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

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const { hasPermission } = useAuth()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// State
const data = ref<Category[]>([])
const isLoading = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchCategories())

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



// Table columns
const baseColumns: TableColumn<Category>[] = [
  {
    accessorKey: 'code',
    header: sortHeader(t('pages.category.columnCode'), 'code'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, row.original.code)
    }
  },
  {
    accessorKey: 'name',
    header: sortHeader(t('pages.category.columnName'), 'name'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, row.original.name)
    }
  },
  {
    accessorKey: 'description',
    header: sortHeader(t('pages.category.columnDescription'), 'description'),
    cell: ({ row }) => {
      const desc = row.original.description
      return h('span', { class: 'text-neutral-600' }, desc || '-')
    }
  }
]

const columns = computed(() => {
  const list = [...baseColumns]
  if (hasPermission('category:update', 'category:delete')) {
    list.push({
      id: 'actions',
      header: t('pages.category.columnAction'),
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

function getRowItems(row: Row<Category>) {
  const actions = []
  if (hasPermission('category:update')) {
    actions.push({
      label: t('pages.category.editCategory'),
      icon: 'i-lucide-edit',
      onSelect() {
        selectedCategory.value = row.original
        showUpdateModal.value = true
      }
    })
  }
  if (hasPermission('category:delete')) {
    actions.push({
      label: t('pages.category.deleteCategory'),
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedCategory.value = row.original
        showDeleteModal.value = true
      }
    })
  }
  return actions
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
        title: t('pages.category.deleteSuccess'),
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
