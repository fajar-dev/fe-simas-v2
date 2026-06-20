<template>
  <UModal 
    title="Relocate Asset"
    description="Fill in the details to change the asset's location."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="add-location-history-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
        <!-- Asset Field (Only shown if not locked to a specific asset) -->
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

        <!-- Branch Field -->
        <UFormField label="Branch" name="branchId" required>
          <USelectMenu
            v-model="selectedBranch"
            :items="branchOptions"
            searchable
            searchable-placeholder="Search branches..."
            placeholder="Select branch"
            :loading="isLoadingBranches"
            class="w-full"
          />
        </UFormField>

        <!-- Location Field -->
        <UFormField label="New Location" name="locationId" required>
          <USelectMenu
            v-model="selectedLocation"
            :items="filteredLocationOptions"
            searchable
            searchable-placeholder="Search locations..."
            :placeholder="selectedBranch ? 'Select location' : 'Select branch first'"
            :disabled="!selectedBranch"
            :loading="isLoadingLocations"
            class="w-full"
          />
        </UFormField>

        <!-- Date Field -->
        <UFormField label="Relocation Date" name="date" required>
          <UInput type="datetime-local" v-model="form.date" class="w-full" />
        </UFormField>

        <!-- Note Field -->
        <UFormField label="Note / Reason" name="note">
          <UTextarea v-model="form.note" placeholder="Enter relocation reasons or details (optional)" class="w-full" :rows="3" />
        </UFormField>

        <!-- Attachment Manager -->
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
          form="add-location-history-form"
          color="primary"
          :loading="isSubmitting"
        >
          Relocate Asset
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { assetLocationService } from '~/services/asset-location-service'
import { branchService } from '~/services/branch-service'
import { locationService } from '~/services/location-service'
import { assetService } from '~/services/asset-service'
import type { Attachment } from '~/types/attachment'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  lockAssetId?: number
  excludeLocationId?: number
}>()

const emit = defineEmits<{ created: [] }>()
const toast = useToast()

// State
const isSubmitting = ref(false)
const isLoadingAssets = ref(false)
const isLoadingBranches = ref(false)
const isLoadingLocations = ref(false)

const assetOptions = ref<{ label: string; value: number }[]>([])
const branchOptions = ref<{ label: string; value: number }[]>([])
const filteredLocationOptions = ref<{ label: string; value: number }[]>([])

const selectedAsset = ref<{ label: string; value: number } | undefined>(undefined)
const selectedBranch = ref<{ label: string; value: number } | undefined>(undefined)
const selectedLocation = ref<{ label: string; value: number } | undefined>(undefined)
const uploadedAttachments = ref<Attachment[]>([])

const schema = z.object({
  assetId: z.number(),
  branchId: z.number(),
  locationId: z.number(),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional().or(z.literal('')),
})

const getLocalDatetimeString = () => {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const form = reactive({
  assetId: undefined as unknown as number,
  branchId: undefined as unknown as number,
  locationId: undefined as unknown as number,
  date: getLocalDatetimeString(), // Default to current date & time
  note: '',
  attachmentIds: [] as number[],
})

// Sync selections with form fields
watch(selectedAsset, (val) => {
  if (val) form.assetId = val.value
})

const loadLocationsForBranch = async (branchId: number) => {
  isLoadingLocations.value = true
  try {
    const res = await locationService.getByBranchId(branchId)
    if (res.success && res.data) {
      filteredLocationOptions.value = res.data
        .filter(l => l.id !== props.excludeLocationId)
        .map(l => ({
          label: l.name,
          value: l.id
        }))
    }
  } finally {
    isLoadingLocations.value = false
  }
}

watch(selectedBranch, async (val) => {
  if (val) {
    form.branchId = val.value
    await loadLocationsForBranch(val.value)
  } else {
    form.branchId = undefined as unknown as number
    filteredLocationOptions.value = []
  }
  // Reset location when branch changes
  selectedLocation.value = undefined
  form.locationId = undefined as unknown as number
})

watch(selectedLocation, (val) => {
  if (val) form.locationId = val.value
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

const loadBranches = async () => {
  isLoadingBranches.value = true
  try {
    const res = await branchService.getAll(1, 200)
    if (res.success && res.data) {
      branchOptions.value = res.data.map(b => ({
        label: `${b.code} - ${b.name}`,
        value: b.id
      }))
    }
  } finally {
    isLoadingBranches.value = false
  }
}

const resetForm = () => {
  form.assetId = props.lockAssetId ? props.lockAssetId : (undefined as unknown as number)
  form.branchId = undefined as unknown as number
  form.locationId = undefined as unknown as number
  form.date = getLocalDatetimeString()
  form.note = ''
  form.attachmentIds = []
  selectedAsset.value = undefined
  selectedBranch.value = undefined
  selectedLocation.value = undefined
  filteredLocationOptions.value = []
  uploadedAttachments.value = []
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await assetLocationService.create({
      assetId: form.assetId,
      locationId: form.locationId,
      date: form.date,
      note: form.note,
      attachmentIds: form.attachmentIds,
    })
    if (response.success) {
      toast.add({
        title: 'Asset relocated successfully!',
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
    loadBranches()
    if (props.lockAssetId) {
      form.assetId = props.lockAssetId
    } else {
      loadAssets()
    }
  }
})
</script>
