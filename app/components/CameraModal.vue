<template>
  <UModal
    v-model:open="open"
    title="Take Photo"
    description="Capture an asset photo using your camera."
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <!-- Camera / Preview -->
      <div class="w-full aspect-square bg-neutral-950 rounded-lg overflow-hidden relative flex items-center justify-center">
        <!-- Error State -->
        <div v-if="error" class="p-6 text-center select-none flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
            <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
          </div>
          <p class="text-sm font-medium text-neutral-300">{{ error }}</p>
          <UButton label="Try Again" icon="i-lucide-refresh-cw" size="xs" color="neutral" variant="outline" @click="initCamera" />
        </div>

        <!-- Loading -->
        <div v-else-if="loading && !captured" class="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/80 gap-2 select-none z-10">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          <span class="text-sm text-white">Initializing camera...</span>
        </div>

        <!-- Live Video -->
        <video
          v-show="!captured && !error"
          ref="videoEl"
          class="w-full h-full object-cover"
          autoplay
          playsinline
          muted
        />

        <!-- Captured Preview -->
        <img v-if="captured" :src="captured" class="w-full h-full object-cover" alt="Captured photo" />

        <!-- Switch Camera -->
        <UButton
          v-if="!captured && !error && cameras.length > 1"
          icon="i-lucide-switch-camera"
          color="neutral"
          variant="solid"
          size="xs"
          square
          class="absolute top-2 right-2 rounded-full bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-700 text-white"
          @click="switchCamera"
        />
      </div>

      <!-- Shutter (only in live mode) -->
      <div v-if="!captured && !error" class="flex justify-center pt-4">
        <UButton
          icon="i-lucide-circle"
          size="xl"
          color="primary"
          variant="solid"
          class="rounded-full !p-3"
          :disabled="loading"
          @click="capture"
        />
      </div>
    </template>

    <template #footer>
      <template v-if="captured">
        <UButton
          label="Retake"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          @click="retake"
        />
        <UButton
          label="Use Photo"
          icon="i-lucide-check"
          color="primary"
          @click="usePhoto"
        />
      </template>
      <template v-else>
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="open = false"
        />
      </template>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ captured: [file: File] }>()

const videoEl = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const cameras = ref<MediaDeviceInfo[]>([])
const cameraIdx = ref(0)
const captured = ref('')
const capturedFile = ref<File | null>(null)
const error = ref('')
const loading = ref(false)

watch(open, (val) => {
  if (val) {
    captured.value = ''
    capturedFile.value = null
    error.value = ''
    cameraIdx.value = 0
    initCamera()
  } else {
    stopStream()
  }
})

async function initCamera() {
  loading.value = true
  error.value = ''

  if (!navigator.mediaDevices?.getUserMedia) {
    error.value = 'Camera not supported. HTTPS is required.'
    loading.value = false
    return
  }

  try {
    stopStream()

    const allDevices = await navigator.mediaDevices.enumerateDevices()
    cameras.value = allDevices.filter(d => d.kind === 'videoinput')

    const deviceId = cameras.value[cameraIdx.value]?.deviceId
    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: 'environment' }
    }

    const ms = await navigator.mediaDevices.getUserMedia(constraints)
    stream.value = ms

    await nextTick()
    if (videoEl.value) {
      videoEl.value.srcObject = ms
      await videoEl.value.play().catch(() => {})
    }
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      error.value = 'Camera permission denied. Please allow access in your browser settings.'
    } else if (err.name === 'NotFoundError') {
      error.value = 'No camera found on this device.'
    } else {
      error.value = `Camera error: ${err.message || err.name}`
    }
  } finally {
    loading.value = false
  }
}

function stopStream() {
  stream.value?.getTracks().forEach(t => t.stop())
  stream.value = null
  if (videoEl.value) videoEl.value.srcObject = null
}

async function switchCamera() {
  cameraIdx.value = (cameraIdx.value + 1) % cameras.value.length
  await initCamera()
}

function capture() {
  const video = videoEl.value
  if (!video) return

  const canvas = document.createElement('canvas')
  const vw = video.videoWidth
  const vh = video.videoHeight
  const size = Math.min(vw, vh)
  const sx = (vw - size) / 2
  const sy = (vh - size) / 2
  const target = Math.min(size, 1200)

  canvas.width = target
  canvas.height = target
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.drawImage(video, sx, sy, size, size, 0, 0, target, target)

  canvas.toBlob((blob) => {
    if (!blob) return
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
    capturedFile.value = file
    captured.value = URL.createObjectURL(blob)
    stopStream()
  }, 'image/jpeg', 0.9)
}

function retake() {
  if (captured.value) URL.revokeObjectURL(captured.value)
  captured.value = ''
  capturedFile.value = null
  initCamera()
}

function usePhoto() {
  if (capturedFile.value) {
    emit('captured', capturedFile.value)
    open.value = false
  }
}

onBeforeUnmount(() => {
  stopStream()
  if (captured.value) URL.revokeObjectURL(captured.value)
})
</script>
