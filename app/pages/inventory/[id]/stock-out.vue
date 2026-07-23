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
      <template #filters>
        <USwitch v-model="activeOnly" :label="$t('pages.inventory.stockOut.activeOnly')" @update:model-value="fetchStockOuts" />
      </template>
      <template #actions>
        <UButton v-if="hasPermission('inventory-stock:assign')" color="primary" icon="i-lucide-package-minus" @click="openAssign">
          {{ $t('pages.inventory.stockOut.assign') }}
        </UButton>
      </template>

      <template #expanded="{ row }">
        <UTable
          :data="row.original.items || []"
          :columns="buildItemColumns(row.original)"
          :ui="{ th: 'bg-neutral-50 py-2', td: 'py-2' }"
          class="border border-neutral-200 rounded-md"
        />
      </template>
    </DataTable>

    <AssignModal v-model="showAssignModal" :inventory-id="inventoryId" @done="fetchStockOuts" />
    <ReturnModal v-model="showReturnModal" :employee="selectedEmployee" :item="selectedItem" @done="fetchStockOuts" />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { inventoryStockOutService } from '~/services/inventory-stock-out-service'
import AssignModal from '~/components/inventory-stock-out/AssignModal.vue'
import ReturnModal from '~/components/inventory-stock-out/ReturnModal.vue'
import type { InventoryStockOut, InventoryStockOutLineItem } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const { hasPermission } = useAuth()
const route = useRoute()
const inventoryId = Number(route.params.id)

const UIcon = resolveComponent('UIcon')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const data = ref<InventoryStockOut[]>([])
const isLoading = ref(false)
const activeOnly = ref(true)
const meta = reactive({ total: 0, from: 0, to: 0 })

const page = ref(1)
const perPage = ref(10)
const expanded = ref<Record<string, boolean>>({})

const showAssignModal = ref(false)
const showReturnModal = ref(false)
const selectedEmployee = ref<InventoryStockOut['employee']>(null)
const selectedItem = ref<InventoryStockOutLineItem | null>(null)

watch([page, perPage], () => fetchStockOuts())

const fetchStockOuts = async () => {
  isLoading.value = true
  try {
    const res = await inventoryStockOutService.getAll(page.value, perPage.value, { inventoryId, active: activeOnly.value || undefined })
    if (res.success && res.data) {
      data.value = res.data
      expanded.value = {}
      if (res.meta) { meta.total = res.meta.total; meta.from = res.meta.from; meta.to = res.meta.to }
    }
  } finally {
    isLoading.value = false
  }
}

const openAssign = () => { showAssignModal.value = true }

const openReturn = (stockOut: InventoryStockOut, item: InventoryStockOutLineItem) => {
  selectedEmployee.value = stockOut.employee
  selectedItem.value = item
  showReturnModal.value = true
}

// Columns for the nested per-document item table shown in the expanded row.
// `forDoc` carries the parent document so a per-item Return action knows the employee.
const buildItemColumns = (doc: InventoryStockOut): TableColumn<InventoryStockOutLineItem>[] => {
  const cols: TableColumn<InventoryStockOutLineItem>[] = [
    { id: 'variant', header: t('pages.inventory.variant.title'), cell: ({ row }) => h('span', { class: 'text-neutral-900 text-sm' }, row.original.variant?.name || '-') },
    { id: 'branch', header: t('common.branch'), cell: ({ row }) => h('span', { class: 'text-neutral-700 text-sm' }, row.original.branch?.name || '-') },
    { id: 'condition', header: t('pages.inventory.condition.label'), cell: ({ row }) => {
      const c = row.original.conditionAssigned
      return h(UBadge, { color: c === 'new' ? 'success' : 'warning', variant: 'subtle' }, () => c === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used'))
    } },
    { id: 'remaining', header: t('pages.inventory.stockOut.remaining'), cell: ({ row }) => h('span', { class: 'font-semibold text-neutral-900 text-sm' }, `${row.original.quantityRemaining} / ${row.original.quantity} ${row.original.variant?.unit || ''}`) },
  ]
  if (hasPermission('inventory-stock:return')) {
    cols.push({
      id: 'actions',
      header: '',
      meta: { class: { td: 'text-right', th: 'text-right' } },
      cell: ({ row }) => row.original.quantityRemaining > 0
        ? h(UButton, { color: 'neutral', variant: 'outline', size: 'xs', icon: 'i-lucide-undo-2', label: t('pages.inventory.stockOut.return'), onClick: () => openReturn(doc, row.original) })
        : null
    })
  }
  return cols
}

const columns = computed<TableColumn<InventoryStockOut>[]>(() => {
  const cols: TableColumn<InventoryStockOut>[] = [
    { id: 'expand', header: '', meta: { class: { td: 'w-8', th: 'w-8' } }, cell: ({ row }) => {
      const items = row.original.items || []
      if (items.length === 0) return null
      return h('button', {
        type: 'button',
        class: 'flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer',
        onClick: () => row.toggleExpanded()
      }, [
        h(UIcon, { name: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right', class: 'w-4 h-4' })
      ])
    } },
    { accessorKey: 'assignedDate', header: t('common.date'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, new Date(row.original.assignedDate).toLocaleString()) },
    { accessorKey: 'type', header: t('pages.inventory.stockOut.type'), cell: ({ row }) => {
      const isEmployee = row.original.type === 'employee'
      return h(UBadge, { color: isEmployee ? 'info' : 'neutral', variant: 'subtle' }, () => isEmployee ? t('pages.inventory.stockOut.typeEmployee') : t('pages.inventory.stockOut.typeOther'))
    } },
    { accessorKey: 'employee', header: t('common.employee'), cell: ({ row }) => row.original.employee
      ? h('div', {}, [
          h('span', { class: 'font-medium text-neutral-900 block text-sm' }, row.original.employee.name),
          h('span', { class: 'text-xs text-neutral-500' }, row.original.employee.employeeId)
        ])
      : h('span', { class: 'text-neutral-400 text-sm' }, '-') },
    { accessorKey: 'assignNote', header: t('common.note'), cell: ({ row }) => h('span', { class: 'text-neutral-600 text-sm' }, row.original.assignNote || '-') },
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
    } },
  ]
  return cols
})

onMounted(fetchStockOuts)
</script>
