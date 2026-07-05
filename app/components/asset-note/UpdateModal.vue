<template>
  <UModal 
    :title="$t('component.assetNote.updateModal.title')"
    :description="$t('component.assetNote.updateModal.description')"
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="update-note-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
        <!-- Asset Field -->
        <UFormField v-if="!lockAssetId" :label="$t('common.asset')" name="assetId" required>
          <USelectMenu
            v-model="selectedAsset"
            :items="assetOptions"
            searchable
            :searchable-placeholder="$t('component.assetNote.updateModal.searchAssets')"
            :placeholder="$t('component.assetNote.updateModal.selectAsset')"
            :loading="isLoadingAssets"
            class="w-full"
          />
        </UFormField>

        <!-- Date Field -->
        <UFormField :label="$t('common.date')" name="date" required>
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
        <UFormField :label="$t('common.note')" name="note" required>
          <UTextarea v-model="form.note" :placeholder="$t('component.assetNote.updateModal.notePlaceholder')" class="w-full" :rows="3" />
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
        <UButton :label="$t('common.cancel')" @click="() => { open = false }" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="update-note-form"
          color="primary"
          :loading="isSubmitting"
        >
          {{ $t('component.assetNote.updateModal.submit') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { parseDate } from '@internationalized/date'
import { assetNoteService } from '~/services/asset-note-service'
import { assetService } from '~/services/asset-service'
import type { AssetNote, AssetNotePayload } from '~/types/asset-note'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  note: AssetNote | null
  lockAssetId?: number
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()

// State
const isSubmitting = ref(false)
const isLoadingAssets = ref(false)
const assetOptions = ref<{ label: string; value: number }[]>([])
const selectedAsset = ref<{ label: string; value: number } | undefined>(undefined)
const uploadedAttachments = ref<Attachment[]>([])

const schema = z.object({
  assetId: z.number(),
  date: z.string().min(1, t('component.assetNote.updateModal.dateRequired')),
  note: z.string().min(1, t('component.assetNote.updateModal.noteRequired')),
})

const form = reactive<AssetNotePayload>({
  assetId: undefined as unknown as number,
  date: '',
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
      
      // Populate selectedAsset from props.note after assets are loaded
      if (props.note) {
        const matched = assetOptions.value.find(o => o.value === props.note?.assetId)
        if (matched) selectedAsset.value = matched
      }
    }
  } finally {
    isLoadingAssets.value = false
  }
}

const populateForm = () => {
  if (!props.note) return

  form.assetId = props.note.assetId
  form.date = props.note.date
  form.note = props.note.note || ''
  form.attachmentIds = props.note.attachments?.map(a => a.id) || []
  uploadedAttachments.value = props.note.attachments || []

  if (!props.lockAssetId) {
    const matched = assetOptions.value.find(o => o.value === props.note?.assetId)
    selectedAsset.value = matched || undefined
  }
}

const handleSubmit = async () => {
  if (!props.note) return
  isSubmitting.value = true
  try {
    const response = await assetNoteService.update(props.note.id, form)
    if (response.success) {
      toast.add({
        title: t('component.assetNote.updateModal.success'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('updated')
      open.value = false
    }
  } finally {
    isSubmitting.value = false
  }
}

watch([open, () => props.note], async ([isOpen, currentNote]) => {
  if (isOpen && currentNote) {
    if (props.lockAssetId) {
      form.assetId = props.lockAssetId
    } else {
      await loadAssets()
    }
    populateForm()
  }
}, { immediate: true })
</script>
