<template>
  <UCard class="w-full">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UFormField :label="$t('pages.inventory.transfer.fromBranch')" required>
        <USelectMenu v-model="fromBranchId" :items="branchOptions" value-key="value" :placeholder="$t('pages.inventory.transfer.selectBranch')" class="w-full" />
      </UFormField>
      <UFormField :label="$t('pages.inventory.transfer.toBranch')" required>
        <USelectMenu v-model="toBranchId" :items="branchOptions" value-key="value" :placeholder="$t('pages.inventory.transfer.selectBranch')" class="w-full" />
      </UFormField>
    </div>

    <UAlert v-if="sameBranch" color="error" variant="soft" icon="i-lucide-triangle-alert" :title="$t('pages.inventory.transfer.sameBranch')" class="mt-4" />

    <div class="mt-6">
      <div v-if="isLoading" class="space-y-2">
        <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
      </div>
      <div v-else-if="!fromBranchId" class="text-center text-sm text-neutral-400 py-10 border-2 border-dashed border-neutral-200 rounded-lg">
        {{ $t('pages.inventory.transfer.selectBranch') }}
      </div>
      <div v-else-if="rows.length === 0" class="text-center text-sm text-neutral-400 py-10 border-2 border-dashed border-neutral-200 rounded-lg">
        {{ $t('pages.inventory.entry.noVariants') }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-sm">
          <thead>
            <tr class="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-200">
              <th class="py-2 pr-3">{{ $t('pages.inventory.variant.title') }}</th>
              <th class="py-2 px-3">{{ $t('pages.inventory.condition.new') }} ({{ $t('pages.inventory.transfer.available') }})</th>
              <th class="py-2 px-3">{{ $t('pages.inventory.condition.used') }} ({{ $t('pages.inventory.transfer.available') }})</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.variantId" class="border-b border-neutral-100">
              <td class="py-2 pr-3">
                <div class="font-medium text-neutral-900">{{ row.name }}</div>
                <div class="text-xs text-neutral-500">{{ row.unit }}</div>
              </td>
              <td class="py-2 px-3">
                <div class="flex items-center gap-2">
                  <UInput v-model.number="row.transferNew" type="number" :min="0" :max="row.new" class="w-24" :disabled="row.new === 0" />
                  <span class="text-xs text-neutral-400">/ {{ row.new }}</span>
                </div>
              </td>
              <td class="py-2 px-3">
                <div class="flex items-center gap-2">
                  <UInput v-model.number="row.transferUsed" type="number" :min="0" :max="row.used" class="w-24" :disabled="row.used === 0" />
                  <span class="text-xs text-neutral-400">/ {{ row.used }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3 w-full">
        <UInput v-model="note" :placeholder="$t('pages.inventory.transfer.notePlaceholder')" class="flex-1 max-w-md" />
        <UButton :label="$t('pages.inventory.transfer.submit')" color="primary" icon="i-lucide-arrow-left-right" :loading="saving" :disabled="!canSubmit" @click="submit" />
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { inventoryStockService } from '~/services/inventory-stock-service'
import { branchService } from '~/services/branch-service'
import type { InventoryStockTransferItem } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const inventoryId = Number(route.params.id)

interface Row { variantId: number, name: string, unit: string, new: number, used: number, transferNew: number, transferUsed: number }

const branchOptions = ref<{ label: string, value: number }[]>([])
const fromBranchId = ref<number | undefined>(undefined)
const toBranchId = ref<number | undefined>(undefined)
const note = ref('')
const rows = ref<Row[]>([])
const isLoading = ref(false)
const saving = ref(false)

const sameBranch = computed(() => !!fromBranchId.value && fromBranchId.value === toBranchId.value)
const hasQty = computed(() => rows.value.some(r => (Number(r.transferNew) || 0) > 0 || (Number(r.transferUsed) || 0) > 0))
const canSubmit = computed(() => !!fromBranchId.value && !!toBranchId.value && !sameBranch.value && hasQty.value)

const loadRows = async () => {
  if (!fromBranchId.value) { rows.value = []; return }
  isLoading.value = true
  try {
    const res = await inventoryStockService.getEntryTemplate(fromBranchId.value, inventoryId)
    rows.value = (res.success && res.data ? res.data : []).map(r => ({ variantId: r.variantId, name: r.name, unit: r.unit, new: r.new, used: r.used, transferNew: 0, transferUsed: 0 }))
  } finally {
    isLoading.value = false
  }
}

watch(fromBranchId, loadRows)

const submit = async () => {
  if (!fromBranchId.value || !toBranchId.value) return
  const items: InventoryStockTransferItem[] = []
  for (const r of rows.value) {
    const n = Number(r.transferNew) || 0
    const u = Number(r.transferUsed) || 0
    if (n > r.new || u > r.used) {
      toast.add({ title: t('pages.inventory.transfer.exceedAvailable', { name: r.name }), color: 'error', icon: 'i-lucide-circle-alert' })
      return
    }
    if (n > 0) items.push({ variantId: r.variantId, condition: 'new', quantity: n })
    if (u > 0) items.push({ variantId: r.variantId, condition: 'used', quantity: u })
  }
  saving.value = true
  try {
    const res = await inventoryStockService.transfer({ fromBranchId: fromBranchId.value, toBranchId: toBranchId.value, note: note.value || null, items })
    if (res.success) {
      toast.add({ title: t('pages.inventory.transfer.success'), color: 'success', icon: 'i-lucide-circle-check' })
      note.value = ''
      await loadRows()
    } else {
      toast.add({ title: res.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const b = await branchService.getList()
  if (b.success && b.data) {
    branchOptions.value = b.data.map(x => ({ label: x.name, value: x.id }))
    if (b.data.length > 0) fromBranchId.value = b.data[0]!.id
  }
})
</script>
