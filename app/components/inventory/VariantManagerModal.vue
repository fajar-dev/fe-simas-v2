<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.inventory.variant.manageTitle')"
    :description="inventory?.name || ''"
    :ui="{ content: 'sm:max-w-lg', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <div v-if="isLoading" class="space-y-2">
        <USkeleton v-for="i in 3" :key="i" class="h-32 w-full" />
      </div>

      <UForm v-else id="variant-form" :schema="schema" :state="state" class="space-y-3" @submit="save">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-neutral-700">{{ $t('pages.inventory.variant.title') }}</label>
          <UButton icon="i-lucide-plus" color="primary" variant="soft" size="xs" @click="addRow">{{ $t('pages.inventory.variant.add') }}</UButton>
        </div>

        <div v-if="state.rows.length === 0" class="text-sm text-neutral-400 py-6 text-center border-2 border-dashed border-neutral-200 rounded-lg">
          {{ $t('pages.inventory.create.noVariants') }}
        </div>

        <div v-else class="space-y-3">
          <div v-for="(v, vi) in state.rows" :key="v.key" class="p-3 rounded-lg border border-neutral-200 space-y-2.5">
            <div class="flex items-start gap-2">
              <!-- Image -->
              <div class="shrink-0">
                <div v-if="v.imagePreview || v.image" class="relative w-32 h-32">
                  <NuxtImg :src="v.imagePreview || v.image || ''" class="w-full h-full rounded-md object-cover border border-neutral-200" />
                  <UButton icon="i-lucide-x" color="error" variant="solid" size="xs" class="absolute -top-1.5 -right-1.5 rounded-full" @click="() => removeImage(vi)" />
                </div>
                <label v-else class="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-md cursor-pointer hover:border-primary transition-colors">
                  <UIcon v-if="!v.uploading" name="i-lucide-image-plus" class="w-5 h-5 text-neutral-400" />
                  <UIcon v-else name="i-lucide-loader-2" class="w-5 h-5 text-neutral-400 animate-spin" />
                  <input type="file" class="hidden" accept="image/*" @change="(e) => onFile(vi, e)">
                </label>
              </div>

              <!-- Name (top) / Code (bottom) -->
              <div class="flex-1 flex flex-col gap-2">
                <div class="flex items-start gap-2">
                  <UFormField :label="$t('common.name')" :name="`rows.${vi}.name`" class="flex-1" required>
                    <UInput v-model="v.name" class="w-full" :placeholder="$t('pages.inventory.create.variantName')" />
                  </UFormField>
                  <UButton icon="i-lucide-trash" color="error" variant="soft" size="sm" square class="mt-6" @click="() => removeRow(vi)" />
                </div>
                <UFormField :label="$t('common.code')" :name="`rows.${vi}.code`">
                  <div class="flex items-center gap-2">
                    <UInput v-model="v.code" :placeholder="$t('pages.inventory.variant.codePlaceholder')" class="w-full" />
                    <UButton icon="i-lucide-scan" size="sm" color="neutral" variant="soft" square :title="$t('pages.inventory.create.scan')" @click="() => openScanner(vi)" />
                  </div>
                </UFormField>
              </div>
            </div>
            <UFormField :label="$t('common.description')" :name="`rows.${vi}.description`">
              <UTextarea v-model="v.description" :rows="2" :placeholder="$t('common.enterDescription')" class="w-full" />
            </UFormField>
          </div>
        </div>
      </UForm>

      <AssetScannerModal v-model="showScanner" @scanned="onCodeScanned" />
    </template>

    <template #footer>
      <UButton :label="$t('common.cancel')" color="neutral" variant="outline" :disabled="saving" @click="() => { open = false }" />
      <UButton :label="$t('common.save')" color="primary" type="submit" form="variant-form" :loading="saving" :disabled="isUploading" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { inventoryVariantService } from '~/services/inventory-variant-service'
import { inventoryService } from '~/services/inventory-service'
import type { Inventory } from '~/types/inventory'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{ inventory?: Inventory | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ changed: [] }>()

interface VariantRow {
  key: number
  id?: number
  name: string
  code: string
  image: string | null
  description: string
  imagePreview?: string | null
  uploading?: boolean
}

const isLoading = ref(false)
const saving = ref(false)
const removedIds = ref<number[]>([])
let keySeq = 0

const schema = z.object({
  rows: z.array(z.object({
    name: z.string().trim().min(1, t('common.nameRequired')),
    code: z.string().optional().or(z.literal('')),
    description: z.string().optional().or(z.literal(''))
  }))
})
const state = reactive<{ rows: VariantRow[] }>({ rows: [] })

const isUploading = computed(() => state.rows.some(r => r.uploading))

const addRow = () => { state.rows.push({ key: keySeq++, name: '', code: '', image: null, description: '', imagePreview: null, uploading: false }) }
const removeRow = (index: number) => {
  const row = state.rows[index]
  if (row?.id) removedIds.value.push(row.id)
  state.rows.splice(index, 1)
}
const removeImage = (index: number) => {
  const row = state.rows[index]
  if (row) { row.image = null; row.imagePreview = null }
}

const onFile = async (index: number, e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  const row = state.rows[index]
  if (!file || !row) return
  row.imagePreview = URL.createObjectURL(file)
  row.uploading = true
  try {
    const res = await inventoryService.uploadImage(file)
    if (res.success && res.data) { row.image = res.data.path }
    else { toast.add({ title: res.message || 'Upload failed', color: 'error', icon: 'i-lucide-circle-alert' }); row.imagePreview = null }
  } finally {
    row.uploading = false
  }
}

// ── Scan ──────────────────────────────────────────────────────────────
const showScanner = ref(false)
const scanIndex = ref(-1)
const openScanner = (index: number) => { scanIndex.value = index; showScanner.value = true }
const onCodeScanned = (code: string) => {
  const c = code.trim()
  const row = state.rows[scanIndex.value]
  if (c && row) row.code = c
}

const fetchVariants = async () => {
  if (!props.inventory) return
  isLoading.value = true
  try {
    const res = await inventoryVariantService.getByInventory(props.inventory.id)
    state.rows = (res.success && res.data ? res.data : []).map(v => ({
      key: keySeq++, id: v.id, name: v.name, code: v.code || '', image: v.image, description: v.description || '', imagePreview: null, uploading: false
    }))
    removedIds.value = []
  } finally {
    isLoading.value = false
  }
}

const save = async () => {
  if (!props.inventory) return
  saving.value = true
  const errors: string[] = []
  try {
    for (const id of removedIds.value) {
      const res = await inventoryVariantService.remove(id)
      if (!res.success) errors.push(res.message || 'Delete failed')
    }
    for (const row of state.rows) {
      const payload = { name: row.name.trim(), code: row.code.trim() || null, image: row.image, description: row.description.trim() || null }
      const res = row.id
        ? await inventoryVariantService.update(row.id, payload)
        : await inventoryVariantService.create({ inventoryId: props.inventory.id, ...payload })
      if (!res.success) errors.push(res.message || 'Save failed')
    }

    await fetchVariants()
    emit('changed')

    if (errors.length) {
      toast.add({ title: errors[0], color: 'error', icon: 'i-lucide-circle-alert' })
    } else {
      toast.add({ title: t('pages.inventory.variant.saveSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
    }
  } finally {
    saving.value = false
  }
}

watch(open, (val) => { if (val) fetchVariants() })
</script>
