<template>
  <UModal 
    title="Assign Asset"
    description="Select an employee to assign this asset to."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="assign-asset-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
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

        <!-- Employee Field -->
        <UFormField label="Employee" name="employeeId" required>
          <USelectMenu
            v-model="selectedEmployee"
            :items="employeeOptions"
            searchable
            searchable-placeholder="Search employees by name or ID..."
            placeholder="Select employee"
            :loading="isLoadingEmployees"
            class="w-full"
          />
        </UFormField>

        <!-- Assigned Date Field -->
        <UFormField label="Assignment Date" name="assignedDate" required>
          <UInputDate v-model="assignedDateVal" class="w-full">
            <template #trailing>
              <UPopover>
                <UButton icon="i-lucide-calendar" color="neutral" variant="ghost" size="sm" square />
                <template #content>
                  <UCalendar v-model="assignedDateVal" />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>

        <!-- Note Field -->
        <UFormField label="Assignment Notes" name="assignNote">
          <UTextarea v-model="form.assignNote" placeholder="Enter assignment details or notes (optional)" class="w-full" :rows="3" />
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
          form="assign-asset-form"
          color="primary"
          :loading="isSubmitting"
        >
          Assign Asset
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { parseDate } from '@internationalized/date'
import { assetHolderService } from '~/services/asset-holder-service'
import { employeeService } from '~/services/employee-service'
import { assetService } from '~/services/asset-service'
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
const isLoadingEmployees = ref(false)

const assetOptions = ref<{ label: string; value: number }[]>([])
const employeeOptions = ref<{ label: string; value: number }[]>([])

const selectedAsset = ref<{ label: string; value: number } | undefined>(undefined)
const selectedEmployee = ref<{ label: string; value: number } | undefined>(undefined)
const uploadedAttachments = ref<Attachment[]>([])

const schema = z.object({
  assetId: z.number().int().positive('Asset is required'),
  employeeId: z.number().int().positive('Employee is required'),
  assignedDate: z.string().min(1, 'Assignment date is required'),
  assignNote: z.string().optional().or(z.literal('')),
})

const form = reactive({
  assetId: undefined as unknown as number,
  employeeId: undefined as unknown as number,
  assignedDate: new Date().toISOString().split('T')[0] || '', // Default to today
  assignNote: '',
  attachmentIds: [] as number[],
})

const assignedDateVal = computed({
  get: () => {
    if (!form.assignedDate) return undefined
    try { return parseDate(form.assignedDate) } catch { return undefined }
  },
  set: (val) => {
    form.assignedDate = val ? val.toString() : ''
  }
})

// Sync selections with form fields
watch(selectedAsset, (val) => {
  if (val) form.assetId = val.value
})

watch(selectedEmployee, (val) => {
  if (val) form.employeeId = val.value
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

const loadEmployees = async () => {
  isLoadingEmployees.value = true
  try {
    // Get up to 500 employees for the searchable list
    const res = await employeeService.getAll(1, 500)
    if (res.success && res.data) {
      employeeOptions.value = res.data.map(e => ({
        label: `${e.name} (${e.employeeId})`,
        value: e.id
      }))
    }
  } finally {
    isLoadingEmployees.value = false
  }
}

const resetForm = () => {
  form.assetId = props.lockAssetId ? props.lockAssetId : (undefined as unknown as number)
  form.employeeId = undefined as unknown as number
  form.assignedDate = new Date().toISOString().split('T')[0] || ''
  form.assignNote = ''
  form.attachmentIds = []
  selectedAsset.value = undefined
  selectedEmployee.value = undefined
  uploadedAttachments.value = []
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await assetHolderService.create({
      assetId: form.assetId,
      employeeId: form.employeeId,
      assignedDate: form.assignedDate,
      assignNote: form.assignNote,
      attachmentIds: form.attachmentIds,
    })
    if (response.success) {
      toast.add({
        title: 'Asset assigned successfully!',
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
    loadEmployees()
    if (props.lockAssetId) {
      form.assetId = props.lockAssetId
    } else {
      loadAssets()
    }
  }
})
</script>
