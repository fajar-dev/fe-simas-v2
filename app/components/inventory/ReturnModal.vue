<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.inventory.holder.returnTitle')"
    :ui="{ content: 'sm:max-w-md', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <div v-if="holding" class="space-y-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.employee') }}</span>
            <span class="text-neutral-900 font-medium">{{ holding.employee?.name || '-' }}</span>
          </div>
          <div>
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.inventory.variant.title') }}</span>
            <span class="text-neutral-900 font-medium">{{ holding.variant?.name || '-' }}</span>
          </div>
          <div>
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.branch') }}</span>
            <span class="text-neutral-900 font-medium">{{ holding.branch?.name || '-' }}</span>
          </div>
          <div>
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.inventory.holder.remaining') }}</span>
            <span class="text-neutral-900 font-medium">{{ holding.quantityRemaining }} {{ holding.variant?.unit || '' }}</span>
          </div>
        </div>

        <UAlert color="warning" variant="soft" icon="i-lucide-info" :description="$t('pages.inventory.holder.returnHint')" />

        <UForm id="stock-return-form" :schema="schema" :state="state" class="space-y-4 w-full" @submit="onSubmit">
          <UFormField :label="$t('pages.inventory.holder.quantity')" name="quantity" required>
            <UInput v-model.number="state.quantity" type="number" :min="1" :max="holding.quantityRemaining" class="w-full" />
          </UFormField>
          <UFormField :label="$t('common.note')" name="note">
            <UTextarea v-model="state.note" class="w-full" :rows="2" />
          </UFormField>
        </UForm>
      </div>
    </template>

    <template #footer>
      <UButton :label="$t('common.cancel')" color="neutral" variant="outline" :disabled="saving" @click="() => { open = false }" />
      <UButton :label="$t('pages.inventory.holder.return')" color="primary" type="submit" form="stock-return-form" :loading="saving" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { inventoryStockService } from '~/services/inventory-stock-service'
import type { InventoryStockHolding } from '~/types/inventory'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{ holding: InventoryStockHolding | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ done: [] }>()

const saving = ref(false)

const schema = computed(() => z.object({
  quantity: z.number().int().min(1).max(props.holding?.quantityRemaining ?? 1, t('pages.inventory.holder.exceedRemaining')),
  note: z.string().optional().or(z.literal(''))
}))

const state = reactive<{ quantity: number, note: string }>({ quantity: 1, note: '' })

const onSubmit = async () => {
  if (!props.holding?.variant || !props.holding.branch || !props.holding.employee) return
  saving.value = true
  try {
    const res = await inventoryStockService.returnStock({
      employeeId: props.holding.employee.id,
      note: state.note || null,
      items: [{ variantId: props.holding.variant.id, branchId: props.holding.branch.id, quantity: Number(state.quantity) }]
    })
    if (res.success) {
      toast.add({ title: t('pages.inventory.holder.returnSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
      emit('done')
      open.value = false
    } else {
      toast.add({ title: res.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    saving.value = false
  }
}

watch(open, (val) => {
  if (val) { state.quantity = props.holding?.quantityRemaining ?? 1; state.note = '' }
})
</script>
