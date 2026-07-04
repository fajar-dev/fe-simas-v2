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
        <!-- Scan Mode Toggle -->
        <div class="flex items-center gap-1 mb-3 p-1 bg-neutral-100 rounded-lg">
          <button
            v-for="mode in scanModes"
            :key="mode.key"
            class="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-all cursor-pointer"
            :class="scanMode === mode.key
              ? 'bg-white text-primary shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'"
            @click="() => { scanMode = mode.key }"
          >
            <UIcon :name="mode.icon" class="w-3.5 h-3.5" />
            {{ mode.label }}
          </button>
        </div>

        <div class="w-full aspect-square bg-neutral-950 rounded-lg overflow-hidden relative flex items-center justify-center">
          <!-- Conventional Mode -->
          <template v-if="scanMode === 'conventional'">
            <div v-if="barcode.error.value" class="p-6 text-center select-none flex flex-col items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
              </div>
              <p class="text-sm font-medium text-neutral-300">{{ barcode.error.value }}</p>
              <UButton :label="$t('common.tryAgain')" icon="i-lucide-refresh-cw" size="xs" color="neutral" variant="outline" @click="barcode.reset()" />
            </div>

            <component
              :is="barcode.QrcodeStream"
              v-if="!barcode.error.value && open && activeTab === 'barcode' && scanMode === 'conventional'"
              :constraints="{ facingMode: 'environment' }"
              :formats="barcode.formats"
              :track="barcode.paintBoundingBox"
              @detect="onDetect"
              @error="barcode.onCameraError"
              class="w-full h-full"
            />

            <div v-if="!barcode.error.value" class="absolute inset-0 pointer-events-none">
              <div class="absolute left-0 right-0 h-0.5 bg-[#009838] animate-[scanline_2s_ease-in-out_infinite]" />
            </div>
          </template>

          <!-- AI Mode -->
          <template v-if="scanMode === 'ai'">
            <!-- AI Processing -->
            <div v-if="isAiProcessing" class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 z-10">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
              <p class="text-sm text-white">{{ $t('component.scanAsset.aiProcessing') }}</p>
            </div>

            <!-- Captured Preview -->
            <img v-if="aiCaptured" :src="aiCaptured" class="w-full h-full object-cover" alt="Captured" />

            <!-- Live Camera -->
            <template v-if="!aiCaptured">
              <video
                ref="aiVideoEl"
                class="w-full h-full object-cover"
                autoplay
                playsinline
                muted
              />
              <!-- Capture Circle Button -->
              <div class="absolute bottom-4 inset-x-0 flex justify-center z-10">
                <button
                  class="w-16 h-16 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform active:scale-90 hover:bg-white/30 cursor-pointer"
                  @click="captureAi"
                >
                  <div class="w-12 h-12 rounded-full bg-white" />
                </button>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- NFC Tab -->
      <div v-if="activeTab === 'nfc'">
        <div class="w-full aspect-square bg-neutral-950 rounded-lg overflow-hidden relative flex flex-col items-center justify-center">
          <div v-if="!nfc.isSupported.value" class="p-6 text-center select-none flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <UIcon name="i-lucide-smartphone-nfc" class="w-6 h-6 text-amber-400" />
            </div>
            <p class="text-sm font-medium text-neutral-300">{{ $t('component.asset.scannerModal.nfcNotSupported') }}</p>
            <p class="text-xs text-neutral-500">{{ $t('component.asset.scannerModal.nfcNotSupportedDesc') }}</p>
          </div>

          <div v-else-if="nfc.error.value" class="p-6 text-center select-none flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
              <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
            </div>
            <p class="text-sm font-medium text-neutral-300">{{ nfc.error.value }}</p>
            <UButton :label="$t('common.tryAgain')" icon="i-lucide-refresh-cw" size="xs" color="neutral" variant="outline" @click="startNfc" />
          </div>

          <template v-else>
            <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
              <UIcon name="i-lucide-smartphone-nfc" class="w-10 h-10 text-primary" />
            </div>
            <p class="text-sm font-medium text-white">{{ $t('component.asset.scannerModal.readyToScan') }}</p>
            <p class="text-xs text-neutral-400 mt-1">{{ $t('component.asset.scannerModal.holdNfc') }}</p>
          </template>
        </div>
      </div>

      <!-- Manual Tab -->
      <div v-if="activeTab === 'manual'">
        <div class="space-y-4">
          <div class="flex flex-col items-center gap-3 py-4">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UIcon name="i-lucide-keyboard" class="w-6 h-6 text-primary" />
            </div>
            <p class="text-sm text-neutral-500">{{ $t('component.asset.scannerModal.manualDesc') }}</p>
          </div>

          <!-- Error Message -->
          <div v-if="manualError" class="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error text-sm">
            <UIcon name="i-lucide-circle-x" class="w-4 h-4 shrink-0" />
            <span>{{ manualError }}</span>
          </div>

          <form @submit.prevent="onManualSubmit" class="flex gap-2">
            <UInput
              ref="manualInputRef"
              v-model="manualCode"
              :placeholder="$t('component.asset.scannerModal.manualPlaceholder')"
              class="flex-1"
              autofocus
            />
            <UButton
              type="submit"
              color="primary"
              icon="i-lucide-check"
              :disabled="!manualCode.trim()"
            >
              {{ $t('common.submit') }}
            </UButton>
          </form>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton :label="$t('common.close')" color="neutral" variant="outline" class="w-full justify-center" @click="() => { open = false }" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { DetectedBarcode } from 'vue-qrcode-reader'
import { aiService } from '~/services/ai-service'

const { t } = useI18n()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  scanned: [code: string]
}>()

const props = withDefaults(defineProps<{
  error?: string | null
  autoClose?: boolean
}>(), {
  autoClose: true
})

const tabs = computed(() => [
  { key: 'barcode', label: t('component.asset.scannerModal.barcode'), icon: 'i-lucide-scan' },
  { key: 'nfc', label: t('component.asset.scannerModal.nfc'), icon: 'i-lucide-smartphone-nfc' },
  { key: 'manual', label: t('component.asset.scannerModal.manual'), icon: 'i-lucide-keyboard' },
])
const activeTab = ref('barcode')

const scanModes = computed(() => [
  { key: 'conventional', label: t('component.scanAsset.conventional'), icon: 'i-lucide-scan-line' },
  { key: 'ai', label: t('component.scanAsset.withAi'), icon: 'i-lucide-sparkles' },
])
const scanMode = ref('conventional')

const manualCode = ref('')
const manualError = ref<string | null>(null)
const manualInputRef = ref<any>(null)

const barcode = useBarcodeScanner()
const nfc = useNfcReader()
const { playBeep } = useBeep()
const toast = useToast()

// AI Mode state
const aiVideoEl = ref<HTMLVideoElement | null>(null)
const aiStream = ref<MediaStream | null>(null)
const aiCaptured = ref('')
const aiCapturedFile = ref<File | null>(null)
const isAiProcessing = ref(false)

function switchTab(tab: string) {
  activeTab.value = tab
  manualError.value = null
  if (tab === 'nfc') startNfc()
  else nfc.stopScan()
  if (tab === 'manual') {
    manualCode.value = ''
    nextTick(() => manualInputRef.value?.inputRef?.focus())
  }
}

function onManualSubmit() {
  const code = manualCode.value.trim()
  if (!code) return
  manualError.value = null
  playBeep()
  emit('scanned', code)
  manualCode.value = ''
  if (props.autoClose) open.value = false
}

function startNfc() {
  nfc.startScan((serial, text) => {
    const code = text || serial
    if (code) {
      playBeep()
      emit('scanned', code)
      if (props.autoClose) open.value = false
    }
  })
}

// AI Camera
watch(scanMode, (mode) => {
  if (mode === 'ai') {
    initAiCamera()
  } else {
    stopAiStream()
    aiCaptured.value = ''
    aiCapturedFile.value = null
  }
})

async function initAiCamera() {
  aiCaptured.value = ''

  if (!navigator.mediaDevices?.getUserMedia) {
    toast.add({ title: 'Camera not supported', color: 'error', icon: 'i-lucide-circle-x' })
    return
  }

  try {
    stopAiStream()
    const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    aiStream.value = ms
    await nextTick()
    if (aiVideoEl.value) {
      aiVideoEl.value.srcObject = ms
      await aiVideoEl.value.play().catch(() => {})
    }
  } catch (err: any) {
    const msg = err.name === 'NotAllowedError' ? 'Camera permission denied' : `Camera error: ${err.message || err.name}`
    toast.add({ title: msg, color: 'error', icon: 'i-lucide-circle-x' })
  }
}

function stopAiStream() {
  aiStream.value?.getTracks().forEach(t => t.stop())
  aiStream.value = null
  if (aiVideoEl.value) aiVideoEl.value.srcObject = null
}

function captureAi() {
  const video = aiVideoEl.value
  if (!video) return

  const canvas = document.createElement('canvas')
  const vw = video.videoWidth
  const vh = video.videoHeight
  canvas.width = vw
  canvas.height = vh
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.drawImage(video, 0, 0, vw, vh)

  canvas.toBlob(async (blob) => {
    if (!blob) return
    const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' })
    aiCapturedFile.value = file
    aiCaptured.value = URL.createObjectURL(blob)
    stopAiStream()

    // Auto-process with AI
    await processAiScan(file)
  }, 'image/jpeg', 0.9)
}

async function processAiScan(file: File) {
  isAiProcessing.value = true

  try {
    const res = await aiService.decodeBarcode(file)
    if (res.success && res.data?.content) {
      playBeep()
      emit('scanned', res.data.content)
      if (props.autoClose) open.value = false
    } else {
      toast.add({ title: res.message || 'Failed to decode', color: 'error', icon: 'i-lucide-circle-x' })
    }
  } finally {
    isAiProcessing.value = false
    // Always reopen camera for next scan
    if (aiCaptured.value) URL.revokeObjectURL(aiCaptured.value)
    aiCaptured.value = ''
    aiCapturedFile.value = null
    if (open.value && scanMode.value === 'ai') {
      initAiCamera()
    }
  }
}

watch(open, (val) => {
  if (val) {
    activeTab.value = 'barcode'
    scanMode.value = 'conventional'
    barcode.reset()
    nfc.stopScan()
    manualCode.value = ''
    manualError.value = null
    aiCaptured.value = ''
    isAiProcessing.value = false
  } else {
    nfc.stopScan()
    stopAiStream()
  }
})

// Watch for error prop from parent (e.g. 404)
watch(() => props.error, (err) => {
  if (err) {
    manualError.value = err
    manualCode.value = ''
    nextTick(() => manualInputRef.value?.inputRef?.focus())
  }
})

function onDetect(detectedCodes: DetectedBarcode[]) {
  const first = detectedCodes[0]
  if (first?.rawValue) {
    playBeep()
    emit('scanned', first.rawValue)
    if (props.autoClose) open.value = false
  }
}

onBeforeUnmount(() => {
  stopAiStream()
  if (aiCaptured.value) URL.revokeObjectURL(aiCaptured.value)
})
</script>

<style>
@keyframes scanline {
  0%, 100% { top: 0; }
  50% { top: calc(100% - 2px); }
}
</style>
