<template>
  <div class="space-y-4">
    <DataTable
      v-model:page="page"
      v-model:perPage="perPage"
      v-model:expanded="expanded"
      :data="data"
      :columns="columns"
      :loading="isLoading"
      :from="meta.from"
      :to="meta.to"
      :total="meta.total"
      :searchable="false"
      table-class="min-w-[860px]"
    >
      <template #actions>
        <UButton v-if="canOpname" icon="i-lucide-clipboard-check" color="primary" :label="$t('pages.inventory.opname.button')" @click="() => { showOpnameModal = true }" />
      </template>

      <template #expanded="{ row }">
        <UTable
          :data="row.original.items || []"
          :columns="itemColumns"
          :ui="{ th: 'bg-muted py-2', td: 'py-2' }"
          class="border border-default rounded-md"
        />
      </template>
    </DataTable>

    <OpnameModal v-model="showOpnameModal" :inventory-id="inventoryId" @done="onSaved" />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { inventoryStockOpnameService } from '~/services/inventory-stock-opname-service'
import OpnameModal from '~/components/inventory-stock-opname/OpnameModal.vue'
import type { InventoryStockOpname } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const route = useRoute()
const { hasPermission } = useAuth()
const inventoryId = Number(route.params.id)
const canOpname = hasPermission('inventory-stock:opname')

const stockOverview = inject('inventoryStock', null) as { refresh: () => void } | null

const UIcon = resolveComponent('UIcon')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

const data = ref<InventoryStockOpname[]>([])
const isLoading = ref(false)
const meta = reactive({ total: 0, from: 0, to: 0 })
const page = ref(1)
const perPage = ref(10)
const showOpnameModal = ref(false)
const expanded = ref<Record<string, boolean>>({})

watch([page, perPage], () => { fetchHistory() })

const fetchHistory = async () => {
  isLoading.value = true
  try {
    const res = await inventoryStockOpnameService.getAll(page.value, perPage.value, { inventoryId })
    if (res.success && res.data) {
      data.value = res.data
      expanded.value = {}
      if (res.meta) { meta.total = res.meta.total; meta.from = res.meta.from; meta.to = res.meta.to }
    }
  } finally {
    isLoading.value = false
  }
}

const onSaved = () => {
  fetchHistory()
  stockOverview?.refresh()
}

// Columns for the nested per-opname item table shown in the expanded row.
type OpnameItem = NonNullable<InventoryStockOpname['items']>[number]
const itemColumns: TableColumn<OpnameItem>[] = [
  { id: 'variant', header: t('pages.inventory.variant.title'), cell: ({ row }) => h('span', { class: 'text-highlighted text-sm' }, row.original.variant?.name || '-') },
  { id: 'condition', header: t('pages.inventory.condition.label'), cell: ({ row }) => {
    const c = row.original.condition
    return h('span', { class: c === 'new' ? 'text-emerald-600 text-sm' : 'text-amber-600 text-sm' }, c === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used'))
  } },
  { id: 'systemQuantity', header: t('pages.inventory.opname.system'), cell: ({ row }) => h('span', { class: 'text-toned text-sm' }, row.original.systemQuantity) },
  { id: 'countedQuantity', header: t('pages.inventory.opname.counted'), cell: ({ row }) => h('span', { class: 'text-highlighted font-medium text-sm' }, row.original.countedQuantity) },
  { id: 'quantity', header: t('pages.inventory.opname.difference'), cell: ({ row }) => {
    const q = row.original.quantity
    return h('span', { class: `font-semibold text-sm ${q > 0 ? 'text-success' : 'text-error'}` }, q > 0 ? `+${q}` : `${q}`)
  } },
]

const columns: TableColumn<InventoryStockOpname>[] = [
  { id: 'expand', header: '', meta: { class: { td: 'w-8', th: 'w-8' } }, cell: ({ row }) => {
    const items = row.original.items || []
    if (items.length === 0) return null
    return h('button', {
      type: 'button',
      class: 'flex items-center justify-center text-muted hover:text-highlighted cursor-pointer',
      onClick: () => row.toggleExpanded()
    }, [
      h(UIcon, { name: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right', class: 'w-4 h-4' })
    ])
  } },
  { accessorKey: 'createdAt', header: t('common.date'), cell: ({ row }) => h('span', { class: 'text-toned text-sm' }, new Date(row.original.createdAt).toLocaleString()) },
  { id: 'branch', header: t('common.branch'), cell: ({ row }) => h('span', { class: 'text-toned text-sm' }, row.original.branch?.name || '-') },
  { accessorKey: 'note', header: t('common.note'), cell: ({ row }) => h('span', { class: 'text-toned text-sm' }, row.original.note || '-') },
  { accessorKey: 'createdBy', header: t('common.createdBy'), cell: ({ row }) => {
    const creator = row.original.createdBy
    if (!creator) return h('span', { class: 'text-muted italic text-sm' }, t('common.system'))
    return h('div', { class: 'flex items-center gap-2' }, [
      h(UAvatar, { src: creator.photo || undefined, alt: creator.name, size: 'xs', class: 'bg-primary-50 text-primary-700', loading: 'lazy' }),
      h('span', { class: 'text-default font-medium text-sm' }, creator.name)
    ])
  } },
  { id: 'attachments', header: t('component.attachment.title'), cell: ({ row }) => {
    const atts = row.original.attachments || []
    if (!atts.length) return h('span', { class: 'text-dimmed text-xs' }, '-')
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
