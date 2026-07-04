<template>
  <UModal
    v-model:open="open"
    :title="$t('component.feedbackModal.title')"
    :description="$t('component.feedbackModal.description')"
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
          {{ $t('component.feedbackModal.infoNote') }}
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
        <UFormField :label="$t('component.feedbackModal.type')" name="type" required>
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
        <UFormField :label="$t('component.feedbackModal.descriptionLabel')" name="description" required>
          <UTextarea
            v-model="state.description"
            :placeholder="$t('component.feedbackModal.descriptionPlaceholder')"
            class="w-full"
            :rows="4"
          />
        </UFormField>

        <!-- Attachment Field -->
        <UFormField :label="$t('component.feedbackModal.attachment')" name="images" required>
          <UFileUpload
            v-model="state.images"
            layout="grid"
            multiple
            :interactive="false"
            class="w-full min-h-25"
          >
            <template #actions="{ open: openFileSelect }">
              <UButton
                :label="$t('component.feedbackModal.selectImages')"
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
                  {{ $t('component.feedbackModal.attachmentCount', { count: files.length }) }}
                </p>
                <UButton
                  icon="i-lucide-plus"
                  :label="$t('component.feedbackModal.addMore')"
                  color="neutral"
                  variant="outline"
                  :disabled="!canAddMoreImages"
                  @click="openFileSelect()"
                />
              </div>
            </template>
          </UFileUpload>
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <!-- Action Buttons matching style of other modals -->
      <div class="flex justify-between items-center w-full">
        <UButton
          :label="$t('component.feedbackModal.history')"
          color="primary"
          variant="ghost"
          icon="i-lucide-history"
          to="/feedback"
          @click="() => { open = false }"
        />
        <div class="flex gap-2">
          <UButton
            :label="$t('common.cancel')"
            color="neutral"
            variant="outline"
            :disabled="saving"
            @click="() => { open = false }"
          />
          <UButton
            :label="$t('component.feedbackModal.send')"
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

const { t } = useI18n()
const open = defineModel<boolean>('open', { default: false })

const { screenshotFile, currentUrl } = useFeedback()

const schema = computed(() => z.object({
  type: z.string().min(1, t('component.feedbackModal.typeRequired')),
  description: z.string().min(1, t('component.feedbackModal.descriptionRequired')),
  images: z.array(z.any()).min(1, t('component.feedbackModal.minImage')).max(3, t('component.feedbackModal.maxImage'))
}))

const state = reactive({
  type: 'issue',
  description: '',
  images: [] as File[],
  url: ''
})

const items = computed(() => [
  { value: 'issue', label: t('component.feedbackModal.typeIssue') },
  { value: 'suggestion', label: t('component.feedbackModal.typeSuggestion') },
  { value: 'compliment', label: t('component.feedbackModal.typeCompliment') }
])

const canAddMoreImages = computed(() => {
  return (state.images?.length || 0) < 3
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
        title: t('component.feedbackModal.success'),
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
