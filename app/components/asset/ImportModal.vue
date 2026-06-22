<template>
  <UModal 
    title="Import Assets"
    description="Upload an Excel file to import assets in bulk."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <div class="space-y-4">

        <!-- Download Template -->
        <div class="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-file-spreadsheet" class="w-5 h-5 text-emerald-600" />
              <div>
                <p class="text-sm font-medium text-neutral-700">Download Template</p>
                <p class="text-xs text-neutral-500">Use this template for importing</p>
              </div>
            </div>
            <UButton
              color="primary"
              variant="soft"
              size="xs"
              icon="i-lucide-download"
              :loading="isDownloading"
              @click="downloadTemplate"
            >
              Download
            </UButton>
          </div>
        </div>

        <!-- File Upload Area -->
        <div
          class="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
          :class="isDragOver ? 'border-primary bg-primary/5' : 'border-neutral-300 hover:border-neutral-400'"
          @click="triggerFileInput"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".xlsx,.xls"
            class="hidden"
            @change="handleFileSelect"
          />
          <div v-if="!selectedFile" class="space-y-2">
            <UIcon name="i-lucide-upload-cloud" class="w-10 h-10 text-neutral-400 mx-auto" />
            <p class="text-sm text-neutral-600">
              <span class="text-primary font-medium">Click to upload</span> or drag and drop
            </p>
            <p class="text-xs text-neutral-400">Excel files only (.xlsx, .xls)</p>
          </div>
          <div v-else class="flex items-center justify-center gap-3">
            <UIcon name="i-lucide-file-check-2" class="w-8 h-8 text-emerald-600 shrink-0" />
            <div class="text-left min-w-0">
              <p class="text-sm font-medium text-neutral-700 truncate">{{ selectedFile.name }}</p>
              <p class="text-xs text-neutral-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="xs"
              @click.stop="clearFile"
            />
          </div>
        </div>

        <!-- Import Result -->
        <div v-if="importResult" class="space-y-2">
          <div class="flex items-center gap-2 text-sm">
            <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-emerald-600" />
            <span class="text-emerald-700 font-medium">{{ importResult.success }} assets imported successfully</span>
          </div>
          <div v-if="importResult.errors.length > 0" class="bg-error/5 border border-error/20 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-error" />
              <span class="text-sm font-medium text-error">{{ importResult.errors.length }} errors</span>
            </div>
            <div class="max-h-32 overflow-y-auto space-y-1">
              <p v-for="err in importResult.errors" :key="err.row" class="text-xs text-neutral-600">
                <span class="font-medium">Row {{ err.row }}:</span> {{ err.message }}
              </p>
            </div>
          </div>
        </div>

      </div>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton label="Cancel" @click="open = false" color="neutral" variant="outline" />
        <UButton
          v-if="!importResult"
          color="primary"
          icon="i-lucide-upload"
          :loading="isImporting"
          :disabled="!selectedFile"
          @click="handleImport"
        >
          Import
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { assetService } from '~/services/asset-service'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ imported: [] }>()
const toast = useToast()

const fileInputRef = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const isImporting = ref(false)
const isDownloading = ref(false)
const importResult = ref<{ success: number; errors: { row: number; message: string }[] } | null>(null)

const resetState = () => {
  selectedFile.value = null
  importResult.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

watch(open, (val) => {
  if (!val) resetState()
})

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    selectedFile.value = input.files[0]
    importResult.value = null
  }
}

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    selectedFile.value = file
    importResult.value = null
  }
}

const clearFile = () => {
  selectedFile.value = null
  importResult.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const downloadTemplate = async () => {
  isDownloading.value = true
  try {
    await assetService.downloadImportTemplate()
  } finally {
    isDownloading.value = false
  }
}

const handleImport = async () => {
  if (!selectedFile.value) return
  isImporting.value = true
  try {
    const result = await assetService.importExcel(selectedFile.value)
    if (result.success) {
      importResult.value = result.data
      if (result.data.success > 0) {
        toast.add({
          title: `${result.data.success} assets imported successfully!`,
          color: 'success',
          icon: 'i-lucide-circle-check'
        })
        emit('imported')
      }
    }
  } finally {
    isImporting.value = false
  }
}
</script>
