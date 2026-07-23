<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.inventory.stockOut.assignTitle')"
    :ui="{ content: 'sm:max-w-lg', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField :label="$t('pages.inventory.stockOut.type')" required>
          <URadioGroup v-model="type" :items="typeOptions" orientation="horizontal" />
          <p class="text-xs text-neutral-500 mt-1">{{ $t('pages.inventory.stockOut.typeHint') }}</p>
        </UFormField>

        <UFormField v-if="type === 'employee'" :label="$t('common.employee')" required>
          <USelectMenu v-model="employeeId" :items="employeeOptions" value-key="value" searchable :placeholder="$t('pages.inventory.stockOut.selectEmployee')" class="w-full" />
        </UFormField>

        <UFormField :label="$t('common.branch')" required>
          <USelectMenu v-model="branchId" :items="branchOptions" value-key="value" searchable :placeholder="$t('pages.inventory.transfer.selectBranch')" class="w-full" />
        </UFormField>

        <!-- Rows: variant × new/used (capped at available) -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-neutral-700">{{ $t('pages.inventory.variant.title') }}</label>

          <div v-if="isLoading" class="space-y-2">
            <USkeleton v-for="i in 3" :key="i" class="h-9 w-full" />
          </div>
          <div v-else-if="!branchId" class="text-sm text-neutral-400 py-6 text-center border-2 border-dashed border-neutral-200 rounded-lg">
            {{ $t('pages.inventory.transfer.pickFirst') }}
          </div>
          <div v-else-if="rows.length === 0" class="text-sm text-neutral-400 py-6 text-center border-2 border-dashed border-neutral-200 rounded-lg">
            {{ $t('pages.inventory.entry.noVariants') }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[420px] text-sm">
              <thead>
                <tr class="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-200">
                  <th class="py-2 pr-3">{{ $t('pages.inventory.variant.title') }}</th>
                  <th class="py-2 px-2">{{ $t('pages.inventory.condition.new') }}</th>
                  <th class="py-2 px-2">{{ $t('pages.inventory.condition.used') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows" :key="row.variantId" class="border-b border-neutral-100">
                  <td class="py-2 pr-3">
                    <div class="font-medium text-neutral-900">{{ row.name }}</div>
                    <div v-if="row.code" class="text-xs text-neutral-500">{{ row.code }}</div>
                  </td>
                  <td class="py-2 px-2">
                    <div class="flex items-center gap-1.5">
                      <UInput v-model.number="row.assignNew" type="number" :min="0" :max="row.new" size="sm" class="w-20" :disabled="row.new === 0" />
                      <span class="text-xs text-neutral-400">/ {{ row.new }}</span>
                    </div>
                  </td>
                  <td class="py-2 px-2">
                    <div class="flex items-center gap-1.5">
                      <UInput v-model.number="row.assignUsed" type="number" :min="0" :max="row.used" size="sm" class="w-20" :disabled="row.used === 0" />
                      <span class="text-xs text-neutral-400">/ {{ row.used }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <UFormField :label="$t('common.note')">
          <UTextarea v-model="note" class="w-full" :rows="2" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton :label="$t('common.cancel')" color="neutral" variant="outline" :disabled="saving" @click="() => { open = false }" />
      <UButton :label="$t('pages.inventory.stockOut.assign')" color="primary" :loading="saving" :disabled="!canSubmit" @click="submit" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { inventoryStockOutService } from '~/services/inventory-stock-out-service'
import { inventoryStockService } from '~/services/inventory-stock-service'
import { branchService } from '~/services/branch-service'
import { employeeService } from '~/services/employee-service'
import type { StockOutType, InventoryStockAssignItem } from '~/types/inventory'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{ inventoryId: number }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ done: [] }>()

interface Row { variantId: number, name: string, code: string | null, new: number, used: number, assignNew: number, assignUsed: number }

const saving = ref(false)
const isLoading = ref(false)
const employeeOptions = ref<{ label: string, value: number }[]>([])
const branchOptions = ref<{ label: string, value: number }[]>([])
const rows = ref<Row[]>([])

const type = ref<StockOutType>('employee')
const employeeId = ref<number | undefined>(undefined)
const branchId = ref<number | undefined>(undefined)
const note = ref('')

const typeOptions = computed(() => [
  { label: t('pages.inventory.stockOut.typeEmployee'), value: 'employee' },
  { label: t('pages.inventory.stockOut.typeOther'), value: 'other' }
])

const hasQty = computed(() => rows.value.some(r => (Number(r.assignNew) || 0) > 0 || (Number(r.assignUsed) || 0) > 0))
const canSubmit = computed(() => {
  if (!branchId.value || !hasQty.value) return false
  if (type.value === 'employee' && !employeeId.value) return false
  return true
})

// Zod: quantities must be positive integers not exceeding what's available.
const schema = z.object({
  type: z.enum(['employee', 'other']),
  employeeId: z.number().optional(),
  branchId: z.number({ message: t('pages.inventory.transfer.selectBranch') }),
  items: z.array(z.object({
    variantId: z.number(),
    name: z.string(),
    condition: z.enum(['new', 'used']),
    quantity: z.number().int().min(1),
    available: z.number()
  })).min(1)
}).superRefine((d, ctx) => {
  if (d.type === 'employee' && !d.employeeId) {
    ctx.addIssue({ code: 'custom', message: t('pages.inventory.stockOut.selectEmployee'), path: ['employeeId'] })
  }
  d.items.forEach((it, idx) => {
    if (it.quantity > it.available) {
      ctx.addIssue({ code: 'custom', message: t('pages.inventory.transfer.exceedAvailable', { name: it.name }), path: ['items', idx, 'quantity'] })
    }
  })
})

const loadRows = async () => {
  if (!branchId.value) { rows.value = []; return }
  isLoading.value = true
  try {
    const res = await inventoryStockService.getEntryTemplate(branchId.value, props.inventoryId)
    rows.value = (res.success && res.data ? res.data : []).map(r => ({ variantId: r.variantId, name: r.name, code: r.code, new: r.new, used: r.used, assignNew: 0, assignUsed: 0 }))
  } finally {
    isLoading.value = false
  }
}

watch(branchId, loadRows)

const load = async () => {
  const [b, e] = await Promise.all([
    branchService.getList(),
    employeeService.getList(true)
  ])
  if (b.success && b.data) branchOptions.value = b.data.map(x => ({ label: x.name, value: x.id }))
  if (e.success && e.data) employeeOptions.value = e.data.map(x => ({ label: `${x.name} (${x.employeeId})`, value: x.id }))
}

const submit = async () => {
  if (!branchId.value) return

  const items: InventoryStockAssignItem[] = []
  const validationItems: { variantId: number, name: string, condition: 'new' | 'used', quantity: number, available: number }[] = []
  for (const r of rows.value) {
    const n = Number(r.assignNew) || 0
    const u = Number(r.assignUsed) || 0
    if (n > 0) {
      items.push({ variantId: r.variantId, branchId: branchId.value, condition: 'new', quantity: n })
      validationItems.push({ variantId: r.variantId, name: r.name, condition: 'new', quantity: n, available: r.new })
    }
    if (u > 0) {
      items.push({ variantId: r.variantId, branchId: branchId.value, condition: 'used', quantity: u })
      validationItems.push({ variantId: r.variantId, name: r.name, condition: 'used', quantity: u, available: r.used })
    }
  }

  const parsed = schema.safeParse({ type: type.value, employeeId: employeeId.value, branchId: branchId.value, items: validationItems })
  if (!parsed.success) {
    toast.add({ title: parsed.error.issues[0]?.message || t('common.validationError'), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }

  saving.value = true
  try {
    const res = await inventoryStockOutService.assign({
      type: type.value,
      employeeId: type.value === 'employee' ? employeeId.value : null,
      note: note.value || null,
      items
    })
    if (res.success) {
      toast.add({ title: t('pages.inventory.stockOut.assignSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
      emit('done')
      open.value = false
    } else {
      toast.add({ title: res.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    saving.value = false
  }
}

watch(open, async (val) => {
  if (val) {
    type.value = 'employee'
    employeeId.value = undefined
    branchId.value = undefined
    note.value = ''
    rows.value = []
    await load()
  }
})
</script>
