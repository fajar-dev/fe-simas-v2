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
      <!-- Hidden File Input -->
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />

      <!-- Top Note -->
      <div class="mb-4 space-y-1 select-none">
        <p class="text-sm text-neutral-600 leading-relaxed">
          {{ t('modal.feedback.note') }}
        </p>
        <div>
          <a
            :href="state.url"
            target="_blank"
            class="text-blue-500 font-medium underline text-sm break-all hover:text-blue-600"
          >
            {{ state.url }}
          </a>
        </div>
      </div>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4 w-full"
        @submit="onSubmit"
      >
        <!-- Custom Segmented Radio Buttons (Issue, Suggestion, Compliment) -->
        <UFormField name="type">
          <div class="grid grid-cols-3 gap-3 w-full">
            <button
              v-for="item in items"
              :key="item.value"
              type="button"
              class="flex items-center justify-between px-3.5 py-2.5 border rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none text-left focus:outline-none"
              :class="[
                state.type === item.value
                  ? 'border-emerald-500 bg-emerald-50/10 text-neutral-800 ring-1 ring-emerald-500'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50/50'
              ]"
              @click="state.type = item.value"
            >
              <span>{{ item.label }}</span>
              <div 
                class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200"
                :class="[
                  state.type === item.value
                    ? 'border-emerald-500 bg-white'
                    : 'border-neutral-300 bg-white'
                ]"
              >
                <div 
                  v-if="state.type === item.value" 
                  class="w-2.5 h-2.5 rounded-full bg-emerald-500" 
                />
              </div>
            </button>
          </div>
        </UFormField>

        <!-- Feedback Message / Description Textarea -->
        <UFormField name="description">
          <UTextarea
            v-model="state.description"
            :placeholder="placeholderText"
            class="w-full"
            :rows="4"
          />
        </UFormField>

        <!-- Custom Screenshots/Image Upload Container -->
        <UFormField name="images">
          <div class="border border-dashed border-neutral-200 rounded-xl p-4 space-y-4 bg-white">
            <!-- Header Row inside screenshots box -->
            <div class="flex items-center justify-between select-none">
              <span class="font-bold text-neutral-800 text-sm">
                {{ t('modal.feedback.screenshot') }} ({{ state.images.length }})
              </span>
              <button
                type="button"
                class="border border-neutral-200 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-neutral-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700"
                :disabled="!canAddMoreImages"
                @click="triggerFileSelect"
              >
                <UIcon name="i-lucide-plus" class="w-3.5 h-3.5" />
                {{ t('modal.feedback.addMore') }}
              </button>
            </div>

            <!-- Previews Grid -->
            <div v-if="state.images.length" class="flex flex-wrap gap-4">
              <div
                v-for="(file, idx) in state.images"
                :key="idx"
                class="relative w-28 h-20 bg-neutral-50 border border-neutral-100 rounded-md overflow-visible shrink-0 group shadow-2xs"
              >
                <!-- Image Preview -->
                <img
                  :src="getImageUrl(file)"
                  class="w-full h-full object-cover rounded-md"
                  alt="Preview"
                />
                <!-- Close/Delete Button Overlay -->
                <button
                  type="button"
                  class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center hover:bg-neutral-800 cursor-pointer shadow-sm select-none"
                  @click="removeImage(idx)"
                >
                  <UIcon name="i-lucide-x" class="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        </UFormField>

        <!-- Center tagline -->
        <div class="text-center text-sm text-neutral-500 py-1 select-none font-medium">
          <span>{{ t('modal.feedback.tagline') }}</span>
        </div>

        <!-- Action Buttons -->
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
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
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

// Custom File Handling Logic
const fileInputRef = ref<HTMLInputElement | null>(null)

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const filesArray = Array.from(target.files)
    const availableSlots = 5 - state.images.length
    if (availableSlots > 0) {
      state.images = [...state.images, ...filesArray.slice(0, availableSlots)]
    }
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const removeImage = (index: number) => {
  state.images.splice(index, 1)
}

const imageUrlCache = new Map<File, string>()
const getImageUrl = (file: File) => {
  if (imageUrlCache.has(file)) {
    return imageUrlCache.get(file)!
  }
  const url = URL.createObjectURL(file)
  imageUrlCache.set(file, url)
  return url
}

onUnmounted(() => {
  imageUrlCache.forEach((url) => URL.revokeObjectURL(url))
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
