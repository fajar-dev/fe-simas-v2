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
      <!-- Top Note -->
      <div class="mb-4 space-y-1">
        <p class="text-sm text-neutral-600 leading-relaxed">
          {{ t('modal.feedback.note') }}
        </p>
        <div>
          <span class="text-blue-500 font-medium underline text-sm break-all">
            {{ state.url }}
          </span>
        </div>
      </div>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4 w-full"
        @submit="onSubmit"
      >
        <!-- Nuxt UI Radio Group -->
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

        <!-- Nuxt UI Textarea -->
        <UFormField name="description">
          <UTextarea
            v-model="state.description"
            :placeholder="placeholderText"
            class="w-full"
            :rows="4"
          />
        </UFormField>

        <!-- Nuxt UI File Upload -->
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

        <!-- Tagline -->
        <div class="text-center text-sm text-neutral-500 py-1">
          <span>{{ t('modal.feedback.tagline') }}</span>
        </div>

        <!-- Actions -->
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
  type: 'issue',
  description: '',
  images: [] as File[],
  url: ''
})

const items = [
  { value: 'issue', label: 'Issue' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'compliment', label: 'Compliment' }
]

const translations: Record<string, string> = {
  'modal.feedback.note': 'We are improving the information system so it works well for everyone. Thank you for your feedback.',
  'modal.feedback.selectImages': 'Select Images',
  'modal.feedback.screenshot': 'Screenshot',
  'modal.feedback.addMore': 'Add more',
  'modal.feedback.tagline': '- Feedback is a gift -',
  'modal.feedback.history': 'Feedback History',
  'modal.feedback.cancel': 'Cancel',
  'modal.feedback.send': 'Send Feedback'
}

const t = (key: string) => translations[key] || key

// Dynamic placeholder based on selected feedback type
const placeholderText = computed(() => {
  if (state.type === 'issue') return 'Please describe your problem...'
  if (state.type === 'suggestion') return 'Please describe your suggestion...'
  if (state.type === 'compliment') return 'Please describe your compliment...'
  return 'Please describe your problem...'
})

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
    state.type = 'issue'
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
