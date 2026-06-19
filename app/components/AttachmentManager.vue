<template>
  <div class="space-y-2">
    <UFormField label="Attachments" name="attachments">
      <UFileUpload
        v-model="selectedFiles"
        layout="grid"
        multiple
        :interactive="false"
        class="w-full min-h-25"
        @update:model-value="handleFilesUpdate"
      >
        <template #actions="{ open: openFileSelect }">
          <div 
            class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-primary/50 transition-colors w-full cursor-pointer bg-neutral-50/50 dark:bg-neutral-900/30" 
            @click="openFileSelect()"
          >
            <UIcon name="i-lucide-upload" class="w-8 h-8 text-neutral-400 mb-2" />
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Upload Files</span>
            <span class="text-xs text-neutral-400 mt-1">Select any documents, images, or PDFs</span>
          </div>
        </template>

        <template #files-top="{ open: openFileSelect, files }">
          <div v-if="files?.length" class="mb-2 flex items-center justify-between w-full">
            <p class="font-bold text-sm text-neutral-800 dark:text-neutral-200">
              Uploaded Files ({{ files.length }})
            </p>
            <UButton
              icon="i-lucide-plus"
              label="Add more"
              color="neutral"
              variant="outline"
              size="xs"
              @click="openFileSelect()"
            />
          </div>
        </template>
      </UFileUpload>
    </UFormField>

    <!-- Uploading indicator -->
    <div v-if="isUploading" class="text-xs text-neutral-500 flex items-center gap-2 mt-1">
      <UIcon name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin text-primary" />
      <span>Uploading files...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { attachmentService } from "~/services/attachment-service"
import type { Attachment } from "~/types/attachment"

const props = defineProps<{
  modelValue: Attachment[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Attachment[]): void
  (e: 'change', attachmentIds: number[]): void
}>()

const isUploading = ref(false)
const selectedFiles = ref<any[]>([])

// Sync props.modelValue to selectedFiles
watch(() => props.modelValue, (newVal) => {
  const currentIds = selectedFiles.value.map(f => f.id).filter(Boolean)
  const incomingIds = newVal.map(a => a.id)
  
  if (JSON.stringify(currentIds) !== JSON.stringify(incomingIds)) {
    selectedFiles.value = newVal.map(att => ({
      id: att.id,
      name: att.originalName,
      size: att.size,
      type: att.mimeType,
      url: att.url,
      isUploaded: true
    }))
  }
}, { immediate: true, deep: true })

const deleteAttachment = async (id: number) => {
  const res = await attachmentService.delete(id)
  if (res.success) {
    const list = props.modelValue.filter(a => a.id !== id)
    emit('update:modelValue', list)
    emit('change', list.map(a => a.id))
  }
}

const handleFilesUpdate = async (newFiles: any[] | null | undefined) => {
  const files = newFiles || []
  // 1. Detect removals
  const newIds = files.map(f => f.id).filter(Boolean)
  const oldIds = props.modelValue.map(a => a.id)
  const removedIds = oldIds.filter(id => !newIds.includes(id))
  
  for (const id of removedIds) {
    await deleteAttachment(id)
  }

  // 2. Detect raw files to upload
  const filesToUpload = files.filter(f => !f.isUploaded)
  
  if (filesToUpload.length > 0) {
    isUploading.value = true
    try {
      const currentUploaded = props.modelValue.filter(a => newIds.includes(a.id))
      const newlyUploadedList: Attachment[] = []

      for (const item of filesToUpload) {
        // Resolve raw File object.
        const fileObj = item instanceof File ? item : item.file || item
        if (fileObj && (fileObj instanceof File)) {
          const res = await attachmentService.upload(fileObj)
          if (res.success && res.data) {
            newlyUploadedList.push(res.data)
          }
        }
      }

      const combined = [...currentUploaded, ...newlyUploadedList]
      emit('update:modelValue', combined)
      emit('change', combined.map(a => a.id))
    } finally {
      isUploading.value = false
    }
  } else {
    const currentUploaded = props.modelValue.filter(a => newIds.includes(a.id))
    emit('update:modelValue', currentUploaded)
    emit('change', currentUploaded.map(a => a.id))
  }
}
</script>
