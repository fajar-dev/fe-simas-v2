<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row items-center gap-2">
      <USelect v-model="typeFilter" :items="typeOptions" class="w-full sm:w-52" />
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
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { inventoryStockService } from '~/services/inventory-stock-service'
import type { InventoryStockMovement, StockMovementType } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const route = useRoute()
const inventoryId = Number(route.params.id)

const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')

const data = ref<InventoryStockMovement[]>([])
const isLoading = ref(false)
const meta = reactive({ total: 0, from: 0, to: 0 })
const page = ref(1)
const perPage = ref(10)
const typeFilter = ref<'all' | StockMovementType>('all')

const typeOptions = computed(() => [
  { label: t('common.all'), value: 'all' },
  { label: t('pages.inventory.movement.entry'), value: 'entry' },
  { label: t('pages.inventory.movement.transferOut'), value: 'transfer_out' },
  { label: t('pages.inventory.movement.transferIn'), value: 'transfer_in' },
  { label: t('pages.inventory.movement.assignOut'), value: 'assign_out' },
  { label: t('pages.inventory.movement.returnIn'), value: 'return_in' }
])

const typeMeta: Record<string, { label: string, color: string }> = {
  entry: { label: 'entry', color: 'primary' },
  adjustment: { label: 'adjustment', color: 'neutral' },
  transfer_out: { label: 'transferOut', color: 'warning' },
  transfer_in: { label: 'transferIn', color: 'info' },
  assign_out: { label: 'assignOut', color: 'error' },
  return_in: { label: 'returnIn', color: 'success' }
}

watch([page, perPage, typeFilter], () => { fetchMovements() })

const fetchMovements = async () => {
  isLoading.value = true
  try {
    const res = await inventoryStockService.getMovements(page.value, perPage.value, {
      inventoryId,
      type: typeFilter.value === 'all' ? undefined : typeFilter.value
    })
    if (res.success && res.data) {
      data.value = res.data
      if (res.meta) { meta.total = res.meta.total; meta.from = res.meta.from; meta.to = res.meta.to }
    }
  } finally {
    isLoading.value = false
  }
}

const columns: TableColumn<InventoryStockMovement>[] = [
  { accessorKey: 'createdAt', header: t('common.date'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, new Date(row.original.createdAt).toLocaleString()) },
  { accessorKey: 'type', header: t('pages.inventory.movement.type'), cell: ({ row }) => {
    const m = typeMeta[row.original.type] || { label: row.original.type, color: 'neutral' }
    return h(UBadge, { color: m.color as any, variant: 'subtle' }, () => t(`pages.inventory.movement.${m.label}`))
  } },
  { accessorKey: 'variant', header: t('pages.inventory.variant.title'), cell: ({ row }) => h('span', { class: 'text-neutral-900' }, row.original.variant?.name || '-') },
  { accessorKey: 'branch', header: t('common.branch'), cell: ({ row }) => h('span', { class: 'text-neutral-700' }, row.original.branch?.name || '-') },
  { accessorKey: 'condition', header: t('pages.inventory.condition.label'), cell: ({ row }) => {
    const c = row.original.condition
    return h(UBadge, { color: c === 'new' ? 'success' : 'warning', variant: 'subtle' }, () => c === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used'))
  } },
  { accessorKey: 'quantity', header: t('pages.inventory.monitor.quantity'), cell: ({ row }) => {
    const q = row.original.quantity
    return h('span', { class: q < 0 ? 'font-semibold text-red-600' : 'font-semibold text-green-600' }, q > 0 ? `+${q}` : `${q}`)
  } },
  { accessorKey: 'createdBy', header: t('common.system'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, row.original.createdBy?.name || '-') },
  { id: 'attachments', header: '', cell: ({ row }) => {
    const atts = row.original.attachments || []
    if (!atts.length) return h('span', { class: 'text-neutral-300' }, '-')
    return h('div', { class: 'flex items-center gap-1.5' }, atts.map(a =>
      h('a', { href: a.url, target: '_blank', rel: 'noopener', title: a.originalName, class: 'text-neutral-500 hover:text-primary' },
        h(UIcon, { name: 'i-lucide-paperclip', class: 'w-4 h-4' }))))
  } }
]

onMounted(fetchMovements)
</script>
