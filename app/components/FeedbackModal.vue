<template>
  <UModal
    v-model:open="open"
    title="Report an Issue"
    description="Please provide detailed information about the issue."
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-between'
    }"
  >
    <template #body>
      <!-- Top Note -->
      <div class="mb-4 space-y-1">
        <p class="text-sm text-neutral-600 leading-relaxed">
          We are improving the information system so it works well for everyone. Thank you for your feedback.
        </p>
        <div>
          <span class="text-blue-500 font-medium underline text-sm break-all">
            {{ state.url }}
          </span>
        </div>
      </div>

      <!-- Form matching the layout of other modals -->
      <UForm
        id="feedback-form"
        :schema="schema"
        :state="state"
        class="space-y-4 w-full"
        @submit="onSubmit"
      >
        <!-- Type Field -->
        <UFormField label="Type" name="type" required>
          <URadioGroup
            v-model="state.type"
            indicator="end"
            variant="card"
            :items="items"
            orientation="horizontal"
            class="w-full"
          />
        </UFormField>

        <!-- Description Field -->
        <UFormField label="Description" name="description" required>
          <UTextarea
            v-model="state.description"
            placeholder="Please describe your feedback..."
            class="w-full"
            :rows="4"
          />
        </UFormField>

        <!-- Screenshots Field -->
        <UFormField label="Screenshots" name="images" required>
          <UFileUpload
            v-model="state.images"
            layout="grid"
            multiple
            :interactive="false"
            class="w-full min-h-25"
          >
            <template #actions="{ open: openFileSelect }">
              <UButton
                label="Select Images"
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
                  Screenshot ({{ files.length }})
                </p>
                <UButton
                  icon="i-lucide-plus"
                  label="Add more"
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
        <div class="text-center text-sm text-neutral-500 pt-2">
          <span>- Feedback is a gift -</span>
        </div>
      </UForm>
    </template>

    <template #footer>
      <!-- Action Buttons matching style of other modals -->
      <div class="flex justify-between items-center w-full">
        <UButton
          label="History"
          color="primary"
          variant="ghost"
          icon="i-lucide-history"
          to="/feedback"
          @click="open = false"
        />
        <div class="flex gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            label="Send Feedback"
            color="primary"
            variant="solid"
            type="submit"
            form="feedback-form"
            :loading="saving"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { useFeedback } from '~/composables/useFeedback'
import { feedbackService } from '~/services/feedback-service'

const open = defineModel<boolean>('open', { default: false })

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
    } 
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
