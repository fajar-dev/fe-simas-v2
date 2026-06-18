<template>
  <div class="w-full max-w-[420px] mx-auto">
    <!-- Logo and Header -->
    <div class="flex flex-col gap-5 mb-6">
      <!-- Logo -->
      <BrandLogo />
      <div class="space-y-1">
        <h1 class="text-3xl font-bold text-neutral-900 ">
          Sign In
        </h1>
        <p class="text-neutral-600">
          Please enter your credentials to sign in
        </p>
      </div>
    </div>

    <!-- Form fields with standard Nuxt UI v4 validation -->
    <UForm :state="state" :schema="loginSchema" @submit="handleLogin" class="space-y-4">
      
      <!-- ID Karyawan Input Container -->
      <UFormField label="Email" name="email" class="w-full font-medium text-neutral-800" :ui="{ label: 'text-sm font-medium text-neutral-800' }">
        <UInput
          id="email"
          v-model="state.email"
          type="email"
          placeholder="Enter your email"
          
          class="w-full"
        />
      </UFormField>

      <!-- Password Input Container -->
      <UFormField label="Password" name="password" class="w-full" :ui="{ label: 'text-sm font-medium text-neutral-800' }">
        <template #hint>
          <NuxtLink
            to="/auth/forgot-password"
            class="text-sm font-medium text-primary"
          >
            Forgot password?
          </NuxtLink>
        </template>
        <UInput
          id="password"
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Enter your password"
          
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
          Login
        </UButton>

        <!-- OR Divider -->
        <USeparator label="OR" color="neutral" />

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
          Continue with Google
        </UButton>
      </div>
    </UForm>
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
useHead({
  title: 'Sign In'
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

// Reusable toast notification helper
const showToast = (type: 'success' | 'error', title: string) => {
  toast.add({
    title,
    icon: type === 'success' ? 'i-lucide-circle-check' : 'i-lucide-circle-x',
  })
}

// Zod Validation Schema mapped automatically by UForm
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required')
})

// Google Auth integration using composables
const { isReady, login: triggerGoogleLogin } = useCodeClient({
  onSuccess: async (response) => {
    try {
      await authService.google(response.code)
      showToast('success', 'Login success! Welcome.')
      navigateTo('/')
    } finally {
      googleLoading.value = false
    }
  },
  onError: () => {
    googleLoading.value = false
    showToast('error', 'Login failed. Please try again.')
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
    showToast('success', 'Login success! Welcome.')
    navigateTo('/')
  } finally {
    loading.value = false
  }
}
</script>
