<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.inventory.addStock.title')"
    :description="$t('pages.inventory.addStock.description')"
    :ui="{ content: 'sm:max-w-md', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Rows: branch × variant × qty -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-neutral-700">{{ $t('pages.inventory.addStock.items') }}</label>
            <UButton icon="i-lucide-plus" color="primary" variant="soft" size="xs" @click="addRow">{{ $t('pages.inventory.addStock.addRow') }}</UButton>
          </div>

          <div v-if="rows.length === 0" class="text-sm text-neutral-400 py-6 text-center border-2 border-dashed border-neutral-200 rounded-lg">
            {{ $t('pages.inventory.addStock.noRows') }}
          </div>

          <div v-for="(row, i) in rows" :key="i" class="p-3 rounded-lg border border-neutral-200 space-y-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <USelectMenu v-model="row.branchId" :items="branchOptions" value-key="value" searchable :placeholder="$t('pages.inventory.transfer.selectBranch')" size="sm" class="w-full" />
              <div class="flex items-center gap-2">
                <USelectMenu v-model="row.variantId" :items="variantOptions" value-key="value" searchable :placeholder="$t('pages.inventory.holder.selectVariant')" size="sm" class="w-full" />
                <UButton icon="i-lucide-trash" color="error" variant="soft" size="xs" square @click="() => { rows.splice(i, 1) }" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <UFormField :label="$t('pages.inventory.condition.new')" size="xs">
                <UInput v-model.number="row.new" type="number" :min="0" size="sm" class="w-full" />
              </UFormField>
              <UFormField :label="$t('pages.inventory.condition.used')" size="xs">
                <UInput v-model.number="row.used" type="number" :min="0" size="sm" class="w-full" />
              </UFormField>
            </div>
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
      <UButton :label="$t('pages.inventory.addStock.submit')" color="primary" icon="i-lucide-plus" :loading="saving" :disabled="!canSubmit" @click="submit" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { inventoryStockService } from '~/services/inventory-stock-service'
import { inventoryVariantService } from '~/services/inventory-variant-service'
import { branchService } from '~/services/branch-service'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{ inventoryId: number }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ done: [] }>()

interface Row { branchId?: number, variantId?: number, new: number, used: number }

const branchOptions = ref<{ label: string, value: number }[]>([])
const variantOptions = ref<{ label: string, value: number }[]>([])
const rows = ref<Row[]>([])
const note = ref('')
const attachments = ref<Attachment[]>([])
const attachmentIds = ref<number[]>([])
const saving = ref(false)

const defaultBranch = () => (branchOptions.value.length === 1 ? branchOptions.value[0]!.value : undefined)
const addRow = () => { rows.value.push({ branchId: defaultBranch(), variantId: undefined, new: 0, used: 0 }) }

const canSubmit = computed(() => rows.value.some(r => r.branchId && r.variantId && ((Number(r.new) || 0) > 0 || (Number(r.used) || 0) > 0)))

const submit = async () => {
  const items = rows.value
    .filter(r => r.branchId && r.variantId && ((Number(r.new) || 0) > 0 || (Number(r.used) || 0) > 0))
    .map(r => ({ branchId: r.branchId!, variantId: r.variantId!, new: Number(r.new) || 0, used: Number(r.used) || 0 }))
  if (items.length === 0) return
  saving.value = true
  try {
    const res = await inventoryStockService.addStock({ inventoryId: props.inventoryId, note: note.value || null, attachmentIds: attachmentIds.value, items })
    if (res.success) {
      toast.add({ title: t('pages.inventory.addStock.success'), color: 'success', icon: 'i-lucide-circle-check' })
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
    rows.value = []
    const [b, v] = await Promise.all([branchService.getList(), inventoryVariantService.getByInventory(props.inventoryId)])
    if (b.success && b.data) branchOptions.value = b.data.map(x => ({ label: x.name, value: x.id }))
    if (v.success && v.data) variantOptions.value = v.data.map(x => ({ label: `${x.name}${x.code ? ` (${x.code})` : ''}`, value: x.id }))
    addRow()
  }
})
</script>
