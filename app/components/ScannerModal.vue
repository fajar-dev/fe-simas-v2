<template>
  <UModal
    v-model:open="open"
    title="Scan Barcode / QR Code"
    description="Point your camera at a barcode or QR code to scan."
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <div class="w-full aspect-square bg-neutral-950 rounded-lg overflow-hidden relative flex items-center justify-center">
        <!-- Error State -->
        <div v-if="error" class="p-6 text-center select-none flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
            <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
          </div>
          <p class="text-sm font-medium text-neutral-300">{{ error }}</p>
          <UButton label="Try Again" icon="i-lucide-refresh-cw" size="xs" color="neutral" variant="outline" @click="error = ''" />
        </div>

        <!-- Scanner -->
        <QrcodeStream
          v-if="!error && open"
          :constraints="{ facingMode: 'environment' }"
          :formats="scanFormats"
          :track="paintBoundingBox"
          @detect="onDetect"
          @error="onCameraError"
          class="w-full h-full"
        />

        <!-- Loading overlay -->
        <div v-if="!error && !scannedValue" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div class="w-48 h-48 border-2 border-primary/50 rounded-2xl animate-pulse" />
          <span class="text-xs text-neutral-400 mt-3">Scanning...</span>
        </div>

        <!-- Success overlay -->
        <div v-if="scannedValue" class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-10">
          <div class="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
            <UIcon name="i-lucide-check" class="w-7 h-7 text-green-400" />
          </div>
          <p class="text-sm font-semibold text-white">Code Detected</p>
          <p class="text-lg font-mono text-green-400 px-4 py-2 bg-neutral-900/80 rounded-lg border border-neutral-700 max-w-full truncate">
            {{ scannedValue }}
          </p>
        </div>
      </div>

      <!-- Manual Input -->
      <div class="mt-4">
        <label class="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1.5">Or enter code manually</label>
        <div class="flex items-center gap-2">
          <UInput
            v-model="manualCode"
            placeholder="Type or paste code..."
            class="w-full"
            @keyup.enter="submitManual"
          />
          <UButton icon="i-lucide-arrow-right" color="primary" :disabled="!manualCode.trim()" @click="submitManual" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center gap-3 w-full">
        <UButton label="Cancel" color="neutral" variant="outline" class="flex-1 justify-center" @click="open = false" />
        <UButton
          v-if="scannedValue"
          label="Use Code"
          icon="i-lucide-check"
          color="primary"
          class="flex-1 justify-center"
          @click="confirmScanned"
        />
        <UButton
          v-if="scannedValue"
          label="Scan Again"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          size="sm"
          @click="resetScan"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { QrcodeStream } from 'vue-qrcode-reader'
import type { DetectedBarcode } from 'vue-qrcode-reader'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  scanned: [code: string]
}>()

const scanFormats = [
  'qr_code',
  'code_128',
  'code_39',
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'itf',
  'codabar',
  'code_93',
  'data_matrix',
] as any

const scannedValue = ref('')
const manualCode = ref('')
const error = ref('')

watch(open, (val) => {
  if (val) {
    scannedValue.value = ''
    manualCode.value = ''
    error.value = ''
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
  if (first?.rawValue) {
    scannedValue.value = first.rawValue
  }
}

function onCameraError(err: Error) {
  if (err.name === 'NotAllowedError') {
    error.value = 'Camera permission denied. Please allow access in your browser settings.'
  } else if (err.name === 'NotFoundError') {
    error.value = 'No camera found on this device.'
  } else if (err.name === 'NotReadableError') {
    error.value = 'Camera is already in use by another app.'
  } else {
    error.value = `Camera error: ${err.message || err.name}`
  }
}

function confirmScanned() {
  if (scannedValue.value) {
    emit('scanned', scannedValue.value)
    open.value = false
  }
}

function submitManual() {
  const code = manualCode.value.trim()
  if (code) {
    emit('scanned', code)
    open.value = false
  }
}

function resetScan() {
  scannedValue.value = ''
}
</script>
