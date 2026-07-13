<template>
  <div class="space-y-4">
    <div class="flex items-center justify-end">
      <UButton
        v-if="canTransfer"
        icon="i-lucide-arrow-left-right"
        color="primary"
        :label="$t('pages.inventory.transfer.submit')"
        @click="() => { showModal = true }"
      />
    </div>

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
    />

    <InventoryTransferModal v-model="showModal" :inventory-id="inventoryId" @done="fetchTransfers" />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { inventoryStockService } from '~/services/inventory-stock-service'
import type { InventoryStockTransfer } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const route = useRoute()
const inventoryId = Number(route.params.id)
const canTransfer = useAuth().hasPermission('inventory-stock:transfer')

const UIcon = resolveComponent('UIcon')
const UBadge = resolveComponent('UBadge')

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
    const res = await inventoryStockService.getTransfers(page.value, perPage.value, { inventoryId })
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
  { id: 'items', header: t('pages.inventory.variant.title'), cell: ({ row }) => h('div', { class: 'flex flex-col gap-1' }, (row.original.items || []).map(it =>
    h('div', { class: 'flex items-center gap-2 text-sm' }, [
      h('span', { class: 'text-neutral-900' }, it.variant?.name || '-'),
      h(UBadge, { color: it.condition === 'new' ? 'success' : 'warning', variant: 'subtle', size: 'sm' }, () => it.condition === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used')),
      h('span', { class: 'font-semibold text-neutral-700' }, `× ${it.quantity}`)
    ])
  )) },
  { accessorKey: 'note', header: t('common.note'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, row.original.note || '-') },
  { accessorKey: 'createdBy', header: t('common.createdBy'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, row.original.createdBy?.name || '-') },
  { id: 'attachments', header: '', cell: ({ row }) => {
    const atts = row.original.attachments || []
    if (!atts.length) return h('span', { class: 'text-neutral-300' }, '-')
    return h('div', { class: 'flex items-center gap-1.5' }, atts.map(a =>
      h('a', { href: a.url, target: '_blank', rel: 'noopener', title: a.originalName, class: 'text-neutral-500 hover:text-primary' },
        h(UIcon, { name: 'i-lucide-paperclip', class: 'w-4 h-4' }))))
  } }
]

onMounted(fetchTransfers)
</script>
