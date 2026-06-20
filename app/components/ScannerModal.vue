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

        <!-- Scanning guide -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-400 to-transparent rounded-full shadow-[0_0_10px_rgba(var(--color-primary-400),0.7)] animate-[scanline_2s_ease-in-out_infinite]" />
        </div>
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

const error = ref('')

watch(open, (val) => {
  if (val) {
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
    emit('scanned', first.rawValue)
    open.value = false
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
</script>

<style>
@keyframes scanline {
  0%, 100% { top: 0; }
  50% { top: calc(100% - 2px); }
}
</style>
