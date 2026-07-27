<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.handover.stock.addItem')"
    :ui="{ content: 'sm:max-w-lg', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-3">
        <!-- Assign: pick a source branch, then which inventory item's variants to load below -->
        <template v-if="transactionType === 'assign'">
          <UFormField :label="$t('common.branch')">
            <USelectMenu
              v-model="draft.branchId"
              :items="branchOptions"
              value-key="value"
              searchable
              :placeholder="$t('pages.inventory.transfer.selectBranch')"
              class="w-full"
              @update:model-value="onBranchChange"
            />
          </UFormField>

          <UFormField :label="$t('pages.inventory.item.title')">
            <USelectMenu
              v-model="draft.inventoryId"
              :items="inventoryOptions"
              value-key="value"
              searchable
              :placeholder="$t('pages.inventory.entry.selectInventory')"
              class="w-full"
              @update:model-value="onInventoryChange"
            />
          </UFormField>
        </template>

        <!-- Return: no branch/inventory picker — stock always returns to the branch it was taken from -->
        <UAlert
          v-else
          color="neutral"
          variant="soft"
          icon="i-lucide-info"
          :description="$t('pages.handover.stock.returnsToOriginBranch')"
        />

        <!-- Rows: variant × new/used (assign) or variant × quantity (return), capped at available -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-neutral-700">{{ $t('pages.inventory.variant.title') }}</label>

          <div
            v-if="isLoadingTable"
            class="space-y-2"
          >
            <USkeleton
              v-for="i in 3"
              :key="i"
              class="h-9 w-full"
            />
          </div>
          <div
            v-else-if="transactionType === 'assign' && !draft.inventoryId"
            class="text-sm text-neutral-400 py-6 text-center border-2 border-dashed border-neutral-200 rounded-lg"
          >
            {{ $t('pages.inventory.transfer.pickFirst') }}
          </div>
          <div
            v-else-if="transactionType === 'return' && !employeeId"
            class="text-sm text-neutral-400 py-6 text-center border-2 border-dashed border-neutral-200 rounded-lg"
          >
            {{ $t('pages.handover.scan.selectHandedOverFirst') }}
          </div>
          <div
            v-else-if="tableRows.length === 0"
            class="text-sm text-neutral-400 py-6 text-center border-2 border-dashed border-neutral-200 rounded-lg"
          >
            {{ transactionType === 'return' ? $t('pages.handover.stock.noHeldItems') : $t('pages.inventory.entry.noVariants') }}
          </div>
          <div
            v-else
            class="overflow-x-auto"
          >
            <table class="w-full min-w-[420px] text-sm">
              <thead>
                <tr class="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-200">
                  <th class="py-2 pr-3">
                    {{ $t('pages.inventory.variant.title') }}
                  </th>
                  <template v-if="transactionType === 'assign'">
                    <th class="py-2 px-2">
                      {{ $t('pages.inventory.condition.new') }}
                    </th>
                    <th class="py-2 px-2">
                      {{ $t('pages.inventory.condition.used') }}
                    </th>
                  </template>
                  <template v-else>
                    <th class="py-2 px-2">
                      {{ $t('common.branch') }}
                    </th>
                    <th class="py-2 px-2">
                      {{ $t('pages.inventory.stockOut.quantity') }}
                    </th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in tableRows"
                  :key="`${row.variantId}-${row.branchId ?? ''}`"
                  class="border-b border-neutral-100"
                >
                  <td class="py-2 pr-3">
                    <div class="font-medium text-neutral-900">
                      {{ row.name }}
                    </div>
                    <div
                      v-if="row.code"
                      class="text-xs text-neutral-500"
                    >
                      {{ row.code }}
                    </div>
                  </td>
                  <td
                    v-if="transactionType === 'return'"
                    class="py-2 px-2 text-neutral-600"
                  >
                    {{ row.branchName }}
                  </td>
                  <template v-if="transactionType === 'assign'">
                    <td class="py-2 px-2">
                      <div class="flex items-center gap-1.5">
                        <UInput
                          v-model.number="row.qtyNew"
                          type="number"
                          :min="0"
                          :max="row.availableNew"
                          size="sm"
                          class="w-20"
                          :disabled="row.availableNew === 0"
                        />
                        <span class="text-xs text-neutral-400">/ {{ row.availableNew }}</span>
                      </div>
                    </td>
                    <td class="py-2 px-2">
                      <div class="flex items-center gap-1.5">
                        <UInput
                          v-model.number="row.qtyUsed"
                          type="number"
                          :min="0"
                          :max="row.availableUsed"
                          size="sm"
                          class="w-20"
                          :disabled="row.availableUsed === 0"
                        />
                        <span class="text-xs text-neutral-400">/ {{ row.availableUsed }}</span>
                      </div>
                    </td>
                  </template>
                  <td
                    v-else
                    class="py-2 px-2"
                  >
                    <div class="flex items-center gap-1.5">
                      <UInput
                        v-model.number="row.qty"
                        type="number"
                        :min="0"
                        :max="row.availableQty"
                        size="sm"
                        class="w-20"
                        :disabled="row.availableQty === 0"
                      />
                      <span class="text-xs text-neutral-400">/ {{ row.availableQty }} {{ row.unit }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        :label="$t('common.close')"
        color="neutral"
        variant="outline"
        @click="() => { open = false }"
      />
      <UButton
        :label="$t('pages.handover.stock.addItem')"
        color="primary"
        icon="i-lucide-plus"
        :disabled="!canAdd"
        @click="addRows"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { inventoryService } from '~/services/inventory-service'
import { inventoryStockService } from '~/services/inventory-stock-service'
import { inventoryStockOutService } from '~/services/inventory-stock-out-service'
import { branchService } from '~/services/branch-service'
import type { StockCondition, InventoryStockEntryRow } from '~/types/inventory'

const { t } = useI18n()
const toast = useToast()

export interface HandoverStockRow {
  variantId: number
  branchId: number
  condition: StockCondition
  quantity: number
  inventoryName: string
  variantName: string
  branchName: string
  note: string
}

interface TableRow {
  variantId: number
  name: string
  code: string | null
  unit: string
  availableNew: number
  availableUsed: number
  availableQty: number
  qtyNew: number
  qtyUsed: number
  qty: number
  // Return only — the branch this stock was originally taken from; it always returns there.
  branchId?: number
  branchName?: string
}

const props = defineProps<{ transactionType: 'assign' | 'return', employeeId?: number | null }>()
const rows = defineModel<HandoverStockRow[]>('rows', { default: () => [] })
const open = defineModel<boolean>('open', { default: false })

const inventoryOptions = ref<{ label: string, value: number }[]>([])
const branchOptions = ref<{ label: string, value: number }[]>([])

const draft = reactive<{ inventoryId?: number, branchId?: number }>({ inventoryId: undefined, branchId: undefined })

const tableRows = ref<TableRow[]>([])
const isLoadingTable = ref(false)

// ── Assign: available New/Used at the selected branch, for the selected inventory's variants ──
const entryTemplate = ref<Map<number, InventoryStockEntryRow>>(new Map())

const onInventoryChange = async () => {
  await loadEntryTemplate()
}

const onBranchChange = async () => {
  if (props.transactionType === 'assign') await loadEntryTemplate()
}

const loadEntryTemplate = async () => {
  entryTemplate.value = new Map()
  if (!draft.inventoryId || !draft.branchId) {
    tableRows.value = []
    return
  }
  isLoadingTable.value = true
  try {
    const res = await inventoryStockService.getEntryTemplate(draft.branchId, draft.inventoryId)
    if (res.success && res.data) entryTemplate.value = new Map(res.data.map(r => [r.variantId, r]))
    buildAssignRows()
  } finally {
    isLoadingTable.value = false
  }
}

const buildAssignRows = () => {
  tableRows.value = Array.from(entryTemplate.value.values()).map(r => ({
    variantId: r.variantId,
    name: r.name,
    code: r.code,
    unit: r.unit,
    availableNew: r.new,
    availableUsed: r.used,
    availableQty: 0,
    qtyNew: 0,
    qtyUsed: 0,
    qty: 0
  }))
  refreshAvailability()
}

// ── Return: what the handing-over employee currently holds, per variant × origin branch ──
// Stock always returns to the branch it was originally taken from, so held
// amounts are grouped by (variant, branch) rather than by variant alone.
interface HeldEntry { variantId: number, branchId: number, branchName: string, inventoryName: string, variantName: string, unit: string, remaining: number }
const heldKey = (variantId: number, branchId: number) => `${variantId}-${branchId}`
const heldByVariantBranch = ref<Map<string, HeldEntry>>(new Map())

const loadHeldSummary = async () => {
  heldByVariantBranch.value = new Map()
  if (!props.employeeId || props.transactionType !== 'return') {
    tableRows.value = []
    return
  }
  isLoadingTable.value = true
  try {
    const res = await inventoryStockOutService.getAll(1, 200, { employeeId: props.employeeId, active: true })
    if (res.success && res.data) {
      const map = new Map<string, HeldEntry>()
      for (const doc of res.data) {
        for (const item of doc.items || []) {
          if (!item.variant || !item.branch || item.quantityRemaining <= 0) continue
          const key = heldKey(item.variant.id, item.branch.id)
          const existing = map.get(key)
          if (existing) {
            existing.remaining += item.quantityRemaining
          } else {
            map.set(key, {
              variantId: item.variant.id,
              branchId: item.branch.id,
              branchName: item.branch.name,
              inventoryName: item.variant.inventory?.name || '-',
              variantName: item.variant.name,
              unit: item.variant.unit || '',
              remaining: item.quantityRemaining
            })
          }
        }
      }
      heldByVariantBranch.value = map
    }
    buildReturnRows()
  } finally {
    isLoadingTable.value = false
  }
}

const buildReturnRows = () => {
  tableRows.value = Array.from(heldByVariantBranch.value.values()).map(h => ({
    variantId: h.variantId,
    name: `${h.inventoryName} — ${h.variantName}`,
    code: null,
    unit: h.unit,
    availableNew: 0,
    availableUsed: 0,
    availableQty: h.remaining,
    qtyNew: 0,
    qtyUsed: 0,
    qty: 0,
    branchId: h.branchId,
    branchName: h.branchName
  }))
  refreshAvailability()
}

watch(() => [props.employeeId, props.transactionType], loadHeldSummary)

// Recompute each row's cap by subtracting what's already in `rows`, so re-adding
// the same variant across multiple "Add" actions can't exceed what's actually
// available/held. Also clamps any already-entered qty down to the new cap.
const refreshAvailability = () => {
  for (const row of tableRows.value) {
    if (props.transactionType === 'return') {
      const held = heldByVariantBranch.value.get(heldKey(row.variantId, row.branchId!))?.remaining ?? 0
      const alreadyAdded = rows.value.filter(r => r.variantId === row.variantId && r.branchId === row.branchId).reduce((sum, r) => sum + r.quantity, 0)
      row.availableQty = Math.max(0, held - alreadyAdded)
      if (row.qty > row.availableQty) row.qty = row.availableQty
    } else {
      const tmpl = entryTemplate.value.get(row.variantId)
      const addedNew = rows.value.filter(r => r.variantId === row.variantId && r.branchId === draft.branchId && r.condition === 'new').reduce((sum, r) => sum + r.quantity, 0)
      const addedUsed = rows.value.filter(r => r.variantId === row.variantId && r.branchId === draft.branchId && r.condition === 'used').reduce((sum, r) => sum + r.quantity, 0)
      row.availableNew = Math.max(0, (tmpl?.new ?? 0) - addedNew)
      row.availableUsed = Math.max(0, (tmpl?.used ?? 0) - addedUsed)
      if (row.qtyNew > row.availableNew) row.qtyNew = row.availableNew
      if (row.qtyUsed > row.availableUsed) row.qtyUsed = row.availableUsed
    }
  }
}

const canAdd = computed(() => {
  if (props.transactionType === 'return') {
    return tableRows.value.some(r => Number(r.qty) > 0)
  }
  if (!draft.branchId) return false
  return tableRows.value.some(r => Number(r.qtyNew) > 0 || Number(r.qtyUsed) > 0)
})

const resetForm = () => {
  draft.inventoryId = undefined
  draft.branchId = undefined
  tableRows.value = []
  // Return mode has no branch/inventory pickers to repopulate the table — its
  // rows come straight from what the employee holds, so reload them here
  // instead of leaving the table blank (this also picks up anything assigned
  // since the employee was selected).
  if (props.transactionType === 'return') loadHeldSummary()
}

const addRows = () => {
  if (props.transactionType === 'assign' && !draft.branchId) return

  const added: HandoverStockRow[] = []

  // Validate every row against its cap before adding anything — the `:max` on
  // the input is only a soft UI hint (typing can still exceed it), so this is
  // the actual enforcement point.
  for (const row of tableRows.value) {
    if (props.transactionType === 'return') {
      const qty = Number(row.qty) || 0
      if (qty > row.availableQty) {
        toast.add({ title: t('pages.inventory.transfer.exceedAvailable', { name: row.name }), color: 'error', icon: 'i-lucide-circle-alert' })
        return
      }
    } else {
      const newQty = Number(row.qtyNew) || 0
      const usedQty = Number(row.qtyUsed) || 0
      if (newQty > row.availableNew || usedQty > row.availableUsed) {
        toast.add({ title: t('pages.inventory.transfer.exceedAvailable', { name: row.name }), color: 'error', icon: 'i-lucide-circle-alert' })
        return
      }
    }
  }

  if (props.transactionType === 'return') {
    for (const row of tableRows.value) {
      const qty = Number(row.qty) || 0
      if (qty <= 0) continue
      const held = heldByVariantBranch.value.get(heldKey(row.variantId, row.branchId!))
      added.push({
        variantId: row.variantId,
        branchId: row.branchId!,
        condition: 'used',
        quantity: qty,
        inventoryName: held?.inventoryName || '-',
        variantName: held?.variantName || '-',
        branchName: row.branchName || '-',
        note: ''
      })
    }
  } else {
    const branchName = branchOptions.value.find(b => b.value === draft.branchId)?.label || '-'
    const inventoryName = inventoryOptions.value.find(p => p.value === draft.inventoryId)?.label || '-'
    for (const row of tableRows.value) {
      const newQty = Number(row.qtyNew) || 0
      const usedQty = Number(row.qtyUsed) || 0
      if (newQty > 0) {
        added.push({ variantId: row.variantId, branchId: draft.branchId!, condition: 'new', quantity: newQty, inventoryName, variantName: row.name, branchName, note: '' })
      }
      if (usedQty > 0) {
        added.push({ variantId: row.variantId, branchId: draft.branchId!, condition: 'used', quantity: usedQty, inventoryName, variantName: row.name, branchName, note: '' })
      }
    }
  }

  if (added.length === 0) return
  rows.value = [...rows.value, ...added]
  open.value = false
}

watch(open, (val) => {
  if (val) resetForm()
})

onMounted(async () => {
  const [p, b] = await Promise.all([inventoryService.getList(), branchService.getList()])
  if (p.success && p.data) inventoryOptions.value = p.data.map(x => ({ label: x.name, value: x.id }))
  if (b.success && b.data) branchOptions.value = b.data.map(x => ({ label: x.name, value: x.id }))
  await loadHeldSummary()
})
</script>
