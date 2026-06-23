<template>
  <div class="space-y-2">
    <UFormField :label="$t('component.attachment.title')" name="attachments">
      <UFileUpload
        v-model="selectedFiles"
        multiple
        :label="$t('component.attachment.chooseOrDrop')"
        :description="$t('component.attachment.selectHint')"
        class="w-full"
        @update:model-value="handleFilesUpdate"
      />
    </UFormField>

    <!-- Uploading indicator -->
    <div v-if="isUploading" class="text-xs text-neutral-500 flex items-center gap-2 mt-1">
      <UIcon name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin text-primary" />
      <span>{{ $t('component.attachment.uploading') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { attachmentService } from "~/services/attachment-service"
import type { Attachment } from "~/types/attachment"

// Patch URL.createObjectURL globally to return custom url property if present on mapped File objects
if (typeof window !== 'undefined' && window.URL) {
  const original = window.URL.createObjectURL
  // @ts-ignore
  if (!original.__patched) {
    const patched = function (obj: any) {
      if (obj && typeof obj === 'object' && 'url' in obj && obj.url) {
        return obj.url
      }
      return original(obj)
    }
    // @ts-ignore
    patched.__patched = true
    window.URL.createObjectURL = patched
  }
}

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
  if (!newVal) {
    selectedFiles.value = []
    return
  }
  const currentIds = selectedFiles.value.map(f => f.id).filter(Boolean)
  const incomingIds = newVal.map(a => a.id)
  
  if (JSON.stringify(currentIds) !== JSON.stringify(incomingIds)) {
    selectedFiles.value = newVal.map(att => {
      const file = new File([], att.originalName, { type: att.mimeType })
      Object.defineProperty(file, 'id', { value: att.id, writable: true, enumerable: true, configurable: true })
      Object.defineProperty(file, 'isUploaded', { value: true, writable: true, enumerable: true, configurable: true })
      Object.defineProperty(file, 'url', { value: att.url, writable: true, enumerable: true, configurable: true })
      Object.defineProperty(file, 'size', { value: att.size, writable: true, enumerable: true, configurable: true })
      return file
    })
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
