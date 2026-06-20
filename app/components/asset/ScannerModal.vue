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
      <!-- Tabs -->
      <div class="flex border-b border-neutral-200 mb-4">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer"
          :class="activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-neutral-500 hover:text-neutral-700'"
          @click="switchTab(tab.key)"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Barcode Tab -->
      <div v-if="activeTab === 'barcode'">
        <div class="w-full aspect-square bg-neutral-950 rounded-lg overflow-hidden relative flex items-center justify-center">
          <div v-if="error" class="p-6 text-center select-none flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
              <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
            </div>
            <p class="text-sm font-medium text-neutral-300">{{ error }}</p>
            <UButton label="Try Again" icon="i-lucide-refresh-cw" size="xs" color="neutral" variant="outline" @click="error = ''" />
          </div>

          <QrcodeStream
            v-if="!error && open && activeTab === 'barcode'"
            :constraints="{ facingMode: 'environment' }"
            :formats="scanFormats"
            :track="paintBoundingBox"
            @detect="onDetect"
            @error="onCameraError"
            class="w-full h-full"
          />

          <div v-if="!error" class="absolute inset-0 pointer-events-none">
            <div class="absolute left-0 right-0 h-0.5 bg-[#009838] animate-[scanline_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>

      <!-- NFC Tab -->
      <div v-if="activeTab === 'nfc'">
        <div class="w-full aspect-square bg-neutral-950 rounded-lg overflow-hidden relative flex flex-col items-center justify-center">
          <!-- NFC Not Supported -->
          <div v-if="!nfc.isSupported.value" class="p-6 text-center select-none flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <UIcon name="i-lucide-smartphone-nfc" class="w-6 h-6 text-amber-400" />
            </div>
            <p class="text-sm font-medium text-neutral-300">NFC not supported</p>
            <p class="text-xs text-neutral-500">NFC is only available on Android Chrome with HTTPS.</p>
          </div>

          <!-- NFC Error -->
          <div v-else-if="nfc.error.value" class="p-6 text-center select-none flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
              <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
            </div>
            <p class="text-sm font-medium text-neutral-300">{{ nfc.error.value }}</p>
            <UButton label="Try Again" icon="i-lucide-refresh-cw" size="xs" color="neutral" variant="outline" @click="startNfc" />
          </div>

          <!-- NFC Scanning -->
          <template v-else>
            <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
              <UIcon name="i-lucide-smartphone-nfc" class="w-10 h-10 text-primary" />
            </div>
            <p class="text-sm font-medium text-white">Ready to scan</p>
            <p class="text-xs text-neutral-400 mt-1">Hold NFC tag near your device</p>
          </template>
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

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  scanned: [code: string]
}>()

const tabs = [
  { key: 'barcode', label: 'Barcode', icon: 'i-lucide-scan' },
  { key: 'nfc', label: 'NFC', icon: 'i-lucide-smartphone-nfc' },
]
const activeTab = ref('barcode')

const scanFormats = [
  'qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8',
  'upc_a', 'upc_e', 'itf', 'codabar', 'code_93', 'data_matrix',
] as any

const error = ref('')

// NFC
const nfc = useNfcReader()

function switchTab(tab: string) {
  activeTab.value = tab
  if (tab === 'nfc') {
    startNfc()
  } else {
    nfc.stopScan()
  }
}

function startNfc() {
  nfc.startScan((serial, text) => {
    const code = text || serial
    if (code) {
      emit('scanned', code)
      open.value = false
    }
  })
}

watch(open, (val) => {
  if (val) {
    activeTab.value = 'barcode'
    error.value = ''
    nfc.stopScan()
  } else {
    nfc.stopScan()
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
