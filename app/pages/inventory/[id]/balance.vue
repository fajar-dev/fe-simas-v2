<template>
  <div class="space-y-3">
    <div v-if="canAdd" class="flex justify-end">
      <UButton icon="i-lucide-plus" color="primary" @click="() => { showAddModal = true }">
        {{ $t('pages.inventory.addStock.button') }}
      </UButton>
    </div>

    <div class="overflow-x-auto">
      <UTable
        :data="flatRows"
        :columns="columns"
        :loading="isLoading"
        :ui="{
          th: 'bg-neutral-50 py-2',
          td: 'py-2 border-b border-neutral-100'
        }"
        class="min-w-[480px] border border-neutral-200 rounded-md"
      />
    </div>

    <InventoryAddStockModal v-model="showAddModal" :inventory-id="inventoryId" @done="fetchBalances" />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { inventoryStockService } from '~/services/inventory-stock-service'
import type { StockCondition } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const route = useRoute()
const { hasPermission } = useAuth()
const inventoryId = Number(route.params.id)

const canAdd = hasPermission('inventory-stock:entry')
const showAddModal = ref(false)

const UIcon = resolveComponent('UIcon')

type Condition = { condition: StockCondition, quantity: number }
type Variant = { variantId: number, name: string, unit: string, total: number, conditions: Condition[] }
type Branch = { branchId: number, name: string, total: number, variants: Variant[] }

type FlatRow = {
  key: string
  kind: 'branch' | 'variant' | 'condition'
  depth: number
  label: string
  unit?: string
  condition?: StockCondition
  qty: number
  canExpand: boolean
  isOpen: boolean
  onToggle?: () => void
}

const tree = ref<Branch[]>([])
const isLoading = ref(false)
const openBranches = ref<Set<number>>(new Set())
const openVariants = ref<Set<string>>(new Set())

const toggleBranch = (id: number) => {
  const s = new Set(openBranches.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openBranches.value = s
}
const toggleVariant = (key: string) => {
  const s = new Set(openVariants.value)
  s.has(key) ? s.delete(key) : s.add(key)
  openVariants.value = s
}

/** Only the currently-visible rows, in display order (expansion handled manually). */
const flatRows = computed<FlatRow[]>(() => {
  const out: FlatRow[] = []
  for (const b of tree.value) {
    const bOpen = openBranches.value.has(b.branchId)
    out.push({ key: `b${b.branchId}`, kind: 'branch', depth: 0, label: b.name, qty: b.total, canExpand: b.variants.length > 0, isOpen: bOpen, onToggle: () => toggleBranch(b.branchId) })
    if (!bOpen) continue
    for (const v of b.variants) {
      const vk = `${b.branchId}:${v.variantId}`
      const vOpen = openVariants.value.has(vk)
      out.push({ key: `v${vk}`, kind: 'variant', depth: 1, label: v.name, unit: v.unit, qty: v.total, canExpand: true, isOpen: vOpen, onToggle: () => toggleVariant(vk) })
      if (!vOpen) continue
      for (const c of v.conditions) {
        out.push({ key: `c${vk}:${c.condition}`, kind: 'condition', depth: 2, label: c.condition === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used'), condition: c.condition, unit: v.unit, qty: c.quantity, canExpand: false, isOpen: false })
      }
    }
  }
  return out
})

function renderName(row: FlatRow) {
  const lead = row.canExpand
    ? h(UIcon, { name: row.isOpen ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right', class: 'w-4 h-4 text-neutral-400 shrink-0' })
    : h('span', { class: 'w-4 shrink-0' })

  let label: any
  if (row.kind === 'branch') {
    label = h('span', { class: 'font-semibold text-neutral-900' }, row.label)
  } else if (row.kind === 'variant') {
    label = h('span', { class: 'flex items-baseline gap-1.5' }, [
      h('span', { class: 'font-medium text-neutral-800' }, row.label),
      h('span', { class: 'text-xs text-neutral-400' }, row.unit)
    ])
  } else {
    label = h('span', { class: `text-sm ${row.condition === 'new' ? 'text-emerald-600' : 'text-amber-600'}` }, row.label)
  }

  return h('div', {
    class: ['flex items-center gap-2', row.canExpand ? 'cursor-pointer select-none' : ''],
    style: { paddingLeft: `${row.depth * 22}px` },
    onClick: row.onToggle
  }, [lead, label])
}

function renderQty(row: FlatRow) {
  if (row.kind === 'condition') return h('span', { class: 'text-sm text-neutral-600' }, `${row.qty} ${row.unit}`)
  if (row.kind === 'variant') return h('span', { class: 'text-sm font-medium text-neutral-800' }, `${row.qty} ${row.unit}`)
  return h('span', { class: 'text-sm font-semibold text-neutral-900' }, String(row.qty))
}

const columns: TableColumn<FlatRow>[] = [
  {
    accessorKey: 'label',
    header: () => `${t('common.branch')} / ${t('pages.inventory.variant.title')}`,
    cell: ({ row }: { row: Row<FlatRow> }) => renderName(row.original)
  },
  {
    accessorKey: 'qty',
    header: () => t('pages.inventory.monitor.quantity'),
    meta: { class: { td: 'text-right w-40', th: 'text-right w-40' } },
    cell: ({ row }: { row: Row<FlatRow> }) => renderQty(row.original)
  }
]

/** Flatten branch × variant × condition balance rows into a nested tree. */
function buildTree(balances: Awaited<ReturnType<typeof inventoryStockService.getBalances>>['data']): Branch[] {
  const byBranch = new Map<number, { node: Branch, variants: Map<number, Variant> }>()
  for (const r of balances ?? []) {
    if (!r.branch || !r.variant) continue
    let b = byBranch.get(r.branch.id)
    if (!b) {
      b = { node: { branchId: r.branch.id, name: r.branch.name, total: 0, variants: [] }, variants: new Map() }
      byBranch.set(r.branch.id, b)
    }
    let v = b.variants.get(r.variant.id)
    if (!v) {
      v = { variantId: r.variant.id, name: r.variant.name, unit: r.variant.unit, total: 0, conditions: [{ condition: 'new', quantity: 0 }, { condition: 'used', quantity: 0 }] }
      b.variants.set(r.variant.id, v)
      b.node.variants.push(v)
    }
    const cond = v.conditions.find(c => c.condition === r.condition)
    if (cond) cond.quantity += r.quantity
    v.total += r.quantity
    b.node.total += r.quantity
  }
  return Array.from(byBranch.values(), b => b.node)
}

const fetchBalances = async () => {
  isLoading.value = true
  try {
    const res = await inventoryStockService.getBalances(1, 500, { inventoryId })
    tree.value = res.success ? buildTree(res.data) : []
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchBalances)
</script>
