<template>
  <UModal
    v-model:open="open"
    title="Feedback"
    description="Submit new feedback with screenshots"
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <div class="mb-4">
        <p class="text-sm text-neutral-600 mb-1">{{ t('modal.feedback.note') }}</p>
        <span class="text-blue-500 font-medium underline text-sm break-all">{{ state.url }}</span>
      </div>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4 w-full"
        @submit="onSubmit"
      >
        <UFormField name="type">
          <URadioGroup
            v-model="state.type"
            indicator="end"
            variant="card"
            :items="items"
            orientation="horizontal"
            class="w-full"
          />
        </UFormField>

        <UFormField name="description">
          <UTextarea
            v-model="state.description"
            :placeholder="t('modal.feedback.placeholder')"
            class="w-full"
            :rows="4"
          />
        </UFormField>

        <UFormField name="images">
          <UFileUpload
            v-model="state.images"
            layout="grid"
            multiple
            :interactive="false"
            class="w-full min-h-25"
          >
            <template #actions="{ open: openFileSelect }">
              <UButton
                :label="t('modal.feedback.selectImages')"
                icon="i-lucide-upload"
                color="neutral"
                variant="outline"
                :disabled="!canAddMoreImages"
                @click="openFileSelect()"
              />
            </template>

            <template #files-top="{ open: openFileSelect, files }">
              <div v-if="files?.length" class="mb-2 flex items-center justify-between">
                <p class="font-bold text-sm">
                  {{ t('modal.feedback.screenshot') }} ({{ files.length }})
                </p>
                <UButton
                  icon="i-lucide-plus"
                  :label="t('modal.feedback.addMore')"
                  color="neutral"
                  variant="outline"
                  :disabled="!canAddMoreImages"
                  @click="openFileSelect()"
                />
              </div>
            </template>
          </UFileUpload>
        </UFormField>

        <div class="text-center text-sm text-gray-500">
          <span>{{ t('modal.feedback.tagline') }}</span>
        </div>

        <div class="flex justify-between items-center w-full">
          <UButton
            :label="t('modal.feedback.history')"
            color="primary"
            variant="ghost"
            icon="i-lucide-history"
            to="/my-feedback"
            @click="emit('update:open', false)"
          />
          <div class="flex justify-end gap-2">
            <UButton
              :label="t('modal.feedback.cancel')"
              color="neutral"
              variant="subtle"
              :disabled="saving"
              @click="emit('update:open', false)"
            />
            <UButton
              :label="t('modal.feedback.send')"
              color="primary"
              variant="solid"
              type="submit"
              :loading="saving"
            />
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { z } from 'zod'
import { useFeedback } from '~/composables/useFeedback'
import { feedbackService } from '~/services/feedback-service'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const { screenshotFile, currentUrl } = useFeedback()

const schema = z.object({
  type: z.string().min(1, 'Type is required'),
  description: z.string().min(1, 'Description is required'),
  images: z.array(z.any()).min(1, 'At least 1 image is required').max(5, 'Maximum 5 images allowed')
})

const state = reactive({
  type: 'bug',
  description: '',
  images: [] as File[],
  url: ''
})

const items = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'other', label: 'General / Other' }
]

const translations: Record<string, string> = {
  'modal.feedback.note': 'Your current page URL:',
  'modal.feedback.placeholder': 'Tell us what you think or report a bug...',
  'modal.feedback.selectImages': 'Select Images',
  'modal.feedback.screenshot': 'Screenshots',
  'modal.feedback.addMore': 'Add more',
  'modal.feedback.tagline': 'Feedback helps us improve SIMAS. Thank you!',
  'modal.feedback.history': 'Feedback History',
  'modal.feedback.cancel': 'Cancel',
  'modal.feedback.send': 'Send Feedback'
}

const t = (key: string) => translations[key] || key

const canAddMoreImages = computed(() => {
  return (state.images?.length || 0) < 5
})

const saving = ref(false)
const toast = useToast()

const onSubmit = async () => {
  saving.value = true
  try {
    const payload = {
      message: state.description,
      type: state.type,
      url: state.url,
      images: state.images
    }
    const response = await feedbackService.create(payload)
    if (response.success) {
      toast.add({
        title: 'Feedback submitted successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      open.value = false
      navigateTo('/my-feedback')
    } else {
      toast.add({
        title: 'Failed to submit feedback',
        description: response.message || 'Please try again.',
        color: 'error',
        icon: 'i-lucide-circle-x'
      })
    }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    toast.add({
      title: 'An error occurred',
      description: 'Could not connect to the server.',
      color: 'error',
      icon: 'i-lucide-circle-x'
    })
  } finally {
    saving.value = false
  }
}

// Watch open state to pre-fill screenshot and URL
watch(open, (isOpenVal) => {
  if (isOpenVal) {
    state.url = currentUrl.value
    state.description = ''
    state.type = 'bug'
    if (screenshotFile.value) {
      state.images = [screenshotFile.value]
    } else {
      state.images = []
    }
  } else {
    // Clean up
    state.url = ''
    state.description = ''
    state.images = []
  }
})
</script>
