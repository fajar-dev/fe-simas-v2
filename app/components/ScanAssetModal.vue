<template>
  <UModal
    v-model:open="open"
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-end',
      header: 'hidden'
    }"
  >
    <template #body>
      <div class="w-full aspect-square bg-neutral-950 rounded-lg overflow-hidden relative flex items-center justify-center">
        <!-- Error State -->
        <div v-if="cameraError" class="p-6 text-center select-none flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
            <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
          </div>
          <p class="text-sm font-medium text-neutral-300">{{ cameraError }}</p>
          <UButton label="Try Again" icon="i-lucide-refresh-cw" size="xs" color="neutral" variant="outline" @click="cameraError = ''" />
        </div>

        <!-- Scanner -->
        <QrcodeStream
          v-if="!cameraError && open && !isSearching"
          :constraints="{ facingMode: 'environment' }"
          :formats="scanFormats"
          :track="paintBoundingBox"
          @detect="onDetect"
          @error="onCameraError"
          class="w-full h-full"
        />

        <!-- Scanning guide -->
        <div v-if="!cameraError && !isSearching" class="absolute inset-0 pointer-events-none">
          <div class="absolute left-0 right-0 h-0.5 bg-primary-400 shadow-[0_0_10px_rgba(var(--color-primary-400),0.7)] animate-[scanline_2s_ease-in-out_infinite]" />
        </div>

        <!-- Searching overlay -->
        <div v-if="isSearching" class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 z-10">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          <p class="text-sm text-white">Searching asset...</p>
          <p class="text-xs font-mono text-neutral-400">{{ lastScannedCode }}</p>
        </div>
      </div>

      <!-- Manual Input -->
      <div class="mt-4">
        <label class="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">Or enter code manually</label>
        <div class="flex items-center gap-2">
          <UInput
            v-model="manualCode"
            placeholder="Type asset code..."
            class="w-full"
            :disabled="isSearching"
            @keyup.enter="searchByCode(manualCode.trim())"
          />
          <UButton icon="i-lucide-search" color="primary" :disabled="!manualCode.trim() || isSearching" :loading="isSearching" @click="searchByCode(manualCode.trim())" />
        </div>
      </div>
    </template>

    <template #footer>
      <UButton label="Close" color="neutral" variant="outline" class="w-full justify-center" @click="open = false" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { QrcodeStream } from 'vue-qrcode-reader'
import type { DetectedBarcode } from 'vue-qrcode-reader'
import { assetService } from '~/services/asset-service'

const open = defineModel<boolean>({ default: false })

const scanFormats = [
  'qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8',
  'upc_a', 'upc_e', 'itf', 'codabar', 'code_93', 'data_matrix',
] as any

const manualCode = ref('')
const cameraError = ref('')
const isSearching = ref(false)
const lastScannedCode = ref('')
const toast = useToast()

watch(open, (val) => {
  if (val) {
    manualCode.value = ''
    cameraError.value = ''
    isSearching.value = false
    lastScannedCode.value = ''
  }
})

function paintBoundingBox(detectedCodes: DetectedBarcode[], ctx: CanvasRenderingContext2D) {
  for (const code of detectedCodes) {
    const box = code.boundingBox
    if (!box) continue
    ctx.lineWidth = 3
    ctx.strokeStyle = '#22c55e'
    ctx.strokeRect(box.x, box.y, box.width, box.height)
  }
}

function onDetect(detectedCodes: DetectedBarcode[]) {
  const first = detectedCodes[0]
  if (first?.rawValue && !isSearching.value) {
    searchByCode(first.rawValue)
  }
}

function onCameraError(err: Error) {
  if (err.name === 'NotAllowedError') {
    cameraError.value = 'Camera permission denied. Please allow access in your browser settings.'
  } else if (err.name === 'NotFoundError') {
    cameraError.value = 'No camera found on this device.'
  } else if (err.name === 'NotReadableError') {
    cameraError.value = 'Camera is already in use by another app.'
  } else {
    cameraError.value = `Camera error: ${err.message || err.name}`
  }
}

async function searchByCode(code: string) {
  if (!code || isSearching.value) return
  isSearching.value = true
  lastScannedCode.value = code

  try {
    const res = await assetService.getAll(1, 1, code)
    const asset = res.success && res.data.length > 0 ? res.data[0] : null
    if (asset?.code === code) {
      open.value = false
      navigateTo(`/asset/${asset.id}`)
    } else {
      toast.add({ title: `Asset "${code}" not found`, color: 'error', icon: 'i-lucide-circle-x' })
      isSearching.value = false
    }
  } catch {
    toast.add({ title: 'Failed to search asset', color: 'error', icon: 'i-lucide-circle-x' })
    isSearching.value = false
  }
}
</script>

<style>

</style>
