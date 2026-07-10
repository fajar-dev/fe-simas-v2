<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.inventory.holder.assignTitle')"
    :ui="{ content: 'sm:max-w-md', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <UForm id="stock-assign-form" :schema="schema" :state="state" class="space-y-4 w-full" @submit="onSubmit">
        <UFormField :label="$t('common.employee')" name="employeeId" required>
          <USelectMenu v-model="state.employeeId" :items="employeeOptions" value-key="value" searchable :placeholder="$t('pages.inventory.holder.selectEmployee')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('pages.inventory.variant.title')" name="variantId" required>
          <USelectMenu v-model="state.variantId" :items="variantOptions" value-key="value" :placeholder="$t('pages.inventory.holder.selectVariant')" class="w-full" />
        </UFormField>
        <div class="grid grid-cols-2 gap-3">
          <UFormField :label="$t('common.branch')" name="branchId" required>
            <USelectMenu v-model="state.branchId" :items="branchOptions" value-key="value" :placeholder="$t('pages.inventory.transfer.selectBranch')" class="w-full" />
          </UFormField>
          <UFormField :label="$t('pages.inventory.condition.label')" name="condition" required>
            <USelect v-model="state.condition" :items="conditionOptions" value-key="value" class="w-full" />
          </UFormField>
        </div>
        <UFormField :label="$t('pages.inventory.holder.quantity')" name="quantity" required>
          <UInput v-model.number="state.quantity" type="number" :min="1" class="w-full" />
        </UFormField>
        <UFormField :label="$t('common.note')" name="note">
          <UTextarea v-model="state.note" class="w-full" :rows="2" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton :label="$t('common.cancel')" color="neutral" variant="outline" :disabled="saving" @click="() => { open = false }" />
      <UButton :label="$t('pages.inventory.holder.assign')" color="primary" type="submit" form="stock-assign-form" :loading="saving" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { inventoryStockService } from '~/services/inventory-stock-service'
import { inventoryVariantService } from '~/services/inventory-variant-service'
import { branchService } from '~/services/branch-service'
import { employeeService } from '~/services/employee-service'
import type { StockCondition } from '~/types/inventory'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{ productId: number }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ done: [] }>()

const saving = ref(false)
const employeeOptions = ref<{ label: string, value: number }[]>([])
const variantOptions = ref<{ label: string, value: number }[]>([])
const branchOptions = ref<{ label: string, value: number }[]>([])
const conditionOptions = computed(() => [
  { label: t('pages.inventory.condition.new'), value: 'new' },
  { label: t('pages.inventory.condition.used'), value: 'used' }
])

const schema = z.object({
  employeeId: z.number({ message: t('pages.inventory.holder.selectEmployee') }),
  variantId: z.number({ message: t('pages.inventory.holder.selectVariant') }),
  branchId: z.number({ message: t('pages.inventory.transfer.selectBranch') }),
  condition: z.enum(['new', 'used']),
  quantity: z.number().int().min(1)
})

const state = reactive<{ employeeId?: number, variantId?: number, branchId?: number, condition: StockCondition, quantity: number, note: string }>({
  employeeId: undefined, variantId: undefined, branchId: undefined, condition: 'new', quantity: 1, note: ''
})

const load = async () => {
  const [v, b, e] = await Promise.all([
    inventoryVariantService.getByProduct(props.productId),
    branchService.getList(),
    employeeService.getList(true)
  ])
  if (v.success && v.data) variantOptions.value = v.data.map(x => ({ label: `${x.name}${x.code ? ` (${x.code})` : ''}`, value: x.id }))
  if (b.success && b.data) branchOptions.value = b.data.map(x => ({ label: x.name, value: x.id }))
  if (e.success && e.data) employeeOptions.value = e.data.map(x => ({ label: `${x.name} (${x.employeeId})`, value: x.id }))
}

const onSubmit = async () => {
  if (!state.employeeId || !state.variantId || !state.branchId) return
  saving.value = true
  try {
    const res = await inventoryStockService.assign({
      employeeId: state.employeeId,
      note: state.note || null,
      items: [{ variantId: state.variantId, branchId: state.branchId, condition: state.condition, quantity: Number(state.quantity) }]
    })
    if (res.success) {
      toast.add({ title: t('pages.inventory.holder.assignSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
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
  if (val) {
    state.employeeId = undefined; state.variantId = undefined; state.branchId = undefined
    state.condition = 'new'; state.quantity = 1; state.note = ''
    load()
  }
})
</script>
