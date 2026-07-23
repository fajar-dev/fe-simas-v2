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
      table-class="min-w-[800px]"
    >
      <template #filters>
        <USwitch v-model="activeOnly" :label="$t('pages.inventory.stockOut.activeOnly')" @update:model-value="fetchStockOuts" />
      </template>
      <template #actions>
        <UButton v-if="hasPermission('inventory-stock:assign')" color="primary" icon="i-lucide-package-minus" @click="openAssign">
          {{ $t('pages.inventory.stockOut.assign') }}
        </UButton>
    </template>
    </DataTable>

    <AssignModal v-model="showAssignModal" :inventory-id="inventoryId" @done="fetchStockOuts" />
    <ReturnModal v-model="showReturnModal" :holding="selectedStockOut" @done="fetchStockOuts" />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { inventoryStockOutService } from '~/services/inventory-stock-out-service'
import AssignModal from '~/components/inventory-stock-out/AssignModal.vue'
import ReturnModal from '~/components/inventory-stock-out/ReturnModal.vue'
import type { InventoryStockOut } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const { hasPermission } = useAuth()
const route = useRoute()
const inventoryId = Number(route.params.id)

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const data = ref<InventoryStockOut[]>([])
const isLoading = ref(false)
const activeOnly = ref(true)
const meta = reactive({ total: 0, from: 0, to: 0 })

const page = ref(1)
const perPage = ref(10)

const showAssignModal = ref(false)
const showReturnModal = ref(false)
const selectedStockOut = ref<InventoryStockOut | null>(null)

watch([page, perPage], () => fetchStockOuts())

const fetchStockOuts = async () => {
  isLoading.value = true
  try {
    const res = await inventoryStockOutService.getAll(page.value, perPage.value, { inventoryId, active: activeOnly.value || undefined })
    if (res.success && res.data) {
      data.value = res.data
      if (res.meta) { meta.total = res.meta.total; meta.from = res.meta.from; meta.to = res.meta.to }
    }
  } finally {
    isLoading.value = false
  }
}

const openAssign = () => { showAssignModal.value = true }

const columns = computed<TableColumn<InventoryStockOut>[]>(() => {
  const cols: TableColumn<InventoryStockOut>[] = [
    { accessorKey: 'type', header: t('pages.inventory.stockOut.type'), cell: ({ row }) => {
      const isEmployee = row.original.type === 'employee'
      return h(UBadge, { color: isEmployee ? 'info' : 'neutral', variant: 'subtle' }, () => isEmployee ? t('pages.inventory.stockOut.typeEmployee') : t('pages.inventory.stockOut.typeOther'))
    } },
    { accessorKey: 'employee', header: t('common.employee'), cell: ({ row }) => row.original.employee
      ? h('div', {}, [
          h('span', { class: 'font-medium text-neutral-900 block' }, row.original.employee.name),
          h('span', { class: 'text-xs text-neutral-500' }, row.original.employee.employeeId)
        ])
      : h('span', { class: 'text-neutral-400' }, '-') },
    { accessorKey: 'variant', header: t('pages.inventory.variant.title'), cell: ({ row }) => h('div', {}, [
      h('span', { class: 'text-neutral-900 block' }, row.original.variant?.name || '-'),
      h('span', { class: 'text-xs text-neutral-500' }, row.original.variant?.inventory?.name || '-')
    ]) },
    { accessorKey: 'branch', header: t('common.branch'), cell: ({ row }) => h('span', { class: 'text-neutral-700' }, row.original.branch?.name || '-') },
    { accessorKey: 'conditionAssigned', header: t('pages.inventory.condition.label'), cell: ({ row }) => {
      const c = row.original.conditionAssigned
      return h(UBadge, { color: c === 'new' ? 'success' : 'warning', variant: 'subtle' }, () => c === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used'))
    } },
    { accessorKey: 'quantityRemaining', header: t('pages.inventory.stockOut.remaining'), cell: ({ row }) => h('span', { class: 'font-semibold text-neutral-900' }, `${row.original.quantityRemaining} / ${row.original.quantity} ${row.original.variant?.unit || ''}`) }
  ]
  if (hasPermission('inventory-stock:return')) {
    cols.push({
      id: 'actions',
      header: '',
      meta: { class: { td: 'text-right', th: 'text-right' } },
      cell: ({ row }: { row: Row<InventoryStockOut> }) => row.original.quantityRemaining > 0
        ? h(UButton, { color: 'neutral', variant: 'outline', size: 'xs', icon: 'i-lucide-undo-2', label: t('pages.inventory.stockOut.return'), onClick: () => openReturn(row.original) })
        : null
    })
  }
  return cols
})

const openReturn = (stockOut: InventoryStockOut) => { selectedStockOut.value = stockOut; showReturnModal.value = true }

onMounted(fetchStockOuts)
</script>
