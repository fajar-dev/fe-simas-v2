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
          <div v-if="barcode.error.value" class="p-6 text-center select-none flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
              <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
            </div>
            <p class="text-sm font-medium text-neutral-300">{{ barcode.error.value }}</p>
            <UButton label="Try Again" icon="i-lucide-refresh-cw" size="xs" color="neutral" variant="outline" @click="barcode.reset()" />
          </div>

          <component
            :is="barcode.QrcodeStream"
            v-if="!barcode.error.value && open && !isSearching && activeTab === 'barcode'"
            :constraints="{ facingMode: 'environment' }"
            :formats="barcode.formats"
            :track="barcode.paintBoundingBox"
            @detect="onDetect"
            @error="barcode.onCameraError"
            class="w-full h-full"
          />

          <div v-if="!barcode.error.value && !isSearching" class="absolute inset-0 pointer-events-none">
            <div class="absolute left-0 right-0 h-0.5 bg-[#009838] animate-[scanline_2s_ease-in-out_infinite]" />
          </div>

          <div v-if="isSearching" class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 z-10">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
            <p class="text-sm text-white">Searching asset...</p>
            <p class="text-xs font-mono text-neutral-400">{{ lastScannedCode }}</p>
          </div>
        </div>
      </div>

      <!-- NFC Tab -->
      <div v-if="activeTab === 'nfc'">
        <div class="w-full aspect-square bg-neutral-950 rounded-lg overflow-hidden relative flex flex-col items-center justify-center">
          <div v-if="!nfc.isSupported.value" class="p-6 text-center select-none flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <UIcon name="i-lucide-smartphone-nfc" class="w-6 h-6 text-amber-400" />
            </div>
            <p class="text-sm font-medium text-neutral-300">NFC not supported</p>
            <p class="text-xs text-neutral-500">NFC is only available on Android Chrome with HTTPS.</p>
          </div>

          <div v-else-if="nfc.error.value" class="p-6 text-center select-none flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
              <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
            </div>
            <p class="text-sm font-medium text-neutral-300">{{ nfc.error.value }}</p>
            <UButton label="Try Again" icon="i-lucide-refresh-cw" size="xs" color="neutral" variant="outline" @click="startNfc" />
          </div>

          <div v-else-if="isSearching" class="p-6 text-center flex flex-col items-center gap-3">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
            <p class="text-sm text-white">Searching asset...</p>
            <p class="text-xs font-mono text-neutral-400">{{ lastScannedCode }}</p>
          </div>

          <template v-else>
            <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
              <UIcon name="i-lucide-smartphone-nfc" class="w-10 h-10 text-primary" />
            </div>
            <p class="text-sm font-medium text-white">Ready to scan</p>
            <p class="text-xs text-neutral-400 mt-1">Hold NFC tag near your device</p>
          </template>
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
import type { DetectedBarcode } from 'vue-qrcode-reader'
import { assetService } from '~/services/asset-service'

const open = defineModel<boolean>({ default: false })

const tabs = [
  { key: 'barcode', label: 'Barcode', icon: 'i-lucide-scan' },
  { key: 'nfc', label: 'NFC', icon: 'i-lucide-smartphone-nfc' },
]
const activeTab = ref('barcode')

const manualCode = ref('')
const isSearching = ref(false)
const lastScannedCode = ref('')
const toast = useToast()

const barcode = useBarcodeScanner()
const nfc = useNfcReader()

function switchTab(tab: string) {
  activeTab.value = tab
  if (tab === 'nfc') startNfc()
  else nfc.stopScan()
}

function startNfc() {
  nfc.startScan((serial, text) => {
    const code = text || serial
    if (code) searchByCode(code)
  })
}

watch(open, (val) => {
  if (val) {
    activeTab.value = 'barcode'
    manualCode.value = ''
    barcode.reset()
    isSearching.value = false
    lastScannedCode.value = ''
    nfc.stopScan()
  } else {
    nfc.stopScan()
  }
})

function onDetect(detectedCodes: DetectedBarcode[]) {
  const first = detectedCodes[0]
  if (first?.rawValue && !isSearching.value) {
    searchByCode(first.rawValue)
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
@keyframes scanline {
  0%, 100% { top: 0; }
  50% { top: calc(100% - 2px); }
}
</style>
