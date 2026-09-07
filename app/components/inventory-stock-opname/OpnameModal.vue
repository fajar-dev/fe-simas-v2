<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.inventory.opname.title')"
    :description="$t('pages.inventory.opname.description')"
    :ui="{ content: 'sm:max-w-lg', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField :label="$t('common.branch')" required>
          <USelectMenu v-model="branchId" :items="branchOptions" value-key="value" searchable :searchable-placeholder="$t('common.search')" :placeholder="$t('pages.inventory.transfer.selectBranch')" class="w-full" />
        </UFormField>

        <!-- Rows: variant × new/used, counted quantity with live difference -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-default">{{ $t('pages.inventory.variant.title') }}</label>

          <div v-if="isLoading" class="space-y-2">
            <USkeleton v-for="i in 3" :key="i" class="h-9 w-full" />
          </div>
          <div v-else-if="!branchId" class="text-sm text-dimmed py-6 text-center border-2 border-dashed border-default rounded-lg">
            {{ $t('pages.inventory.opname.pickBranchFirst') }}
          </div>
          <div v-else-if="rows.length === 0" class="text-sm text-dimmed py-6 text-center border-2 border-dashed border-default rounded-lg">
            {{ $t('pages.inventory.entry.noVariants') }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[480px] text-sm">
              <thead>
                <tr class="text-left text-xs font-semibold text-dimmed uppercase tracking-wider border-b border-default">
                  <th class="py-2 pr-3">{{ $t('pages.inventory.variant.title') }}</th>
                  <th class="py-2 px-2">{{ $t('pages.inventory.condition.new') }}</th>
                  <th class="py-2 px-2">{{ $t('pages.inventory.condition.used') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows" :key="row.variantId" class="border-b border-muted">
                  <td class="py-2 pr-3">
                    <div class="font-medium text-highlighted">{{ row.name }}</div>
                    <div v-if="row.code" class="text-xs text-muted">{{ row.code }}</div>
                  </td>
                  <td class="py-2 px-2">
                    <div class="flex items-center gap-1.5">
                      <UInput v-model.number="row.countedNew" type="number" :min="0" size="sm" class="w-20" />
                      <span class="text-xs text-dimmed">{{ $t('pages.inventory.opname.system') }}: {{ row.new }}</span>
                      <span v-if="deltaOf(row.countedNew, row.new) !== 0" class="text-xs font-medium" :class="deltaOf(row.countedNew, row.new) > 0 ? 'text-success' : 'text-error'">
                        {{ deltaOf(row.countedNew, row.new) > 0 ? '+' : '' }}{{ deltaOf(row.countedNew, row.new) }}
                      </span>
                    </div>
                  </td>
                  <td class="py-2 px-2">
                    <div class="flex items-center gap-1.5">
                      <UInput v-model.number="row.countedUsed" type="number" :min="0" size="sm" class="w-20" />
                      <span class="text-xs text-dimmed">{{ $t('pages.inventory.opname.system') }}: {{ row.used }}</span>
                      <span v-if="deltaOf(row.countedUsed, row.used) !== 0" class="text-xs font-medium" :class="deltaOf(row.countedUsed, row.used) > 0 ? 'text-success' : 'text-error'">
                        {{ deltaOf(row.countedUsed, row.used) > 0 ? '+' : '' }}{{ deltaOf(row.countedUsed, row.used) }}
                      </span>
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
      <UButton :label="$t('common.save')" color="primary" :loading="saving" :disabled="!canSubmit" @click="submit" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { inventoryStockOpnameService } from '~/services/inventory-stock-opname-service'
import { inventoryStockService } from '~/services/inventory-stock-service'
import { branchService } from '~/services/branch-service'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{ inventoryId: number }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ done: [] }>()

interface Row { variantId: number, name: string, code: string | null, new: number, used: number, countedNew: number, countedUsed: number }

const branchOptions = ref<{ label: string, value: number }[]>([])
const branchId = ref<number | undefined>(undefined)
const rows = ref<Row[]>([])
const isLoading = ref(false)
const note = ref('')
const attachments = ref<Attachment[]>([])
const attachmentIds = ref<number[]>([])
const saving = ref(false)

const deltaOf = (counted: number, system: number) => (Number(counted) || 0) - system
const canSubmit = computed(() => !!branchId.value && rows.value.length > 0)

const loadRows = async () => {
  if (!branchId.value) { rows.value = []; return }
  isLoading.value = true
  try {
    const res = await inventoryStockService.getEntryTemplate(branchId.value, props.inventoryId)
    rows.value = (res.success && res.data ? res.data : []).map(r => ({ variantId: r.variantId, name: r.name, code: r.code, new: r.new, used: r.used, countedNew: r.new, countedUsed: r.used }))
  } finally {
    isLoading.value = false
  }
}

watch(branchId, loadRows)

const submit = async () => {
  if (!branchId.value || rows.value.length === 0) return

  const items = rows.value.map(r => ({ variantId: r.variantId, new: Number(r.countedNew) || 0, used: Number(r.countedUsed) || 0 }))

  saving.value = true
  try {
    const res = await inventoryStockOpnameService.create({ inventoryId: props.inventoryId, branchId: branchId.value, note: note.value || null, attachmentIds: attachmentIds.value, items })
    if (res.success) {
      toast.add({ title: t('pages.inventory.opname.success'), color: 'success', icon: 'i-lucide-circle-check' })
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
