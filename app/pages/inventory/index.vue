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
      table-class="min-w-[860px]"
    >
      <template #actions>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UButton v-if="hasPermission('inventory:create')" color="primary" variant="solid" icon="i-lucide-plus" class="flex-1 sm:flex-none justify-center" @click="() => { navigateTo('/inventory/create') }">
            {{ $t('pages.inventory.item.add') }}
          </UButton>
          <UPopover v-if="availableLabelKeys.length">
            <UButton color="neutral" variant="ghost" icon="i-lucide-table-properties" />
            <template #content>
              <div class="p-3 w-48 space-y-2 select-none">
                <div class="text-sm font-semibold text-neutral-600 mb-1">{{ $t('pages.inventory.item.labels') }}</div>
                <div class="space-y-1.5 max-h-48 overflow-y-auto">
                  <div v-for="key in availableLabelKeys" :key="key" class="flex items-center gap-2">
                    <UCheckbox :model-value="activeLabelColumns.includes(key)" :label="key" @update:model-value="(v: boolean | 'indeterminate') => toggleLabelColumn(key, v === true)" />
                  </div>
                </div>
              </div>
            </template>
          </UPopover>
        </div>
      </template>
    </DataTable>

    <InventoryVariantManagerModal v-model="showVariantModal" :inventory="selectedItem" @changed="fetchItems" />
    <DeleteModal v-model="showDeleteModal" :item-name="selectedItem?.name" :loading="deleting" @confirm="confirmDelete" />
    <!-- Lightbox Modal -->
    <Lightbox />
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
const { openLightbox } = useLightbox()

const UButton = resolveComponent('UButton')
const NuxtImg = resolveComponent('NuxtImg')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const data = ref<Inventory[]>([])
const isLoading = ref(false)
const meta = reactive({ total: 0, from: 0, to: 0 })

const selectedItem = ref<Inventory | null>(null)
const showVariantModal = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)

const availableLabelKeys = ref<string[]>([])
const activeLabelColumns = ref<string[]>([])

const { search, page, perPage, sortBy, order, sortHeader } = useTableQuery(() => fetchItems(), { defaultSortBy: 'createdAt', defaultOrder: 'DESC' })

const fetchItems = async () => {
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

const toggleLabelColumn = (key: string, on: boolean) => {
  activeLabelColumns.value = on
    ? [...activeLabelColumns.value, key]
    : activeLabelColumns.value.filter(k => k !== key)
  localStorage.setItem('inventory_label_columns', JSON.stringify(activeLabelColumns.value))
}

const columns = computed<TableColumn<Inventory>[]>(() => {
  const list: TableColumn<Inventory>[] = [
    {
    accessorKey: 'name',
    header: sortHeader(t('common.name'), 'name'),
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
            h('span', { class: 'text-neutral-400 text-xs' }, 'N/A')
          ])

      const textEl = h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { 
          class: 'font-semibold cursor-pointer hover:underline truncate',
          onClick: (e: Event) => {
            e.stopPropagation()
            navigateTo(`/inventory/${row.original.id}`)
          }
        }, row.original.name),
        h('span', { class: 'text-xs text-neutral-500' }, row.original.code || '-')
      ])

      return h('div', { class: 'flex items-center gap-3' }, [imageEl, textEl])
    }
  },
    // {
    //   id: 'photo',
    //   header: '',
    //   meta: { class: { td: 'w-14', th: 'w-14' } },
    //   cell: ({ row }) => h(UAvatar, { src: row.original.image || undefined, alt: row.original.name, icon: 'i-lucide-package', size: 'md', class: 'bg-neutral-100 text-neutral-400' })
    // },
    // {
    //   accessorKey: 'name',
    //   header: sortHeader(t('common.name'), 'name'),
    //   cell: ({ row }) => h('div', {}, [
    //     h('span', { class: 'font-medium text-neutral-900 cursor-pointer hover:underline block', onClick: () => navigateTo(`/inventory/${row.original.id}`) }, row.original.name),
    //     h('span', { class: 'text-xs text-neutral-500' }, row.original.code || '-')
    //   ])
    // },
    { accessorKey: 'category', header: t('common.category'), cell: ({ row }) => h('span', { class: 'text-neutral-700' }, row.original.category?.name || '-') },
    { accessorKey: 'subCategory', header: t('common.subCategory'), cell: ({ row }) => h('span', { class: 'text-neutral-700' }, row.original.subCategory?.name || '-') },
    { accessorKey: 'unit', header: t('pages.inventory.unit.label'), cell: ({ row }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () => row.original.unit || '-') },
  ]

  for (const key of activeLabelColumns.value) {
    list.push({
      id: `label:${key}`,
      header: key,
      cell: ({ row }) => h('span', { class: 'text-neutral-600' }, row.original.labels?.find(l => l.key === key)?.value || '-')
    })
  }

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
  const item = row.original
  const items: any[] = [{
    label: t('pages.inventory.detail.open'),
    icon: 'i-lucide-eye',
    onSelect() { navigateTo(`/inventory/${item.id}`) }
  }, {
    label: t('pages.inventory.variant.manageTitle'),
    icon: 'i-lucide-layers',
    onSelect() { selectedItem.value = item; showVariantModal.value = true }
  }]
  if (hasPermission('inventory:update')) {
    items.push({ label: t('common.edit'), icon: 'i-lucide-edit-3', onSelect() { navigateTo(`/inventory/${item.id}/edit`) } })
  }
  if (hasPermission('inventory:delete')) {
    items.push({ label: t('common.delete'), icon: 'i-lucide-trash-2', color: 'error' as const, onSelect() { selectedItem.value = item; showDeleteModal.value = true } })
  }
  return items
}

const confirmDelete = async () => {
  if (!selectedItem.value) return
  deleting.value = true
  try {
    const res = await inventoryService.remove(selectedItem.value.id)
    if (res.success) {
      toast.add({ title: t('common.delete'), color: 'success', icon: 'i-lucide-circle-check' })
      showDeleteModal.value = false
      fetchItems()
    } else {
      toast.add({ title: res.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  const saved = localStorage.getItem('inventory_label_columns')
  if (saved) { try { activeLabelColumns.value = JSON.parse(saved) } catch { /* ignore */ } }
  fetchItems()
  const keys = await inventoryService.getLabelKeys()
  if (keys.success && keys.data) availableLabelKeys.value = keys.data
})
</script>
