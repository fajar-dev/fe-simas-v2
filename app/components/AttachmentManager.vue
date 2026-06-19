<template>
  <div class="space-y-4">
    <!-- Upload Trigger Button -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Attachments
      </span>
      <UButton
        label="Upload Files"
        icon="i-lucide-upload"
        color="neutral"
        variant="subtle"
        size="xs"
        :loading="isUploading"
        @click="triggerFileSelect"
      />
      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="hidden"
        @change="handleFileChange"
      />
    </div>

    <!-- Uploading States -->
    <div v-if="isUploading" class="text-xs text-neutral-500 flex items-center gap-2">
      <UIcon name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin text-primary" />
      <span>Uploading files...</span>
    </div>

    <!-- Uploaded Attachments List -->
    <div v-if="modelValue.length === 0" class="text-xs text-neutral-400 py-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
      No attachments uploaded yet
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="attachment in modelValue"
        :key="attachment.id"
        class="flex items-center justify-between p-2 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
      >
        <div class="flex items-center gap-3 min-w-0">
          <UIcon :name="getFileIcon(attachment.mimeType)" class="w-5 h-5 text-neutral-400 shrink-0" />
          <div class="flex flex-col min-w-0">
            <a
              :href="attachment.url"
              target="_blank"
              class="text-xs font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary hover:underline truncate"
            >
              {{ attachment.originalName }}
            </a>
            <span class="text-[10px] text-neutral-400">
              {{ formatBytes(attachment.size) }}
            </span>
          </div>
        </div>
        
        <!-- Delete Button -->
        <UButton
          icon="i-lucide-trash"
          color="error"
          variant="ghost"
          size="xs"
          square
          @click="deleteAttachment(attachment.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { attachmentService } from "~/services/attachment-service"
import type { Attachment } from "~/types/attachment"

const props = defineProps<{
  modelValue: Attachment[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Attachment[]): void
  (e: 'change', attachmentIds: number[]): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  isUploading.value = true
  const list = [...props.modelValue]

  try {
    for (let i = 0; i < target.files.length; i++) {
      const file = target.files[i]
      if (file) {
        const res = await attachmentService.upload(file)
        if (res.success && res.data) {
          list.push(res.data)
        }
      }
    }
    emit('update:modelValue', list)
    emit('change', list.map(a => a.id))
  } finally {
    isUploading.value = false
    if (fileInputRef.value) {
      fileInputRef.value.value = ""
    }
  }
}

const deleteAttachment = async (id: number) => {
  // Opting for immediate deletion to keep draft/orphan cleanups robust
  const res = await attachmentService.delete(id)
  if (res.success) {
    const list = props.modelValue.filter(a => a.id !== id)
    emit('update:modelValue', list)
    emit('change', list.map(a => a.id))
  }
}

// Helpers
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const getFileIcon = (mimeType: string) => {
  if (!mimeType) return 'i-lucide-file'
  if (mimeType.startsWith('image/')) return 'i-lucide-image'
  if (mimeType.includes('pdf')) return 'i-lucide-file-text'
  if (mimeType.includes('word') || mimeType.includes('officedocument')) return 'i-lucide-file-text'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return 'i-lucide-archive'
  return 'i-lucide-file'
}
</script>
