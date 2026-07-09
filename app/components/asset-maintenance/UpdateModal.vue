<template>
  <UModal 
    :title="$t('component.assetMaintenance.updateModal.title')"
    :description="$t('component.assetMaintenance.updateModal.description')"
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="update-maintenance-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
        <!-- Asset Field -->
        <UFormField v-if="!lockAssetId" :label="$t('common.asset')" name="assetId" required>
          <USelectMenu
            v-model="selectedAsset"
            :items="assetOptions"
            searchable
            :searchable-placeholder="$t('component.assetMaintenance.updateModal.searchAssets')"
            :placeholder="$t('component.assetMaintenance.updateModal.selectAsset')"
            :loading="isLoadingAssets"
            class="w-full"
          />
        </UFormField>

        <!-- Date Field -->
        <UFormField :label="$t('common.date')" name="date" required>
          <UInputDate v-model="dateVal" class="w-full">
            <template #trailing>
              <UPopover>
                <UButton icon="i-lucide-calendar" color="neutral" variant="ghost" size="sm" square />
                <template #content>
                  <UCalendar v-model="dateVal" />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>

        <!-- Note Field -->
        <UFormField :label="$t('common.note')" name="note" required>
          <UTextarea v-model="form.note" :placeholder="$t('component.assetMaintenance.updateModal.notePlaceholder')" class="w-full" :rows="3" />
        </UFormField>

        <!-- Cost Field -->
        <UFormField :label="$t('common.cost')" name="cost">
          <UInput v-model.number="form.cost" type="number" :placeholder="$t('component.assetMaintenance.updateModal.costPlaceholder')" class="w-full" min="0" step="1">
            <template #leading>
              <span class="text-neutral-400 text-sm">Rp</span>
            </template>
          </UInput>
        </UFormField>

        <!-- Labels -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('common.labels') }}</label>
            <UButton icon="i-lucide-plus" color="primary" variant="soft" size="xs" @click="addLabel">{{ $t('common.add') }}</UButton>
          </div>
          <div v-if="formLabels.length === 0" class="text-sm text-neutral-400 py-3 text-center border border-dashed border-neutral-200 rounded-lg">
            {{ $t('pages.asset.create.noLabels') }}
          </div>
          <div v-else class="space-y-2">
            <div v-for="(label, index) in formLabels" :key="index" class="flex items-center gap-2">
              <UInput v-model="label.key" placeholder="Key" class="w-full" />
              <UInput v-model="label.value" placeholder="Value" class="w-full" />
              <UButton icon="i-lucide-trash" color="error" variant="soft" size="sm" square @click="() => { formLabels.splice(index, 1) }" />
            </div>
          </div>
        </div>

        <!-- Reusable Attachment Manager -->
        <AttachmentManager
          v-model="uploadedAttachments"
          @change="onAttachmentsChanged"
        />
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton :label="$t('common.cancel')" @click="() => { open = false }" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="update-maintenance-form"
          color="primary"
          :loading="isSubmitting"
        >
          {{ $t('component.assetMaintenance.updateModal.submit') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { parseDate } from '@internationalized/date'
import { assetMaintenanceService } from '~/services/asset-maintenance-service'
import { assetService } from '~/services/asset-service'
import type { AssetMaintenance, AssetMaintenancePayload } from '~/types/asset-maintenance'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  maintenance: AssetMaintenance | null
  lockAssetId?: number
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()

// State
const isSubmitting = ref(false)
const isLoadingAssets = ref(false)
const assetOptions = ref<{ label: string; value: number }[]>([])
const selectedAsset = ref<{ label: string; value: number } | undefined>(undefined)
const uploadedAttachments = ref<Attachment[]>([])
const formLabels = ref<{ key: string; value: string }[]>([])
const addLabel = () => { formLabels.value.push({ key: '', value: '' }) }

const schema = z.object({
  assetId: z.number(),
  date: z.string().min(1, t('component.assetMaintenance.updateModal.dateRequired')),
  note: z.string().min(1, t('component.assetMaintenance.updateModal.noteRequired')),
})

const form = reactive<AssetMaintenancePayload>({
  assetId: undefined as unknown as number,
  date: '',
  note: '',
  cost: 0,
  attachmentIds: [],
})

const dateVal = computed({
  get: () => {
    if (!form.date) return undefined
    try { return parseDate(form.date) } catch { return undefined }
  },
  set: (val) => {
    form.date = val ? val.toString() : ''
  }
})

// Sync selectedAsset with form.assetId
watch(selectedAsset, (val) => {
  if (val) form.assetId = val.value
})

const onAttachmentsChanged = (ids: number[]) => {
  form.attachmentIds = ids
}

const loadAssets = async () => {
  isLoadingAssets.value = true
  try {
    const res = await assetService.getAll(1, 200)
    if (res.success && res.data) {
      assetOptions.value = res.data.map(a => ({
        label: `${a.code} - ${a.name}`,
        value: a.id
      }))
      
      // Populate selectedAsset from props.maintenance after assets are loaded
      if (props.maintenance) {
        const matched = assetOptions.value.find(o => o.value === props.maintenance?.assetId)
        if (matched) selectedAsset.value = matched
      }
    }
  } finally {
    isLoadingAssets.value = false
  }
}

const populateForm = () => {
  if (!props.maintenance) return

  form.assetId = props.maintenance.assetId
  form.date = props.maintenance.date
  form.note = props.maintenance.note || ''
  form.cost = props.maintenance.cost ?? 0
  form.attachmentIds = props.maintenance.attachments?.map(a => a.id) || []
  uploadedAttachments.value = props.maintenance.attachments || []
  formLabels.value = (props.maintenance.labels || []).map(l => ({ key: l.key, value: l.value }))

  if (!props.lockAssetId) {
    const matched = assetOptions.value.find(o => o.value === props.maintenance?.assetId)
    selectedAsset.value = matched || undefined
  }
}

const handleSubmit = async () => {
  if (!props.maintenance) return
  isSubmitting.value = true
  try {
    const filteredLabels = formLabels.value.filter(l => l.key.trim() && l.value.trim())
    const response = await assetMaintenanceService.update(props.maintenance.id, { ...form, labels: filteredLabels })
    if (response.success) {
      toast.add({
        title: t('component.assetMaintenance.updateModal.success'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('updated')
      open.value = false
    }
  } finally {
    isSubmitting.value = false
  }
}

watch([open, () => props.maintenance], async ([isOpen, currentMaintenance]) => {
  if (isOpen && currentMaintenance) {
    if (props.lockAssetId) {
      form.assetId = props.lockAssetId
    } else {
      await loadAssets()
    }
    populateForm()
  }
}, { immediate: true })
</script>
