<template>
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
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { inventoryStockService } from '~/services/inventory-stock-service'
import type { StockCondition } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const route = useRoute()
const inventoryId = Number(route.params.id)

const UIcon = resolveComponent('UIcon')

type Condition = { condition: StockCondition, quantity: number }
type Branch = { branchId: number, name: string, total: number, conditions: Condition[] }
type Variant = { variantId: number, name: string, unit: string, total: number, branches: Branch[] }

type FlatRow = {
  key: string
  kind: 'variant' | 'branch' | 'condition'
  depth: number
  label: string
  unit?: string
  condition?: StockCondition
  qty: number
  canExpand: boolean
  isOpen: boolean
  onToggle?: () => void
}

const tree = ref<Variant[]>([])
const isLoading = ref(false)
const openVariants = ref<Set<number>>(new Set())
const openBranches = ref<Set<string>>(new Set())

const toggleVariant = (id: number) => {
  const s = new Set(openVariants.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openVariants.value = s
}
const toggleBranch = (key: string) => {
  const s = new Set(openBranches.value)
  s.has(key) ? s.delete(key) : s.add(key)
  openBranches.value = s
}

/** Only the currently-visible rows, in display order (expansion handled manually). */
const flatRows = computed<FlatRow[]>(() => {
  const out: FlatRow[] = []
  for (const v of tree.value) {
    const vOpen = openVariants.value.has(v.variantId)
    out.push({ key: `v${v.variantId}`, kind: 'variant', depth: 0, label: v.name, unit: v.unit, qty: v.total, canExpand: v.branches.length > 0, isOpen: vOpen, onToggle: () => toggleVariant(v.variantId) })
    if (!vOpen) continue
    for (const b of v.branches) {
      const bk = `${v.variantId}:${b.branchId}`
      const bOpen = openBranches.value.has(bk)
      out.push({ key: `b${bk}`, kind: 'branch', depth: 1, label: b.name, qty: b.total, canExpand: true, isOpen: bOpen, onToggle: () => toggleBranch(bk) })
      if (!bOpen) continue
      for (const c of b.conditions) {
        out.push({ key: `c${bk}:${c.condition}`, kind: 'condition', depth: 2, label: c.condition === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used'), condition: c.condition, unit: v.unit, qty: c.quantity, canExpand: false, isOpen: false })
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
  if (row.kind === 'variant') {
    label = h('span', { class: 'flex items-baseline gap-1.5' }, [
      h('span', { class: 'font-semibold text-neutral-900' }, row.label),
      h('span', { class: 'text-xs text-neutral-400' }, row.unit)
    ])
  } else if (row.kind === 'branch') {
    label = h('span', { class: 'font-medium text-neutral-800' }, row.label)
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
  if (row.kind === 'branch') return h('span', { class: 'text-sm font-medium text-neutral-800' }, String(row.qty))
  return h('span', { class: 'text-sm font-semibold text-neutral-900' }, `${row.qty} ${row.unit}`)
}

const columns: TableColumn<FlatRow>[] = [
  {
    accessorKey: 'label',
    header: () => `${t('pages.inventory.variant.title')} / ${t('common.branch')}`,
    cell: ({ row }: { row: Row<FlatRow> }) => renderName(row.original)
  },
  {
    accessorKey: 'qty',
    header: () => t('pages.inventory.monitor.quantity'),
    meta: { class: { td: 'text-right w-40', th: 'text-right w-40' } },
    cell: ({ row }: { row: Row<FlatRow> }) => renderQty(row.original)
  }
]

/** Flatten variant × branch × condition balance rows into a nested tree. */
function buildTree(balances: Awaited<ReturnType<typeof inventoryStockService.getBalances>>['data']): Variant[] {
  const byVariant = new Map<number, { node: Variant, branches: Map<number, Branch> }>()
  for (const r of balances ?? []) {
    if (!r.branch || !r.variant) continue
    let v = byVariant.get(r.variant.id)
    if (!v) {
      v = { node: { variantId: r.variant.id, name: r.variant.name, unit: r.variant.unit, total: 0, branches: [] }, branches: new Map() }
      byVariant.set(r.variant.id, v)
    }
    let b = v.branches.get(r.branch.id)
    if (!b) {
      b = { branchId: r.branch.id, name: r.branch.name, total: 0, conditions: [{ condition: 'new', quantity: 0 }, { condition: 'used', quantity: 0 }] }
      v.branches.set(r.branch.id, b)
      v.node.branches.push(b)
    }
    const cond = b.conditions.find(c => c.condition === r.condition)
    if (cond) cond.quantity += r.quantity
    b.total += r.quantity
    v.node.total += r.quantity
  }
  return Array.from(byVariant.values(), v => v.node)
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
