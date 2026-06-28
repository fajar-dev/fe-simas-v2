<template>
  <div class="w-full max-w-[420px] mx-auto">
    <!-- Logo and Header -->
    <div class="flex flex-col gap-5 mb-6">
      <!-- Logo -->
      <BrandLogo />
      <div class="space-y-1">
        <h1 class="text-3xl font-bold text-neutral-900 ">
          {{ $t('pages.auth.signIn.title') }}
        </h1>
        <p class="text-neutral-600">
          {{ $t('pages.auth.signIn.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Form fields with standard Nuxt UI v4 validation -->
    <UForm :state="state" :schema="loginSchema" @submit="handleLogin" class="space-y-4">
      
      <!-- ID Karyawan Input Container -->
      <UFormField :label="$t('pages.auth.signIn.emailLabel')" name="email" class="w-full font-medium text-neutral-800" :ui="{ label: 'text-sm font-medium text-neutral-800' }">
        <UInput
          id="email"
          v-model="state.email"
          type="email"
          :placeholder="$t('pages.auth.signIn.emailPlaceholder')"
          
          class="w-full"
        />
      </UFormField>

      <!-- Password Input Container -->
      <UFormField :label="$t('pages.auth.signIn.passwordLabel')" name="password" class="w-full" :ui="{ label: 'text-sm font-medium text-neutral-800' }">
        <template #hint>
          <NuxtLink
            to="/auth/forgot-password"
            class="text-sm font-medium text-primary"
          >
            {{ $t('pages.auth.signIn.forgotPassword') }}
          </NuxtLink>
        </template>
        <UInput
          id="password"
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          :placeholder="$t('pages.auth.signIn.passwordPlaceholder')"
          
          class="w-full"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="ghost"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              class="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-transparent cursor-pointer"
              @click="showPassword = !showPassword"
              aria-label="Toggle Password Visibility"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Main Actions -->
      <div class="flex flex-col gap-3 pt-2">
        <!-- Submit Login Button -->
        <UButton
          type="submit"
          
          block
          color="primary"
          :loading="loading || googleLoading"
        >
          {{ $t('pages.auth.signIn.login') }}
        </UButton>

        <!-- OR Divider -->
        <USeparator :label="$t('common.or')" color="neutral" />

        <!-- Sign In with Google Button -->
        <UButton
          type="button"
          
          block
          variant="soft"
          color="neutral"
          :disabled="googleLoading || loading"
          @click="handleGoogleLogin"
        >
          <template #leading>
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
          </template>
          {{ $t('pages.auth.signIn.continueGoogle') }}
        </UButton>

        <!-- Sign In with QR Code Button -->
        <UButton
          type="button"
          block
          variant="soft"
          color="neutral"
          :disabled="googleLoading || loading"
          @click="showQrModal = true"
        >
          <template #leading>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 177 109" fill="none">
              <defs>
                <linearGradient id="p0" x1="110.837" y1="15.156" x2="4.403" y2="110.003" gradientUnits="userSpaceOnUse"><stop offset="0.034" stop-color="#1667F4"/><stop offset="1" stop-color="#23E396"/></linearGradient>
                <linearGradient id="p1" x1="110.409" y1="23.295" x2="55.19" y2="119.03" gradientUnits="userSpaceOnUse"><stop stop-color="#1667F4"/><stop offset="1" stop-color="#23E396"/></linearGradient>
                <linearGradient id="p2" x1="120.352" y1="23.295" x2="70.46" y2="131.56" gradientUnits="userSpaceOnUse"><stop stop-color="#1667F4"/><stop offset="1" stop-color="#23E396"/></linearGradient>
                <linearGradient id="p3" x1="164.133" y1="0" x2="81.861" y2="104.382" gradientUnits="userSpaceOnUse"><stop offset="0.212" stop-color="#1667F4"/><stop offset="1" stop-color="#23E396"/></linearGradient>
              </defs>
              <g fill-rule="evenodd" clip-rule="evenodd">
                <path fill="#1B3FB5" d="M130.978 32.997L138.308 55.161L131.895 74.551C131.895 74.551 131.105 76.779 128.685 76.779C126.264 76.779 125.475 74.554 125.475 74.554L118.145 52.39L124.557 33C124.557 33 125.347 30.772 127.768 30.772C130.189 30.772 130.978 32.997 130.978 32.997Z"/>
                <path fill="#1B3FB5" d="M50.324 32.997L57.655 55.161L51.242 74.551C51.242 74.551 50.452 76.779 48.031 76.779C45.611 76.779 44.822 74.554 44.822 74.554L37.491 52.39L43.904 33C43.904 33 44.694 30.772 47.115 30.772C49.535 30.772 50.324 32.997 50.324 32.997Z"/>
                <path fill="#1B3FB5" d="M97.982 55.161L90.652 32.997C90.652 32.997 89.862 30.772 87.442 30.772C85.021 30.772 84.231 33 84.231 33L77.818 52.39L85.149 74.554C85.149 74.554 85.938 76.779 88.358 76.779C90.779 76.779 91.569 74.551 91.569 74.551L97.982 55.161Z"/>
                <path fill="url(#p0)" d="M43.904 33.002L19.246 107.557H0L24.657 33.002C24.657 33.002 25.16 31.49 26.17 29.659C26.208 29.59 26.246 29.521 26.285 29.452C28.377 25.796 32.607 23.295 37.479 23.295C37.515 23.295 37.552 23.295 37.588 23.295C38.911 23.295 40.199 23.492 41.42 23.863C43.822 24.593 45.962 25.994 47.588 27.886C48.689 29.165 49.554 30.668 50.106 32.34L50.325 32.999C50.325 32.999 50.152 32.512 49.72 31.995C49.23 31.404 48.404 30.774 47.115 30.774C44.694 30.774 43.904 33.002 43.904 33.002Z"/>
                <path fill="url(#p1)" d="M51.243 74.554L64.985 33.002C64.985 33.002 65.476 31.525 66.461 29.724C66.522 29.613 66.585 29.5 66.649 29.388C68.755 25.767 72.962 23.295 77.805 23.295H77.915C79.249 23.295 80.548 23.496 81.777 23.871C84.159 24.602 86.282 25.993 87.901 27.868C89.008 29.152 89.879 30.661 90.434 32.34L90.652 32.999C90.652 32.999 90.479 32.512 90.047 31.994C89.556 31.404 88.73 30.774 87.443 30.774C85.022 30.774 84.232 33.002 84.232 33.002L70.49 74.554C70.49 74.554 69.979 76.086 68.956 77.934C68.932 77.978 68.908 78.022 68.883 78.066C66.798 81.742 62.556 84.26 57.667 84.26C57.632 84.26 57.595 84.26 57.558 84.26C56.239 84.26 54.955 84.064 53.738 83.696C51.329 82.966 49.183 81.561 47.553 79.663C46.456 78.385 45.592 76.884 45.04 75.215L44.822 74.556C44.822 74.556 44.995 75.042 45.425 75.56C45.917 76.15 46.743 76.781 48.032 76.781C50.453 76.781 51.243 74.554 51.243 74.554Z"/>
                <path fill="url(#p2)" d="M87.85 79.63C86.767 78.36 85.914 76.87 85.367 75.216L85.148 74.557C85.148 74.557 85.321 75.042 85.751 75.56C86.241 76.15 87.068 76.782 88.358 76.782C90.779 76.782 91.569 74.554 91.569 74.554L105.311 33.003C105.311 33.003 105.822 31.47 106.843 29.624L106.92 29.486C109.006 25.814 113.243 23.297 118.128 23.295H118.241C119.542 23.295 120.809 23.486 122.01 23.845C124.456 24.574 126.635 26 128.28 27.931C129.362 29.2 130.214 30.689 130.76 32.341L130.978 33C130.978 33 130.806 32.515 130.376 31.997C129.886 31.407 129.059 30.775 127.769 30.775C125.348 30.775 124.558 33.003 124.558 33.003L110.816 74.554C110.816 74.554 110.296 76.116 109.253 77.987C109.248 77.997 109.242 78.007 109.237 78.017C107.162 81.72 102.907 84.26 97.998 84.262H97.994C97.957 84.262 97.921 84.262 97.884 84.261C96.583 84.261 95.315 84.071 94.112 83.711C91.669 82.982 89.495 81.558 87.85 79.63Z"/>
                <path fill="url(#p3)" d="M131.896 74.555L156.554 0H175.801L151.143 74.555C151.143 74.555 150.636 76.076 149.62 77.915C149.588 77.973 149.556 78.032 149.523 78.09C147.435 81.753 143.202 84.261 138.325 84.263C138.323 84.263 138.323 84.263 138.321 84.263C138.285 84.263 138.248 84.263 138.212 84.262C136.906 84.262 135.633 84.07 134.426 83.708C131.992 82.978 129.825 81.559 128.184 79.638C127.097 78.366 126.242 76.874 125.694 75.216L125.476 74.557C125.476 74.557 125.648 75.043 126.078 75.56C126.569 76.15 127.396 76.783 128.685 76.783C131.106 76.783 131.896 74.555 131.896 74.555Z"/>
              </g>
            </svg>
          </template>
          {{ $t('pages.auth.signIn.continueNusawork') }}
        </UButton>
      </div>
    </UForm>

    <!-- Nusawork Login Modal -->
    <AuthNusaworkLoginModal v-model="showQrModal" @success="onQrSuccess" />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { authService } from '~/services/auth-service'

// Bind to the newly extracted Auth Layout
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

// SEO meta configurations for auth flow
const { t } = useI18n()

useHead({
  title: t('pages.auth.signIn.title')
})

// Form state using reactive model representation
const state = reactive({
  email: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const googleLoading = ref(false)
const toast = useToast()
const route = useRoute()
const redirectPath = computed(() => (route.query.redirect as string) || '/')
const showQrModal = ref(false)

// Reusable toast notification helper
const showToast = (type: 'success' | 'error', title: string) => {
  toast.add({
    title,
    icon: type === 'success' ? 'i-lucide-circle-check' : 'i-lucide-circle-x',
  })
}

// Zod Validation Schema mapped automatically by UForm
const loginSchema = z.object({
  email: z.string().min(1, t('pages.auth.signIn.emailRequired')),
  password: z.string().min(1, t('pages.auth.signIn.passwordRequired'))
})

// Google Auth integration using composables
const { isReady, login: triggerGoogleLogin } = useCodeClient({
  onSuccess: async (response) => {
    try {
      await authService.google(response.code)
      showToast('success', t('pages.auth.signIn.loginSuccess'))
      navigateTo(redirectPath.value)
    } finally {
      googleLoading.value = false
    }
  },
  onError: () => {
    googleLoading.value = false
    showToast('error', t('pages.auth.signIn.loginFailed'))
  }
})

const handleGoogleLogin = () => {
  if (!isReady.value) return
  googleLoading.value = true
  triggerGoogleLogin()
}

// Credentials Auth Submission handler
const handleLogin = async () => {
  loading.value = true
  try {
    await authService.login(state.email, state.password)
    showToast('success', t('pages.auth.signIn.loginSuccess'))
    navigateTo(redirectPath.value)
  } finally {
    loading.value = false
  }
}

const onQrSuccess = () => {
  navigateTo(redirectPath.value)
}
</script>
