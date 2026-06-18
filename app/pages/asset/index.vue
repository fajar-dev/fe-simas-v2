<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Asset Management"
      description="Manage and track company assets"
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
            placeholder="Search assets..." 
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
          to="/asset/create"
        >
          Add Asset
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
          class="border border-neutral-200 rounded-md min-w-[960px]" 
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

    <!-- Delete Modal -->
    <DeleteModal 
      v-model="showDeleteModal" 
      title="Delete Asset" 
      :item-name="selectedAsset?.name" 
      :loading="isDeleting"
      @confirm="handleDelete" 
    />

    <!-- Lightbox Modal -->
    <Lightbox />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { assetService } from '~/services/asset-service'
import type { Asset } from '~/types/asset'

definePageMeta({
  layout: 'dashboard'
})

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')

// State
const search = ref('')
const limitOptions = ref([10, 25, 50, 100])
const perPage = ref(10)
const page = ref(1)
const data = ref<Asset[]>([])
const isLoading = ref(false)
const selectedAsset = ref<Asset | null>(null)
const showDeleteModal = ref(false)
const isDeleting = ref(false)

// Pagination meta
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

const { openLightbox } = useLightbox()

// Fetch assets from API
const fetchAssets = async () => {
  isLoading.value = true
  try {
    const response = await assetService.getAll(page.value, perPage.value, search.value)
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

// Watch for page and perPage changes
watch([page, perPage], () => {
  fetchAssets()
})

// Watch search with debounce
let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchAssets()
  }, 300)
})


// Table columns
const columns: TableColumn<Asset>[] = [
  {
    id: 'asset',
    header: 'Asset',
    cell: ({ row }) => {
      const img = row.original.image
      const imageEl = img
        ? h('img', {
            src: img,
            alt: row.original.name,
            class: 'w-10 h-10 object-cover rounded-md border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors shadow-2xs shrink-0',
            onClick: (e: Event) => {
              e.stopPropagation()
              openLightbox(img)
            }
          })
        : h('div', { class: 'w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center border border-neutral-200 shrink-0' }, [
            h('span', { class: 'text-neutral-400 text-[10px]' }, 'N/A')
          ])

      const textEl = h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'font-medium text-neutral-900 truncate' }, row.original.name),
        h('span', { class: 'text-xs text-neutral-500' }, row.original.code)
      ])

      return h('div', { class: 'flex items-center gap-3' }, [imageEl, textEl])
    }
  },
  {
    id: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const cat = row.original.subCategory?.category
      return h('span', { class: 'text-neutral-600' }, cat?.name || '-')
    }
  },
  {
    id: 'subCategory',
    header: 'Sub Category',
    cell: ({ row }) => {
      const sub = row.original.subCategory
      return h('span', { class: 'text-neutral-600' }, sub?.name || '-')
    }
  },
  {
    accessorKey: 'brand',
    header: 'Brand',
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.brand || '-')
    }
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, formatCurrency(row.original.price))
    }
  },
  {
    accessorKey: 'purchaseDate',
    header: 'Purchase Date',
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.purchaseDate || '-')
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

function getRowItems(row: Row<Asset>) {
  return [
    {
      label: 'Edit Asset',
      icon: 'i-lucide-edit',
      onSelect() {
        navigateTo(`/asset/${row.original.id}/edit`)
      }
    },
    {
      label: 'Delete Asset',
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedAsset.value = row.original
        showDeleteModal.value = true
      }
    }
  ]
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedAsset.value) return
  isDeleting.value = true
  try {
    const response = await assetService.delete(selectedAsset.value.id)
    if (response.success) {
      toast.add({
        title: 'Asset deleted successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchAssets()
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchAssets()
})
</script>
