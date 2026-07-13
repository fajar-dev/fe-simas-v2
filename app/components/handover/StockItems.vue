<template>
  <div class="space-y-4">
    <!-- Add row form -->
    <div class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 space-y-3">
      <UFormField :label="$t('pages.inventory.item.title')">
        <USelectMenu v-model="draft.inventoryId" :items="inventoryOptions" value-key="value" searchable :placeholder="$t('pages.inventory.entry.selectInventory')" class="w-full" @update:model-value="onInventoryChange" />
      </UFormField>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormField :label="$t('pages.inventory.variant.title')">
          <USelectMenu v-model="draft.variantId" :items="variantOptions" value-key="value" :placeholder="$t('pages.inventory.holder.selectVariant')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('common.branch')">
          <USelectMenu v-model="draft.branchId" :items="branchOptions" value-key="value" :placeholder="$t('pages.inventory.transfer.selectBranch')" class="w-full" />
        </UFormField>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormField v-if="transactionType === 'assign'" :label="$t('pages.inventory.condition.label')">
          <USelect v-model="draft.condition" :items="conditionOptions" value-key="value" class="w-full" />
        </UFormField>
        <UFormField :label="$t('pages.inventory.holder.quantity')">
          <UInput v-model.number="draft.quantity" type="number" :min="1" class="w-full" />
        </UFormField>
      </div>
      <UButton type="button" color="primary" variant="soft" icon="i-lucide-plus" size="sm" class="w-full justify-center" :disabled="!canAdd" @click="addRow">
        {{ $t('pages.handover.stock.addItem') }}
      </UButton>
    </div>

    <!-- Added rows -->
    <div v-if="rows.length === 0" class="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-neutral-200 rounded-lg">
      <UIcon name="i-lucide-layers" class="w-9 h-9 text-neutral-300 mb-2" />
      <span class="text-sm text-neutral-500">{{ $t('pages.handover.stock.empty') }}</span>
    </div>
    <div v-else class="space-y-2">
      <div v-for="(row, index) in rows" :key="index" class="flex items-center gap-2 p-3 rounded-lg border border-neutral-100 bg-white">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-neutral-900 truncate">{{ row.inventoryName }} — {{ row.variantName }}</div>
          <div class="text-xs text-neutral-500">
            {{ row.branchName }} ·
            <span v-if="transactionType === 'assign'">{{ row.condition === 'new' ? $t('pages.inventory.condition.new') : $t('pages.inventory.condition.used') }} · </span>
            {{ row.quantity }}
          </div>
        </div>
        <UButton type="button" color="error" variant="soft" icon="i-lucide-trash" size="sm" square @click="removeRow(index)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inventoryService } from '~/services/inventory-service'
import { inventoryVariantService } from '~/services/inventory-variant-service'
import { branchService } from '~/services/branch-service'
import type { StockCondition } from '~/types/inventory'

export interface HandoverStockRow {
  variantId: number
  branchId: number
  condition: StockCondition
  quantity: number
  inventoryName: string
  variantName: string
  branchName: string
}

const { t } = useI18n()
const props = defineProps<{ transactionType: 'assign' | 'return' }>()
const rows = defineModel<HandoverStockRow[]>({ default: () => [] })

const inventoryOptions = ref<{ label: string, value: number }[]>([])
const variantOptions = ref<{ label: string, value: number }[]>([])
const branchOptions = ref<{ label: string, value: number }[]>([])
const conditionOptions = computed(() => [
  { label: t('pages.inventory.condition.new'), value: 'new' },
  { label: t('pages.inventory.condition.used'), value: 'used' }
])

const draft = reactive<{ inventoryId?: number, variantId?: number, branchId?: number, condition: StockCondition, quantity: number }>({
  inventoryId: undefined, variantId: undefined, branchId: undefined, condition: 'new', quantity: 1
})

const canAdd = computed(() => !!draft.variantId && !!draft.branchId && Number(draft.quantity) >= 1)

const onInventoryChange = async () => {
  draft.variantId = undefined
  variantOptions.value = []
  if (!draft.inventoryId) return
  const res = await inventoryVariantService.getByInventory(draft.inventoryId)
  if (res.success && res.data) variantOptions.value = res.data.map(x => ({ label: `${x.name}${x.code ? ` (${x.code})` : ''}`, value: x.id }))
}

const addRow = () => {
  if (!draft.variantId || !draft.branchId) return
  rows.value = [...rows.value, {
    variantId: draft.variantId,
    branchId: draft.branchId,
    condition: props.transactionType === 'return' ? 'used' : draft.condition,
    quantity: Number(draft.quantity),
    inventoryName: inventoryOptions.value.find(p => p.value === draft.inventoryId)?.label || '-',
    variantName: variantOptions.value.find(v => v.value === draft.variantId)?.label || '-',
    branchName: branchOptions.value.find(b => b.value === draft.branchId)?.label || '-'
  }]
  draft.variantId = undefined
  draft.quantity = 1
}

const removeRow = (index: number) => {
  rows.value = rows.value.filter((_, i) => i !== index)
}

onMounted(async () => {
  const [p, b] = await Promise.all([inventoryService.getList(), branchService.getList()])
  if (p.success && p.data) inventoryOptions.value = p.data.map(x => ({ label: x.name, value: x.id }))
  if (b.success && b.data) branchOptions.value = b.data.map(x => ({ label: x.name, value: x.id }))
})
</script>
