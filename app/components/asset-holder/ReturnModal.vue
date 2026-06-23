<template>
  <UModal 
    :title="$t('component.assetHolder.returnModal.title')"
    :description="$t('component.assetHolder.returnModal.description')"
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UAlert
        v-if="activeHolder"
        :avatar="{
          src: activeHolder.employee?.photo || undefined,
          alt: activeHolder.employee?.name,
        }"
        :title="activeHolder.employee?.name"
        :description="activeHolder.employee?.employeeId"
        color="neutral"
        variant="subtle"
        class="mb-4"
      />

      <UForm id="return-asset-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
        <!-- Returned Date Field -->
        <UFormField :label="$t('component.assetHolder.returnModal.returnDate')" name="returnedDate" required>
          <UInput type="datetime-local" v-model="form.returnedDate" class="w-full" />
        </UFormField>

        <!-- Note Field -->
        <UFormField :label="$t('component.assetHolder.returnModal.returnNotes')" name="returnNote">
          <UTextarea v-model="form.returnNote" :placeholder="$t('component.assetHolder.returnModal.notesPlaceholder')" class="w-full" :rows="3" />
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
        <UButton :label="$t('common.cancel')" @click="open = false" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="return-asset-form"
          color="success"
          :loading="isSubmitting"
        >
          {{ $t('component.assetHolder.returnModal.submit') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { assetHolderService } from '~/services/asset-holder-service'
import type { AssetHolder } from '~/types/asset-holder'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()

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
  returnedDate: z.string().min(1, t('component.assetHolder.returnModal.dateRequired')),
  returnNote: z.string().optional().or(z.literal('')),
})

const getLocalDatetimeString = () => {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const form = reactive({
  returnedDate: getLocalDatetimeString(), // Default to current date & time
  returnNote: '',
  attachmentIds: [] as number[],
})

const onAttachmentsChanged = (ids: number[]) => {
  form.attachmentIds = ids
}

const resetForm = () => {
  form.returnedDate = getLocalDatetimeString()
  form.returnNote = ''
  form.attachmentIds = []
  uploadedAttachments.value = []
}

const handleSubmit = async () => {
  if (!props.activeHolder) {
    toast.add({
      title: t('component.assetHolder.returnModal.error'),
      description: t('component.assetHolder.returnModal.noActiveHolder'),
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
        title: t('component.assetHolder.returnModal.success'),
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
