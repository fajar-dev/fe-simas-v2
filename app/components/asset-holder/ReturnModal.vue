<template>
  <UModal 
    title="Return Asset"
    description="Record the return of this asset to inventory."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <div v-if="activeHolder" class="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center gap-3">
        <UAvatar
          :src="activeHolder.employee?.photo || undefined"
          :alt="activeHolder.employee?.name"
          size="sm"
          class="bg-primary-50 text-primary-700"
        />
        <div class="min-w-0 flex-1">
          <p class="text-xs text-neutral-500 font-medium">Currently Held By</p>
          <p class="text-sm font-semibold text-neutral-950 truncate">{{ activeHolder.employee?.name }}</p>
          <p class="text-xs text-neutral-500">Assigned on {{ activeHolder.assignedDate }}</p>
        </div>
      </div>

      <UForm id="return-asset-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
        <!-- Returned Date Field -->
        <UFormField label="Return Date" name="returnedDate" required>
          <UInputDate v-model="returnedDateVal" class="w-full">
            <template #trailing>
              <UPopover>
                <UButton icon="i-lucide-calendar" color="neutral" variant="ghost" size="sm" square />
                <template #content>
                  <UCalendar v-model="returnedDateVal" />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>

        <!-- Note Field -->
        <UFormField label="Return Notes" name="returnNote">
          <UTextarea v-model="form.returnNote" placeholder="Enter return details, condition, or notes (optional)" class="w-full" :rows="3" />
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
          form="return-asset-form"
          color="success"
          :loading="isSubmitting"
        >
          Return Asset
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { parseDate } from '@internationalized/date'
import { assetHolderService } from '~/services/asset-holder-service'
import type { AssetHolder } from '~/types/asset-holder'
import type { Attachment } from '~/types/attachment'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  activeHolder: AssetHolder | null
}>()

const emit = defineEmits<{ returned: [] }>()
const toast = useToast()

// State
const isSubmitting = ref(false)
const uploadedAttachments = ref<Attachment[]>([])

const schema = z.object({
  returnedDate: z.string().min(1, 'Return date is required'),
  returnNote: z.string().optional().or(z.literal('')),
})

const form = reactive({
  returnedDate: new Date().toISOString().split('T')[0] || '', // Default to today
  returnNote: '',
  attachmentIds: [] as number[],
})

const returnedDateVal = computed({
  get: () => {
    if (!form.returnedDate) return undefined
    try { return parseDate(form.returnedDate) } catch { return undefined }
  },
  set: (val) => {
    form.returnedDate = val ? val.toString() : ''
  }
})

const onAttachmentsChanged = (ids: number[]) => {
  form.attachmentIds = ids
}

const resetForm = () => {
  form.returnedDate = new Date().toISOString().split('T')[0] || ''
  form.returnNote = ''
  form.attachmentIds = []
  uploadedAttachments.value = []
}

const handleSubmit = async () => {
  if (!props.activeHolder) {
    toast.add({
      title: 'Error returning asset',
      description: 'No active holder found for this asset.',
      color: 'error'
    })
    return
  }

  isSubmitting.value = true
  try {
    const response = await assetHolderService.returnAsset(props.activeHolder.id, {
      returnedDate: form.returnedDate,
      returnNote: form.returnNote,
      attachmentIds: form.attachmentIds,
    })
    if (response.success) {
      toast.add({
        title: 'Asset returned successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('returned')
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
  }
})
</script>
