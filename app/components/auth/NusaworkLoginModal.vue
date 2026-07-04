<template>
  <UModal
    v-model:open="open"
    :ui="{
      content: 'sm:max-w-sm',
      overlay: 'bg-black/40',
    }"
    :title="$t('component.auth.nusawork.title')"
    :description="$t('component.auth.nusawork.description')"
  >

    <template #body>
      <div class="flex flex-col items-center gap-4 py-2">
        <!-- Loading state -->
        <div v-if="isLoading" class="w-52 h-52 rounded-xl bg-neutral-100 flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-600 animate-spin" />
        </div>

        <!-- Error / Expired state -->
        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-triangle-alert"
          :title="error"
          class="w-full"
        >
          <template #actions>
            <UButton
              :label="$t('common.tryAgain')"
              icon="i-lucide-refresh-cw"
              size="xs"
              color="error"
              variant="outline"
              @click="generate"
            />
          </template>
        </UAlert>

        <!-- Confirmation state: scanned, waiting for approval -->
        <div v-else-if="status === 'confirmation' && profile" class="w-full flex flex-col items-center gap-4 py-2">
          <UAvatar
            :src="profile.photo"
            :alt="`${profile.firstName} ${profile.lastName}`"
            icon="i-lucide-user"
            size="3xl"
            class="border-2 border-neutral-200 shadow-sm"
            loading="lazy"
          />
          <div class="text-center">
            <p class="text-base font-bold text-neutral-900">{{ profile.firstName }} {{ profile.lastName }}</p>
            <p class="text-xs text-neutral-600 mt-0.5">{{ profile.email }}</p>
          </div>
          <UBadge :label="$t('component.auth.nusawork.confirmed')" color="success" variant="subtle" size="sm" class="uppercase tracking-wide" />
          <p class="text-xs text-neutral-400 text-center">
            {{ $t('component.auth.nusawork.confirmInstruction') }}
          </p>
        </div>

        <!-- QR Code display (waiting state) -->
        <div v-else class="relative">
          <div class="w-52 h-52 rounded-xl bg-white border border-neutral-200 p-2 shadow-sm">
            <img
              v-if="qrCode"
              :src="qrCode"
              alt="QR Code"
              class="w-full h-full object-contain rounded-lg"
            />
          </div>
          <!-- Countdown badge -->
          <div v-if="status === 'waiting'" class="absolute bottom-2 left-2 right-2 flex items-center justify-center">
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span class="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span class="text-[10px] font-medium text-white">
                {{ countdown > 0 ? `${countdown}s` : $t('component.auth.nusawork.waiting') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Instructions (only in waiting state) -->
        <div v-if="status === 'waiting'" class="w-full space-y-2">
          <div class="flex items-center gap-3 rounded-lg bg-neutral-50 px-3.5 py-3">
            <UBadge label="1" color="success" variant="subtle" class="rounded-full w-6 h-6 justify-center" />
            <span class="text-sm text-neutral-700">{{ $t('component.auth.nusawork.step1') }}</span>
          </div>
          <div class="flex items-center gap-3 rounded-lg bg-neutral-50 px-3.5 py-3">
            <UBadge label="2" color="success" variant="subtle" class="rounded-full w-6 h-6 justify-center" />
            <span class="text-sm text-neutral-700">{{ $t('component.auth.nusawork.step2') }}</span>
          </div>
        </div>
      </div>
    </template>

  </UModal>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth-service'

interface QrProfile {
  firstName: string
  lastName: string
  email: string
  photo: string
  company?: { name: string; address: string }
}

const { t } = useI18n()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ success: [] }>()
const toast = useToast()

const isLoading = ref(false)
const error = ref<string | null>(null)
const qrToken = ref<string | null>(null)
const qrCode = ref<string | null>(null)
const status = ref<'idle' | 'waiting' | 'confirmation' | 'success'>('idle')
const profile = ref<QrProfile | null>(null)
const countdown = ref(0)
let pollingTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

async function generate() {
  isLoading.value = true
  error.value = null
  status.value = 'idle'
  qrToken.value = null
  qrCode.value = null
  profile.value = null
  countdown.value = 0
  stopAll()

  try {
    const res = await authService.generateNusaworkQr()
    if (res.success && res.data) {
      qrToken.value = res.data.token
      qrCode.value = res.data.qrCode
      status.value = 'waiting'

      const timeoutSeconds = (res.data.timeoutMinutes || 1) * 60
      countdown.value = timeoutSeconds
      startCountdown()
      startPolling()
    } else {
      error.value = res.message || t('component.auth.nusawork.generateFailed')
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || t('component.auth.nusawork.generateFailed')
  } finally {
    isLoading.value = false
  }
}

function startCountdown() {
  stopCountdown()
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      stopAll()
      error.value = t('component.auth.nusawork.expired')
      status.value = 'idle'
    }
  }, 1000)
}

function startPolling() {
  stopPolling()
  pollingTimer = setInterval(async () => {
    if (!qrToken.value || (status.value !== 'waiting' && status.value !== 'confirmation')) {
      stopPolling()
      return
    }
    try {
      const res = await authService.checkNusaworkStatus(qrToken.value)
      if (!res.success) return

      if (res.data?.status === 'success' && res.data.panelToken) {
        status.value = 'success'
        profile.value = res.data.profile || null
        stopAll()
        await exchangeToken(res.data.panelToken)
      } else if (res.data?.status === 'confirmation' && res.data.profile) {
        status.value = 'confirmation'
        profile.value = res.data.profile
        // Keep polling — waiting for user to approve on mobile
      }
    } catch {
      stopAll()
      error.value = t('component.auth.nusawork.expired')
      status.value = 'idle'
    }
  }, 2000)
}

function stopPolling() {
  if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null }
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

function stopAll() {
  stopPolling()
  stopCountdown()
}

async function exchangeToken(panelToken: string) {
  try {
    await authService.nusaworkLogin(panelToken)
    open.value = false
    toast.add({
      title: t('pages.auth.signIn.loginSuccess'),
      icon: 'i-lucide-circle-check',
      color: 'success',
    })
    emit('success')
  } catch (e: any) {
    open.value = false
    toast.add({
      title: e?.response?.data?.message || t('component.auth.nusawork.loginFailed'),
      icon: 'i-lucide-circle-x',
      color: 'error',
    })
  }
}

watch(open, (val) => {
  if (val) {
    generate()
  } else {
    stopAll()
    status.value = 'idle'
    error.value = null
    profile.value = null
  }
})

onUnmounted(() => {
  stopAll()
})
</script>
