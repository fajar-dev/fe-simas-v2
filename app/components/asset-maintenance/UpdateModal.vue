<template>
  <UModal 
    title="Edit Asset Maintenance"
    description="Update the asset maintenance details below."
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
        <UFormField v-if="!lockAssetId" label="Asset" name="assetId" required>
          <USelectMenu
            v-model="selectedAsset"
            :items="assetOptions"
            searchable
            searchable-placeholder="Search assets..."
            placeholder="Select asset"
            :loading="isLoadingAssets"
            class="w-full"
          />
        </UFormField>

        <!-- Date Field -->
        <UFormField label="Date" name="date" required>
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
        <UFormField label="Note" name="note">
          <UTextarea v-model="form.note" placeholder="Enter maintenance details (optional)" class="w-full" :rows="3" />
        </UFormField>

        <!-- Reusable Attachment Manager -->
        <AttachmentManager
          v-model="uploadedAttachments"
          @change="onAttachmentsChanged"
        />
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton label="Cancel" @click="open = false" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="update-maintenance-form"
          color="primary"
          :loading="isSubmitting"
        >
          Save Changes
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

const schema = z.object({
  assetId: z.number(),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional().or(z.literal('')),
})

const form = reactive<AssetMaintenancePayload>({
  assetId: undefined as unknown as number,
  date: '',
  note: '',
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
  form.attachmentIds = props.maintenance.attachments?.map(a => a.id) || []
  uploadedAttachments.value = props.maintenance.attachments || []

  if (!props.lockAssetId) {
    const matched = assetOptions.value.find(o => o.value === props.maintenance?.assetId)
    selectedAsset.value = matched || undefined
  }
}

const handleSubmit = async () => {
  if (!props.maintenance) return
  isSubmitting.value = true
  try {
    const response = await assetMaintenanceService.update(props.maintenance.id, form)
    if (response.success) {
      toast.add({
        title: 'Asset maintenance updated successfully!',
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
