<template>
  <div class="space-y-4">
    <DataTable
      v-model:page="page"
      v-model:perPage="perPage"
      :data="data"
      :columns="columns"
      :loading="isLoading"
      :from="meta.from"
      :to="meta.to"
      :total="meta.total"
      :searchable="false"
      table-class="min-w-[820px]"
    >
      <template #actions>
        <UButton
          v-if="canTransfer"
          icon="i-lucide-arrow-left-right"
          color="primary"
          :label="$t('pages.inventory.transfer.submit')"
          @click="() => { showModal = true }"
        />
      </template>
    </DataTable>

    <InventoryTransferModal v-model="showModal" :inventory-id="inventoryId" @done="fetchTransfers" />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { inventoryStockTransferService } from '~/services/inventory-stock-transfer-service'
import type { InventoryStockTransfer } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const route = useRoute()
const inventoryId = Number(route.params.id)
const canTransfer = useAuth().hasPermission('inventory-stock:transfer')

const UIcon = resolveComponent('UIcon')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const InventoryItemsExpandCell = resolveComponent('InventoryItemsExpandCell')

const data = ref<InventoryStockTransfer[]>([])
const isLoading = ref(false)
const meta = reactive({ total: 0, from: 0, to: 0 })
const page = ref(1)
const perPage = ref(10)
const showModal = ref(false)

watch([page, perPage], () => { fetchTransfers() })

const fetchTransfers = async () => {
  isLoading.value = true
  try {
    const res = await inventoryStockTransferService.getAll(page.value, perPage.value, { inventoryId })
    if (res.success && res.data) {
      data.value = res.data
      if (res.meta) { meta.total = res.meta.total; meta.from = res.meta.from; meta.to = res.meta.to }
    }
  } finally {
    isLoading.value = false
  }
}

const columns: TableColumn<InventoryStockTransfer>[] = [
  { accessorKey: 'createdAt', header: t('common.date'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, new Date(row.original.createdAt).toLocaleString()) },
  { id: 'route', header: t('pages.inventory.transfer.title'), cell: ({ row }) => h('div', { class: 'flex items-center gap-2 text-sm' }, [
    h('span', { class: 'text-neutral-700' }, row.original.fromBranch?.name || '-'),
    h(UIcon, { name: 'i-lucide-arrow-right', class: 'w-4 h-4 text-neutral-400' }),
    h('span', { class: 'text-neutral-900 font-medium' }, row.original.toBranch?.name || '-')
  ]) },
  { id: 'items', header: t('pages.inventory.variant.title'), cell: ({ row }) => h(InventoryItemsExpandCell, {
    items: (row.original.items || []).map(it => ({
      key: it.id,
      variantName: it.variant?.name || '-',
      condition: it.condition,
      quantityLabel: `× ${it.quantity}`,
    }))
  }) },
  { accessorKey: 'note', header: t('common.note'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, row.original.note || '-') },
  { accessorKey: 'createdBy', header: t('common.createdBy'), cell: ({ row }) => {
    const creator = row.original.createdBy
    if (!creator) return h('span', { class: 'text-neutral-500 italic text-sm' }, t('common.system'))
    return h('div', { class: 'flex items-center gap-2' }, [
      h(UAvatar, { src: creator.photo || undefined, alt: creator.name, size: 'xs', class: 'bg-primary-50 text-primary-700', loading: 'lazy' }),
      h('span', { class: 'text-neutral-700 font-medium text-sm' }, creator.name)
    ])
  } },
  { id: 'attachments', header: t('component.attachment.title'), cell: ({ row }) => {
    const atts = row.original.attachments || []
    if (!atts.length) return h('span', { class: 'text-neutral-400 text-xs' }, '-')
    return h('div', { class: 'flex flex-wrap gap-2 max-w-sm' }, atts.map((att) => {
      const theme = getAttachmentBadgeTheme(att.mimeType)
      return h('a', { href: att.url, target: '_blank', rel: 'noopener', class: 'cursor-pointer inline-block max-w-[160px]' }, [
        h(UBadge, { color: theme.color, variant: 'subtle', icon: theme.icon, label: att.originalName, class: 'max-w-full truncate' })
      ])
    }))
  } }
]

onMounted(fetchTransfers)
</script>
