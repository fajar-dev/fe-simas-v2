<template>
  <div class="space-y-4">
    <DataTable
      v-model:search="search"
      v-model:page="page"
      v-model:perPage="perPage"
      v-model:expanded="expanded"
      :data="pagedVariants"
      :columns="variantColumns"
      :loading="isLoading"
      :from="from"
      :to="to"
      :total="total"
      :search-placeholder="$t('pages.inventory.variant.searchPlaceholder')"
      table-class="min-w-[720px]"
    >
      <template #actions>
        <UButton v-if="hasPermission('inventory-variant:read')" color="primary" icon="i-lucide-layers" @click="() => { showVariantModal = true }">
          {{ $t('pages.inventory.variant.manageTitle') }}
        </UButton>
      </template>

      <template #expanded="{ row }">
        <UTable
          :data="row.original.branches"
          :columns="branchColumns"
          :ui="{ th: 'bg-neutral-50 py-2', td: 'py-2' }"
          class="border border-neutral-200 rounded-md"
        />
      </template>
    </DataTable>

    <InventoryVariantManagerModal v-model="showVariantModal" :inventory="item" @changed="onVariantsChanged" />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { inventoryVariantService } from '~/services/inventory-variant-service'
import { inventoryStockService } from '~/services/inventory-stock-service'
import type { Inventory, InventoryVariant } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const route = useRoute()
const { hasPermission } = useAuth()
const inventoryId = Number(route.params.id)

const { item } = inject('inventoryState') as { item: Ref<Inventory | null> }

const UIcon = resolveComponent('UIcon')
const NuxtImg = resolveComponent('NuxtImg')

interface BranchStockRow {
  branchId: number
  name: string
  newStock: number
  usedStock: number
}

interface VariantStockRow extends InventoryVariant {
  newStock: number
  usedStock: number
  branches: BranchStockRow[]
}

const allVariants = ref<VariantStockRow[]>([])
const isLoading = ref(false)
const showVariantModal = ref(false)

const search = ref('')
const page = ref(1)
const perPage = ref(10)
const expanded = ref<Record<string, boolean>>({})

const filteredVariants = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allVariants.value
  return allVariants.value.filter(v => v.name.toLowerCase().includes(q) || (v.code || '').toLowerCase().includes(q))
})
const total = computed(() => filteredVariants.value.length)
const from = computed(() => total.value === 0 ? 0 : (page.value - 1) * perPage.value + 1)
const to = computed(() => Math.min(page.value * perPage.value, total.value))
const pagedVariants = computed(() => filteredVariants.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

watch(search, () => { page.value = 1 })

const branchColumns: TableColumn<BranchStockRow>[] = [
  { accessorKey: 'name', header: t('common.branch'), cell: ({ row }) => h('span', { class: 'text-neutral-800 text-sm' }, row.original.name) },
  { accessorKey: 'newStock', header: t('pages.inventory.condition.new'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h('span', { class: 'text-emerald-600 text-sm font-medium' }, String(row.original.newStock)) },
  { accessorKey: 'usedStock', header: t('pages.inventory.condition.used'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h('span', { class: 'text-amber-600 text-sm font-medium' }, String(row.original.usedStock)) },
]

const variantColumns: TableColumn<VariantStockRow>[] = [
  { id: 'expand', header: '', meta: { class: { td: 'w-8', th: 'w-8' } }, cell: ({ row }) => {
    if (!row.original.branches.length) return null
    return h('button', {
      type: 'button',
      class: 'flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer',
      onClick: (e: Event) => { e.stopPropagation(); row.toggleExpanded() }
    }, [
      h(UIcon, { name: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right', class: 'w-4 h-4' })
    ])
  } },
  { accessorKey: 'name', header: t('common.name'), cell: ({ row }) => {
    const img = row.original.image
    const imageEl = img
      ? h(NuxtImg, { src: img, alt: row.original.name, class: 'w-9 h-9 object-cover rounded-md border border-neutral-200 shrink-0' })
      : h('div', { class: 'w-9 h-9 bg-neutral-100 rounded-md flex items-center justify-center border border-neutral-200 shrink-0' }, [
          h('span', { class: 'text-neutral-400 text-xs' }, 'N/A')
        ])
    const textEl = h('div', { class: 'flex flex-col min-w-0' }, [
      h('span', { class: 'text-neutral-900 font-medium text-sm' }, row.original.name),
      h('span', { class: 'text-xs text-neutral-500' }, row.original.code || '-')
    ])
    return h('div', { class: 'flex items-center gap-3' }, [imageEl, textEl])
  } },
  { accessorKey: 'description', header: t('common.description'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, row.original.description || '-') },
  { accessorKey: 'newStock', header: t('pages.inventory.condition.new'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h('span', { class: 'text-emerald-600 text-sm font-medium' }, String(row.original.newStock)) },
  { accessorKey: 'usedStock', header: t('pages.inventory.condition.used'), meta: { class: { td: 'text-center', th: 'text-center' } }, cell: ({ row }) => h('span', { class: 'text-amber-600 text-sm font-medium' }, String(row.original.usedStock)) },
]

const fetchData = async () => {
  isLoading.value = true
  try {
    const [variantsRes, balancesRes] = await Promise.all([
      inventoryVariantService.getByInventory(inventoryId),
      inventoryStockService.getBalances(1, 500, { inventoryId })
    ])
    if (variantsRes.success && variantsRes.data) {
      const stockByVariant = new Map<number, { new: number, used: number, branches: Map<number, BranchStockRow> }>()
      for (const b of balancesRes.data ?? []) {
        if (!b.variant || !b.branch) continue
        let entry = stockByVariant.get(b.variant.id)
        if (!entry) {
          entry = { new: 0, used: 0, branches: new Map() }
          stockByVariant.set(b.variant.id, entry)
        }
        if (b.condition === 'new') entry.new += b.quantity
        else entry.used += b.quantity

        let branchEntry = entry.branches.get(b.branch.id)
        if (!branchEntry) {
          branchEntry = { branchId: b.branch.id, name: b.branch.name, newStock: 0, usedStock: 0 }
          entry.branches.set(b.branch.id, branchEntry)
        }
        if (b.condition === 'new') branchEntry.newStock += b.quantity
        else branchEntry.usedStock += b.quantity
      }
      allVariants.value = variantsRes.data.map(v => {
        const entry = stockByVariant.get(v.id)
        return {
          ...v,
          newStock: entry?.new ?? 0,
          usedStock: entry?.used ?? 0,
          branches: entry ? Array.from(entry.branches.values()) : [],
        }
      })
    }
  } finally {
    isLoading.value = false
  }
}

const onVariantsChanged = () => {
  expanded.value = {}
  fetchData()
}

onMounted(fetchData)
</script>
