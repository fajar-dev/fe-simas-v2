<template>
  <UModal 
    :title="$t('component.assetNote.addModal.title')"
    :description="$t('component.assetNote.addModal.description')"
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="add-note-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
        <!-- Asset Field -->
        <UFormField v-if="!lockAssetId" :label="$t('common.asset')" name="assetId" required>
          <USelectMenu
            v-model="selectedAsset"
            :items="assetOptions"
            searchable
            :searchable-placeholder="$t('component.assetNote.addModal.searchAssets')"
            :placeholder="$t('component.assetNote.addModal.selectAsset')"
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
          <UTextarea v-model="form.note" :placeholder="$t('component.assetNote.addModal.notePlaceholder')" class="w-full" :rows="3" />
        </UFormField>

        <!-- Labels -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('common.labels') }}</label>
            <UButton icon="i-lucide-plus" color="primary" variant="soft" size="xs" @click="addLabel">{{ $t('common.add') }}</UButton>
          </div>
          <div v-if="formLabels.length === 0" class="text-sm text-neutral-400 py-3 text-center border border-dashed border-neutral-200 rounded-lg">
            {{ $t('pages.asset.create.noLabels') }}
          </div>
          <div v-else class="space-y-2">
            <div v-for="(label, index) in formLabels" :key="index" class="flex items-center gap-2">
              <UInput v-model="label.key" placeholder="Key" class="w-full" />
              <UInput v-model="label.value" placeholder="Value" class="w-full" />
              <UButton icon="i-lucide-trash" color="error" variant="soft" size="sm" square @click="() => { formLabels.splice(index, 1) }" />
            </div>
          </div>
        </div>

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
          form="add-note-form"
          color="primary"
          :loading="isSubmitting"
        >
          {{ $t('component.assetNote.addModal.submit') }}
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
import type { AssetNotePayload } from '~/types/asset-note'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  lockAssetId?: number
}>()

const emit = defineEmits<{ created: [] }>()
const toast = useToast()

// State
const isSubmitting = ref(false)
const isLoadingAssets = ref(false)
const assetOptions = ref<{ label: string; value: number }[]>([])
const selectedAsset = ref<{ label: string; value: number } | undefined>(undefined)
const uploadedAttachments = ref<Attachment[]>([])
const formLabels = ref<{ key: string; value: string }[]>([])
const addLabel = () => { formLabels.value.push({ key: '', value: '' }) }

const schema = z.object({
  assetId: z.number(),
  date: z.string().min(1, t('component.assetNote.addModal.dateRequired')),
  note: z.string().min(1, t('component.assetNote.addModal.noteRequired')),
})

const form = reactive<AssetNotePayload>({
  assetId: undefined as unknown as number,
  date: new Date().toISOString().split('T')[0] || '',
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
    }
  } finally {
    isLoadingAssets.value = false
  }
}

const resetForm = () => {
  form.assetId = props.lockAssetId ? props.lockAssetId : (undefined as unknown as number)
  form.date = new Date().toISOString().split('T')[0] || ''
  form.note = ''
  form.attachmentIds = []
  selectedAsset.value = undefined
  uploadedAttachments.value = []
  formLabels.value = []
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const filteredLabels = formLabels.value.filter(l => l.key.trim() && l.value.trim())
    const response = await assetNoteService.create({ ...form, labels: filteredLabels })
    if (response.success) {
      toast.add({
        title: t('component.assetNote.addModal.success'),
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
    if (props.lockAssetId) {
      form.assetId = props.lockAssetId
    } else {
      loadAssets()
    }
  }
})
</script>
