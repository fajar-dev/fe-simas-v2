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
        <UButton v-if="canAdd" icon="i-lucide-plus" color="primary" :label="$t('pages.inventory.addStock.button')" @click="() => { showAddModal = true }" />
      </template>
    </DataTable>

    <InventoryAddStockModal v-model="showAddModal" :inventory-id="inventoryId" @done="onAdded" />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { inventoryStockService } from '~/services/inventory-stock-service'
import type { InventoryStockMovement } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const route = useRoute()
const { hasPermission } = useAuth()
const inventoryId = Number(route.params.id)
const canAdd = hasPermission('inventory-stock:entry')

const stockOverview = inject('inventoryStock', null) as { refresh: () => void } | null

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

const data = ref<InventoryStockMovement[]>([])
const isLoading = ref(false)
const meta = reactive({ total: 0, from: 0, to: 0 })
const page = ref(1)
const perPage = ref(10)
const showAddModal = ref(false)

watch([page, perPage], () => { fetchHistory() })

const fetchHistory = async () => {
  isLoading.value = true
  try {
    // Stock additions are "entry" movements (stock-in).
    const res = await inventoryStockService.getMovements(page.value, perPage.value, { inventoryId, type: 'entry' })
    if (res.success && res.data) {
      data.value = res.data
      if (res.meta) { meta.total = res.meta.total; meta.from = res.meta.from; meta.to = res.meta.to }
    }
  } finally {
    isLoading.value = false
  }
}

const onAdded = () => {
  fetchHistory()
  stockOverview?.refresh()
}

const columns: TableColumn<InventoryStockMovement>[] = [
  { accessorKey: 'createdAt', header: t('common.date'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, new Date(row.original.createdAt).toLocaleString()) },
  { accessorKey: 'variant', header: t('pages.inventory.variant.title'), cell: ({ row }) => h('span', { class: 'text-neutral-900 font-medium' }, row.original.variant?.name || '-') },
  { accessorKey: 'branch', header: t('common.branch'), cell: ({ row }) => h('span', { class: 'text-neutral-700 text-sm' }, row.original.branch?.name || '-') },
  { accessorKey: 'condition', header: t('pages.inventory.condition.label'), cell: ({ row }) => {
    const c = row.original.condition
    return h('span', { class: c === 'new' ? 'text-emerald-600 text-sm' : 'text-amber-600 text-sm' }, c === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used'))
  } },
  { accessorKey: 'quantity', header: t('pages.inventory.monitor.quantity'), cell: ({ row }) => {
    const q = row.original.quantity
    return h('span', { class: 'font-semibold text-emerald-600' }, q > 0 ? `+${q}` : `${q}`)
  } },
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

onMounted(fetchHistory)
</script>
