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
              <UIcon name="i-lucide-file-spreadsheet" class="w-8 h-8 text-emerald-600" />
              <div>
                <p class="text-sm font-medium text-neutral-700">Download Template</p>
                <p class="text-xs text-neutral-500">Use this template for importing</p>
              </div>
            </div>
            <UButton
              color="primary"
              variant="soft"
              icon="i-lucide-download"
              :loading="isDownloading"
              @click="downloadTemplate"
            >
              Download
            </UButton>
          </div>
        </div>

        <!-- File Upload Area (same pattern as Create Asset image upload) -->
        <div>
          <label class="text-sm font-medium text-neutral-700 mb-1.5 block">File</label>
          <div v-if="selectedFile" class="relative p-3 border border-neutral-200 rounded-lg">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-file-check-2" class="w-8 h-8 text-emerald-600 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-neutral-700 truncate">{{ selectedFile.name }}</p>
                <p class="text-xs text-neutral-500">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
            </div>
            <UButton icon="i-lucide-x" color="error" variant="solid" size="xs" class="absolute top-1 right-1 rounded-full" @click="clearFile" />
          </div>
          <div 
            v-else 
            class="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-neutral-200 rounded-lg cursor-pointer hover:border-primary transition-colors"
            @click="triggerFileInput"
          >
            <UIcon name="i-lucide-upload" class="w-8 h-8 text-neutral-400 mb-2" />
            <span class="text-sm text-neutral-500">Drop your Excel file here</span>
            <span class="text-xs text-neutral-400 mt-1">.xlsx, .xls</span>
          </div>
          <input ref="fileInputRef" type="file" class="hidden" accept=".xlsx,.xls" @change="onFileChange" />
        </div>

        <!-- Import Result -->
        <div v-if="importResult" class="space-y-3">
          <UAlert
            :color="importResult.errors.length > 0 ? 'warning' : 'success'"
            :icon="importResult.errors.length > 0 ? 'i-lucide-alert-triangle' : 'i-lucide-check-circle'"
            variant="soft"
            :title="`${importResult.success} successful, ${importResult.errors.length} failed`"
          />

          <!-- Error detail table -->
          <div v-if="importResult.errors.length > 0">
            <div class="border border-neutral-200 rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-neutral-100">
                    <th class="text-left px-3 py-2 font-semibold text-neutral-600 w-16">Row</th>
                    <th class="text-left px-3 py-2 font-semibold text-neutral-600">Error</th>
                  </tr>
                </thead>
              </table>
              <div class="max-h-48 overflow-y-auto">
                <table class="w-full text-sm">
                  <tbody>
                    <tr v-for="err in importResult.errors" :key="err.row" class="border-t border-neutral-100">
                      <td class="px-3 py-2 font-semibold text-neutral-500 w-16">{{ err.row }}</td>
                      <td class="px-3 py-2 text-neutral-700">{{ err.message }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    selectedFile.value = input.files[0]
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
