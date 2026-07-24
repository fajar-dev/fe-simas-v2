<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.inventory.transfer.title')"
    :description="$t('pages.inventory.transfer.description')"
    :ui="{ content: 'sm:max-w-lg', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UFormField :label="$t('pages.inventory.transfer.fromBranch')" required>
            <USelectMenu v-model="fromBranchId" :items="branchOptions" value-key="value" searchable :placeholder="$t('pages.inventory.transfer.selectBranch')" class="w-full" />
          </UFormField>
          <UFormField :label="$t('pages.inventory.transfer.toBranch')" required>
            <USelectMenu v-model="toBranchId" :items="branchOptions" value-key="value" searchable :placeholder="$t('pages.inventory.transfer.selectBranch')" class="w-full" />
          </UFormField>
        </div>

        <UAlert v-if="sameBranch" color="error" variant="soft" icon="i-lucide-triangle-alert" :title="$t('pages.inventory.transfer.sameBranch')" />

        <!-- Rows: variant × new/used (capped at available) -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-neutral-700">{{ $t('pages.inventory.variant.title') }}</label>

          <div v-if="isLoading" class="space-y-2">
            <USkeleton v-for="i in 3" :key="i" class="h-9 w-full" />
          </div>
          <div v-else-if="!fromBranchId" class="text-sm text-neutral-400 py-6 text-center border-2 border-dashed border-neutral-200 rounded-lg">
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
                      <UInput v-model.number="row.transferNew" type="number" :min="0" :max="row.new" size="sm" class="w-20" :disabled="row.new === 0" />
                      <span class="text-xs text-neutral-400">/ {{ row.new }}</span>
                    </div>
                  </td>
                  <td class="py-2 px-2">
                    <div class="flex items-center gap-1.5">
                      <UInput v-model.number="row.transferUsed" type="number" :min="0" :max="row.used" size="sm" class="w-20" :disabled="row.used === 0" />
                      <span class="text-xs text-neutral-400">/ {{ row.used }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Note -->
        <UFormField :label="$t('common.note')">
          <UTextarea v-model="note" :placeholder="$t('pages.inventory.transfer.notePlaceholder')" :rows="2" class="w-full" />
        </UFormField>

        <!-- Attachments -->
        <AttachmentManager v-model="attachments" @change="(ids) => { attachmentIds = ids }" />
      </div>
    </template>

    <template #footer>
      <UButton :label="$t('common.cancel')" color="neutral" variant="outline" :disabled="saving" @click="() => { open = false }" />
      <UButton :label="$t('common.save')" color="primary" :loading="saving" :disabled="!canSubmit" @click="submit" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { inventoryStockService } from '~/services/inventory-stock-service'
import { inventoryStockTransferService } from '~/services/inventory-stock-transfer-service'
import { branchService } from '~/services/branch-service'
import type { Attachment } from '~/types/attachment'
import type { InventoryStockTransferItem } from '~/types/inventory'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{ inventoryId: number }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ done: [] }>()

interface Row { variantId: number, name: string, code: string | null, new: number, used: number, transferNew: number, transferUsed: number }

const branchOptions = ref<{ label: string, value: number }[]>([])
const fromBranchId = ref<number | undefined>(undefined)
const toBranchId = ref<number | undefined>(undefined)
const note = ref('')
const attachments = ref<Attachment[]>([])
const attachmentIds = ref<number[]>([])
const rows = ref<Row[]>([])
const isLoading = ref(false)
const saving = ref(false)

const sameBranch = computed(() => !!fromBranchId.value && fromBranchId.value === toBranchId.value)
const hasQty = computed(() => rows.value.some(r => (Number(r.transferNew) || 0) > 0 || (Number(r.transferUsed) || 0) > 0))
const canSubmit = computed(() => !!fromBranchId.value && !!toBranchId.value && !sameBranch.value && hasQty.value)

// Zod: quantities must be positive integers not exceeding what's available; branches must differ.
const schema = z.object({
  fromBranchId: z.number({ message: t('pages.inventory.transfer.selectBranch') }),
  toBranchId: z.number({ message: t('pages.inventory.transfer.selectBranch') }),
  items: z.array(z.object({
    variantId: z.number(),
    name: z.string(),
    condition: z.enum(['new', 'used']),
    quantity: z.number().int().min(1),
    available: z.number()
  })).min(1)
}).superRefine((d, ctx) => {
  if (d.fromBranchId === d.toBranchId) {
    ctx.addIssue({ code: 'custom', message: t('pages.inventory.transfer.sameBranch'), path: ['toBranchId'] })
  }
  d.items.forEach((it, idx) => {
    if (it.quantity > it.available) {
      ctx.addIssue({ code: 'custom', message: t('pages.inventory.transfer.exceedAvailable', { name: it.name }), path: ['items', idx, 'quantity'] })
    }
  })
})

const loadRows = async () => {
  if (!fromBranchId.value) { rows.value = []; return }
  isLoading.value = true
  try {
    const res = await inventoryStockService.getEntryTemplate(fromBranchId.value, props.inventoryId)
    rows.value = (res.success && res.data ? res.data : []).map(r => ({ variantId: r.variantId, name: r.name, code: r.code, new: r.new, used: r.used, transferNew: 0, transferUsed: 0 }))
  } finally {
    isLoading.value = false
  }
}

watch(fromBranchId, loadRows)

const submit = async () => {
  if (!fromBranchId.value || !toBranchId.value) return

  // Build the items and a parallel validation payload (carries available limits).
  const items: InventoryStockTransferItem[] = []
  const validationItems: { variantId: number, name: string, condition: 'new' | 'used', quantity: number, available: number }[] = []
  for (const r of rows.value) {
    const n = Number(r.transferNew) || 0
    const u = Number(r.transferUsed) || 0
    if (n > 0) {
      items.push({ variantId: r.variantId, condition: 'new', quantity: n })
      validationItems.push({ variantId: r.variantId, name: r.name, condition: 'new', quantity: n, available: r.new })
    }
    if (u > 0) {
      items.push({ variantId: r.variantId, condition: 'used', quantity: u })
      validationItems.push({ variantId: r.variantId, name: r.name, condition: 'used', quantity: u, available: r.used })
    }
  }

  const parsed = schema.safeParse({ fromBranchId: fromBranchId.value, toBranchId: toBranchId.value, items: validationItems })
  if (!parsed.success) {
    toast.add({ title: parsed.error.issues[0]?.message || t('common.validationError'), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }

  saving.value = true
  try {
    const res = await inventoryStockTransferService.create({
      fromBranchId: fromBranchId.value,
      toBranchId: toBranchId.value,
      note: note.value || null,
      attachmentIds: attachmentIds.value,
      items
    })
    if (res.success) {
      toast.add({ title: t('pages.inventory.transfer.success'), color: 'success', icon: 'i-lucide-circle-check' })
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
    note.value = ''
    attachments.value = []
    attachmentIds.value = []
    toBranchId.value = undefined
    rows.value = []
    const b = await branchService.getList()
    if (b.success && b.data) {
      branchOptions.value = b.data.map(x => ({ label: x.name, value: x.id }))
      fromBranchId.value = b.data.length > 0 ? b.data[0]!.id : undefined
    }
    await loadRows()
  }
})
</script>
