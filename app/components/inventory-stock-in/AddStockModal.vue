<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.inventory.addStock.title')"
    :description="$t('pages.inventory.addStock.description')"
    :ui="{ content: 'sm:max-w-lg', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField :label="$t('common.branch')" required>
          <USelectMenu v-model="branchId" :items="branchOptions" value-key="value" searchable :placeholder="$t('pages.inventory.transfer.selectBranch')" class="w-full" />
        </UFormField>

        <!-- Rows: variant × new/used (current on-hand shown for context) -->
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
                      <UInput v-model.number="row.addNew" type="number" :min="0" size="sm" class="w-20" />
                      <span class="text-xs text-neutral-400">{{ $t('pages.inventory.addStock.current') }}: {{ row.new }}</span>
                    </div>
                  </td>
                  <td class="py-2 px-2">
                    <div class="flex items-center gap-1.5">
                      <UInput v-model.number="row.addUsed" type="number" :min="0" size="sm" class="w-20" />
                      <span class="text-xs text-neutral-400">{{ $t('pages.inventory.addStock.current') }}: {{ row.used }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <UFormField :label="$t('common.note')">
          <UTextarea v-model="note" :placeholder="$t('pages.inventory.transfer.notePlaceholder')" :rows="2" class="w-full" />
        </UFormField>

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
import { inventoryStockInService } from '~/services/inventory-stock-in-service'
import { inventoryStockService } from '~/services/inventory-stock-service'
import { branchService } from '~/services/branch-service'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{ inventoryId: number }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ done: [] }>()

interface Row { variantId: number, name: string, code: string | null, new: number, used: number, addNew: number, addUsed: number }

const branchOptions = ref<{ label: string, value: number }[]>([])
const branchId = ref<number | undefined>(undefined)
const rows = ref<Row[]>([])
const isLoading = ref(false)
const note = ref('')
const attachments = ref<Attachment[]>([])
const attachmentIds = ref<number[]>([])
const saving = ref(false)

const hasQty = computed(() => rows.value.some(r => (Number(r.addNew) || 0) > 0 || (Number(r.addUsed) || 0) > 0))
const canSubmit = computed(() => !!branchId.value && hasQty.value)

const loadRows = async () => {
  if (!branchId.value) { rows.value = []; return }
  isLoading.value = true
  try {
    const res = await inventoryStockService.getEntryTemplate(branchId.value, props.inventoryId)
    rows.value = (res.success && res.data ? res.data : []).map(r => ({ variantId: r.variantId, name: r.name, code: r.code, new: r.new, used: r.used, addNew: 0, addUsed: 0 }))
  } finally {
    isLoading.value = false
  }
}

watch(branchId, loadRows)

const submit = async () => {
  if (!branchId.value) return

  const items = rows.value
    .filter(r => (Number(r.addNew) || 0) > 0 || (Number(r.addUsed) || 0) > 0)
    .map(r => ({ branchId: branchId.value!, variantId: r.variantId, new: Number(r.addNew) || 0, used: Number(r.addUsed) || 0 }))
  if (items.length === 0) return

  saving.value = true
  try {
    const res = await inventoryStockInService.create({ inventoryId: props.inventoryId, note: note.value || null, attachmentIds: attachmentIds.value, items })
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
    branchId.value = undefined
    note.value = ''
    attachments.value = []
    attachmentIds.value = []
    rows.value = []
    const b = await branchService.getList()
    if (b.success && b.data) {
      branchOptions.value = b.data.map(x => ({ label: x.name, value: x.id }))
      branchId.value = b.data.length === 1 ? b.data[0]!.id : undefined
    }
    if (branchId.value) await loadRows()
  }
})
</script>
