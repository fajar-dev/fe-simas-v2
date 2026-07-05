<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      :title="$t('pages.subCategory.title')"
      :description="$t('pages.subCategory.description')"
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
      :search-placeholder="$t('pages.subCategory.searchPlaceholder')"
    >
      <template #filters>
        <USelect
          v-model="categoryFilter"
          :items="categoryOptions"
          class="w-full md:w-52"
        />
      </template>
      <template #actions v-if="hasPermission('sub-category:create')">
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="() => { showAddModal = true }"
        >
          {{ $t('pages.subCategory.addSubCategory') }}
        </UButton>
      </template>
    </DataTable>

    <!-- Modals -->
    <SubCategoryAddModal v-model="showAddModal" @created="fetchSubCategories" />
    <SubCategoryUpdateModal v-model="showUpdateModal" :sub-category="selectedSubCategory" @updated="fetchSubCategories" />
    <DeleteModal 
      v-model="showDeleteModal" 
      :title="$t('pages.subCategory.deleteTitle')" 
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
import { categoryService } from '~/services/category-service'
import type { SubCategory } from '~/types/sub-category'

const { t } = useI18n()

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

// Category filter
const categoryFilter = ref('all')
const categoryOptions = ref<{ label: string; value: string }[]>([{ label: t('common.all'), value: 'all' }])

const fetchCategories = async () => {
  const res = await categoryService.getList()
  if (res.success) {
    categoryOptions.value = [
      { label: t('common.all'), value: 'all' },
      ...res.data.map(c => ({ label: c.name, value: String(c.id) }))
    ]
  }
}

watch(categoryFilter, () => {
  page.value = 1
  fetchSubCategories()
})

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
    const catId = categoryFilter.value !== 'all' ? Number(categoryFilter.value) : undefined
    const response = await subCategoryService.getAll(page.value, perPage.value, search.value, catId, sortBy.value, order.value)
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
    header: sortHeader(t('pages.subCategory.columnCode'), 'code'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, row.original.code)
    }
  },
  {
    accessorKey: 'name',
    header: sortHeader(t('pages.subCategory.columnName'), 'name'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, row.original.name)
    }
  },
  {
    id: 'category',
    header: sortHeader(t('pages.subCategory.columnCategory'), 'category'),
    cell: ({ row }) => {
      const cat = row.original.category
      if (!cat) return '-'
      return h('span', { class: 'font-medium text-neutral-900' }, cat.name)
    }
  },
  {
    accessorKey: 'description',
    header: sortHeader(t('pages.subCategory.columnDescription'), 'description'),
    cell: ({ row }) => {
      const desc = row.original.description
      return h('span', { class: 'text-neutral-600' }, desc || '-')
    }
  },
  {
    accessorKey: 'assetCount',
    header: sortHeader(t('pages.subCategory.columnAssetCount'), 'assetCount'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, String(row.original.assetCount ?? 0))
    }
  }
]

const columns = computed(() => {
  const list = [...baseColumns]
  if (hasPermission('sub-category:update', 'sub-category:delete')) {
    list.push({
      id: 'actions',
      header: t('pages.subCategory.columnAction'),
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
      label: t('pages.subCategory.editSubCategory'),
      icon: 'i-lucide-edit',
      onSelect() {
        selectedSubCategory.value = row.original
        showUpdateModal.value = true
      }
    })
  }
  if (hasPermission('sub-category:delete')) {
    actions.push({
      label: t('pages.subCategory.deleteSubCategory'),
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
        title: t('pages.subCategory.deleteSuccess'),
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
  fetchCategories()
})
</script>
