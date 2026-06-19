<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Asset Management"
      description="Manage and track company assets"
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
      search-placeholder="Search assets..."
      table-class="min-w-[1200px]"
    >
      <template #actions>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          to="/asset/create"
        >
          Add Asset
        </UButton>
      </template>
    </DataTable>

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
const NuxtImg = resolveComponent('NuxtImg')
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

// State
const data = ref<Asset[]>([])
const isLoading = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchAssets())
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
    const response = await assetService.getAll(page.value, perPage.value, search.value, sortBy.value, order.value)
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
const columns: TableColumn<Asset>[] = [
  {
    id: 'asset',
    header: sortHeader('Asset', 'name'),
    cell: ({ row }) => {
      const img = row.original.image
      const imageEl = img
        ? h(NuxtImg, {
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
        h('span', { 
          class: 'font-semibold cursor-pointer hover:underline truncate',
          onClick: (e: Event) => {
            e.stopPropagation()
            navigateTo(`/asset/${row.original.id}`)
          }
        }, row.original.name),
        h('span', { class: 'text-xs text-neutral-500' }, row.original.code)
      ])

      return h('div', { class: 'flex items-center gap-3' }, [imageEl, textEl])
    }
  },
  {
    id: 'category',
    header: sortHeader('Category', 'category'),
    cell: ({ row }) => {
      const cat = row.original.subCategory?.category
      return h('span', { class: 'text-neutral-900' }, cat?.name || '-')
    }
  },
  {
    id: 'subCategory',
    header: sortHeader('Sub Category', 'subCategory'),
    cell: ({ row }) => {
      const sub = row.original.subCategory
      return h('span', { class: 'text-neutral-900' }, sub?.name || '-')
    }
  },
  {
    accessorKey: 'brand',
    header: sortHeader('Brand', 'brand'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.brand || '-')
    }
  },
  {
    accessorKey: 'model',
    header: sortHeader('Model', 'model'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, row.original.model || '-')
    }
  },
  {
    id: 'lastLocation',
    header: 'Location',
    cell: ({ row }) => {
      const lastLoc = row.original.lastLocation
      if (!lastLoc || !lastLoc.location) return h('span', { class: 'text-neutral-500 italic' }, '-')
      const locName = lastLoc.location.name
      const branchName = lastLoc.location.branch?.name
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'text-neutral-900 font-semibold' }, locName),
        branchName ? h('span', { class: 'text-xs text-neutral-500' }, branchName) : null
      ])
    }
  },
  {
    id: 'activeHolder',
    header: 'Holder',
    cell: ({ row }) => {
      const holder = row.original.activeHolder
      if (!holder || !holder.employee) return h('span', { class: 'text-neutral-500 italic' }, '-')
      const emp = holder.employee
      return h('div', { class: 'flex items-center gap-2 min-w-0' }, [
        h(UAvatar, {
          src: emp.photo || undefined,
          alt: emp.name,
          size: 'xs',
          class: 'bg-primary-50 text-primary-700'
        }),
        h('div', { class: 'flex flex-col min-w-0' }, [
          h('span', { class: 'text-neutral-900 font-semibold truncate' }, emp.name),
          h('span', { class: 'text-xs text-neutral-500' }, emp.employeeId)
        ])
      ])
    }
  },
  {
    accessorKey: 'price',
    header: sortHeader('Price', 'price'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600' }, formatCurrency(row.original.price))
    }
  },
  {
    accessorKey: 'purchaseDate',
    header: sortHeader('Purchase Date', 'purchaseDate'),
    cell: ({ row }) => {
      const date = row.original.purchaseDate
      const age = row.original.age
      if (!date) return h('span', { class: 'text-neutral-600' }, '-')
      return h('div', { class: 'flex flex-col min-w-0' }, [
        age ? h('span', { class: 'font-medium text-neutral-900' }, age) : null,
        h('span', { class: 'text-xs text-neutral-500' }, date)
      ])
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
