<template>
  <div class="space-y-6">
    <Header :title="$t('pages.inventory.item.title')" :description="$t('pages.inventory.item.description')" />

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
      :search-placeholder="$t('pages.inventory.item.searchPlaceholder')"
      table-class="min-w-[720px]"
    >
      <template #actions v-if="hasPermission('inventory:create')">
        <UButton color="primary" variant="solid" icon="i-lucide-plus" class="w-full sm:w-auto justify-center" @click="openCreate">
          {{ $t('pages.inventory.item.add') }}
        </UButton>
      </template>
    </DataTable>

    <InventoryModal v-model="showProductModal" :product="selectedProduct" @saved="fetchProducts" />
    <InventoryVariantManagerModal v-model="showVariantModal" :product="selectedProduct" @changed="fetchProducts" />
    <DeleteModal v-model="showDeleteModal" :item-name="selectedProduct?.name" :loading="deleting" @confirm="confirmDelete" />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { inventoryService } from '~/services/inventory-service'
import type { Inventory } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const { hasPermission } = useAuth()
const toast = useToast()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const data = ref<Inventory[]>([])
const isLoading = ref(false)
const meta = reactive({ total: 0, from: 0, to: 0 })

const selectedProduct = ref<Inventory | null>(null)
const showProductModal = ref(false)
const showVariantModal = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)

const { search, page, perPage, sortBy, order, sortHeader } = useTableQuery(() => fetchProducts(), { defaultSortBy: 'createdAt', defaultOrder: 'DESC' })

const fetchProducts = async () => {
  isLoading.value = true
  try {
    const res = await inventoryService.getAll(page.value, perPage.value, search.value, sortBy.value, order.value)
    if (res.success && res.data) {
      data.value = res.data
      if (res.meta) { meta.total = res.meta.total; meta.from = res.meta.from; meta.to = res.meta.to }
    }
  } finally {
    isLoading.value = false
  }
}

const openCreate = () => { selectedProduct.value = null; showProductModal.value = true }

const baseColumns: TableColumn<Inventory>[] = [
  {
    accessorKey: 'name',
    header: sortHeader(t('common.name'), 'name'),
    cell: ({ row }) => h('span', {
      class: 'font-medium text-neutral-900 cursor-pointer hover:underline',
      onClick: () => navigateTo(`/inventory/${row.original.id}`)
    }, row.original.name)
  },
  { accessorKey: 'code', header: sortHeader(t('common.code'), 'code'), cell: ({ row }) => h('span', { class: 'text-neutral-600' }, row.original.code || '-') },
  { accessorKey: 'description', header: t('common.description'), cell: ({ row }) => h('span', { class: 'text-neutral-500 truncate max-w-xs block' }, row.original.description || '-') }
]

const columns = computed(() => {
  const list = [...baseColumns]
  list.push({
    id: 'actions',
    header: t('common.actions'),
    meta: { class: { td: 'text-right', th: 'text-right' } },
    cell: ({ row }) => h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row), 'aria-label': 'Actions' },
      () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost' }))
  })
  return list
})

function getRowItems(row: Row<Inventory>) {
  const product = row.original
  const items: any[] = [{
    label: t('pages.inventory.detail.open'),
    icon: 'i-lucide-eye',
    onSelect() { navigateTo(`/inventory/${product.id}`) }
  }, {
    label: t('pages.inventory.variant.manageTitle'),
    icon: 'i-lucide-layers',
    onSelect() { selectedProduct.value = product; showVariantModal.value = true }
  }]
  if (hasPermission('inventory:update')) {
    items.push({ label: t('common.edit'), icon: 'i-lucide-edit-3', onSelect() { selectedProduct.value = product; showProductModal.value = true } })
  }
  if (hasPermission('inventory:delete')) {
    items.push({ label: t('common.delete'), icon: 'i-lucide-trash-2', color: 'error' as const, onSelect() { selectedProduct.value = product; showDeleteModal.value = true } })
  }
  return items
}

const confirmDelete = async () => {
  if (!selectedProduct.value) return
  deleting.value = true
  try {
    const res = await inventoryService.remove(selectedProduct.value.id)
    if (res.success) {
      toast.add({ title: t('common.delete'), color: 'success', icon: 'i-lucide-circle-check' })
      showDeleteModal.value = false
      fetchProducts()
    } else {
      toast.add({ title: res.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    deleting.value = false
  }
}

onMounted(fetchProducts)
</script>
