<template>
  <UModal 
    title="Add Asset Maintenance"
    description="Fill in the details to record a new asset maintenance event."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="add-maintenance-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
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
        <UFormField label="Note" name="note" required>
          <UTextarea v-model="form.note" placeholder="Enter maintenance details / notes" class="w-full" :rows="3" />
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
          form="add-maintenance-form"
          color="primary"
          :loading="isSubmitting"
        >
          Save Maintenance
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
import type { AssetMaintenancePayload } from '~/types/asset-maintenance'
import type { Attachment } from '~/types/attachment'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  lockAssetId?: number
}>()

const emit = defineEmits<{ created: [] }>()
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
  note: z.string().min(1, 'Note is required'),
})

const form = reactive<AssetMaintenancePayload>({
  assetId: undefined as unknown as number,
  date: new Date().toISOString().split('T')[0] || '', // Default to today
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
    }
  } finally {
    isLoadingAssets.value = false
  }
}

const resetForm = () => {
  form.assetId = props.lockAssetId ? props.lockAssetId : (undefined as unknown as number)
  form.date = new Date().toISOString().split('T')[0] || ''
  form.note = ''
  form.attachmentIds = []
  selectedAsset.value = undefined
  uploadedAttachments.value = []
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await assetMaintenanceService.create(form)
    if (response.success) {
      toast.add({
        title: 'Asset maintenance recorded successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('created')
      open.value = false
      resetForm()
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (val) => {
  if (val) {
    resetForm()
    if (props.lockAssetId) {
      form.assetId = props.lockAssetId
    } else {
      loadAssets()
    }
  }
})
</script>
