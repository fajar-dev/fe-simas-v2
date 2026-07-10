<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-2">
        <USwitch v-model="activeOnly" :label="$t('pages.inventory.holder.activeOnly')" @update:model-value="fetchHoldings" />
      </div>
      <UButton v-if="hasPermission('inventory-stock:assign')" color="primary" icon="i-lucide-user-plus" @click="openAssign">
        {{ $t('pages.inventory.holder.assign') }}
      </UButton>
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
      table-class="min-w-[800px]"
    />

    <InventoryAssignModal v-model="showAssignModal" :product-id="productId" @done="fetchHoldings" />
    <InventoryReturnModal v-model="showReturnModal" :holding="selectedHolding" @done="fetchHoldings" />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { inventoryStockService } from '~/services/inventory-stock-service'
import type { InventoryStockHolding } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const { hasPermission } = useAuth()
const route = useRoute()
const productId = Number(route.params.id)

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const data = ref<InventoryStockHolding[]>([])
const isLoading = ref(false)
const activeOnly = ref(true)
const meta = reactive({ total: 0, from: 0, to: 0 })

const page = ref(1)
const perPage = ref(10)

const showAssignModal = ref(false)
const showReturnModal = ref(false)
const selectedHolding = ref<InventoryStockHolding | null>(null)

watch([page, perPage], () => fetchHoldings())

const fetchHoldings = async () => {
  isLoading.value = true
  try {
    const res = await inventoryStockService.getHoldings(page.value, perPage.value, { productId, active: activeOnly.value || undefined })
    if (res.success && res.data) {
      data.value = res.data
      if (res.meta) { meta.total = res.meta.total; meta.from = res.meta.from; meta.to = res.meta.to }
    }
  } finally {
    isLoading.value = false
  }
}

const openAssign = () => { showAssignModal.value = true }

const columns = computed<TableColumn<InventoryStockHolding>[]>(() => {
  const cols: TableColumn<InventoryStockHolding>[] = [
    { accessorKey: 'employee', header: t('common.employee'), cell: ({ row }) => h('div', {}, [
      h('span', { class: 'font-medium text-neutral-900 block' }, row.original.employee?.name || '-'),
      h('span', { class: 'text-xs text-neutral-500' }, row.original.employee?.employeeId || '-')
    ]) },
    { accessorKey: 'variant', header: t('pages.inventory.variant.title'), cell: ({ row }) => h('div', {}, [
      h('span', { class: 'text-neutral-900 block' }, row.original.variant?.name || '-'),
      h('span', { class: 'text-xs text-neutral-500' }, row.original.variant?.product?.name || '-')
    ]) },
    { accessorKey: 'branch', header: t('common.branch'), cell: ({ row }) => h('span', { class: 'text-neutral-700' }, row.original.branch?.name || '-') },
    { accessorKey: 'conditionAssigned', header: t('pages.inventory.condition.label'), cell: ({ row }) => {
      const c = row.original.conditionAssigned
      return h(UBadge, { color: c === 'new' ? 'success' : 'warning', variant: 'subtle' }, () => c === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used'))
    } },
    { accessorKey: 'quantityRemaining', header: t('pages.inventory.holder.remaining'), cell: ({ row }) => h('span', { class: 'font-semibold text-neutral-900' }, `${row.original.quantityRemaining} / ${row.original.quantity} ${row.original.variant?.unit || ''}`) }
  ]
  if (hasPermission('inventory-stock:return')) {
    cols.push({
      id: 'actions',
      header: '',
      meta: { class: { td: 'text-right', th: 'text-right' } },
      cell: ({ row }: { row: Row<InventoryStockHolding> }) => row.original.quantityRemaining > 0
        ? h(UButton, { color: 'neutral', variant: 'outline', size: 'xs', icon: 'i-lucide-undo-2', label: t('pages.inventory.holder.return'), onClick: () => openReturn(row.original) })
        : null
    })
  }
  return cols
})

const openReturn = (holding: InventoryStockHolding) => { selectedHolding.value = holding; showReturnModal.value = true }

onMounted(fetchHoldings)
</script>
