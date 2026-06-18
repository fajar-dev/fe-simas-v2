<template>
  <div class="w-full max-w-[420px] mx-auto">
    <!-- Loading: Validating Token -->
    <div v-if="isValidating" class="flex flex-col items-center gap-4 py-12">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 text-primary animate-spin" />
      <p class="text-neutral-500">Validating reset link...</p>
    </div>

    <!-- Success State -->
    <div v-else-if="isSuccess" class="flex flex-col gap-5 mb-6">
      <BrandLogo />
      <div class="space-y-4">
        <h1 class="text-3xl font-bold text-neutral-900">
          Password Reset
        </h1>
        <UAlert
          title="Your password has been reset successfully"
          description="You can now sign in with your new password."
          icon="i-lucide-circle-check"
          color="success"
          variant="subtle"
        />
        <UButton
          
          block
          color="primary"
          to="/auth/sign-in"
        >
          Sign In
        </UButton>
      </div>
    </div>

    <!-- Reset Form -->
    <template v-else>
      <div class="flex flex-col gap-5 mb-6">
        <BrandLogo />
        <div class="space-y-1">
          <h1 class="text-3xl font-bold text-neutral-900">
            Reset Password
          </h1>
          <p class="text-neutral-600">
            Enter your new password below.
          </p>
        </div>
      </div>

      <UForm :state="state" :schema="resetSchema" @submit="handleReset" class="space-y-4">
        <UFormField label="New Password" name="password" class="w-full" :ui="{ label: 'text-sm font-medium text-neutral-800' }">
          <UInput
            id="new-password"
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter new password"
            
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

        <UFormField label="Confirm Password" name="confirmPassword" class="w-full" :ui="{ label: 'text-sm font-medium text-neutral-800' }">
          <UInput
            id="confirm-password"
            v-model="state.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Confirm new password"
            
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="ghost"
                :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                class="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-transparent cursor-pointer"
                @click="showConfirmPassword = !showConfirmPassword"
                aria-label="Toggle Confirm Password Visibility"
              />
            </template>
          </UInput>
        </UFormField>

        <div class="flex flex-col gap-3 pt-2">
          <UButton
            type="submit"
            
            block
            color="primary"
            :loading="loading"
          >
            Reset Password
          </UButton>

          <NuxtLink
            to="/auth/sign-in"
            class="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
            Back to Sign In
          </NuxtLink>
        </div>
      </UForm>
    </template>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { authService } from '~/services/auth-service'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

useHead({
  title: 'Reset Password'
})

const route = useRoute()
const toast = useToast()

// Query params from reset link
const token = computed(() => route.query.token as string || '')
const email = computed(() => route.query.email as string || '')

const state = reactive({
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const isValidating = ref(true)
const isSuccess = ref(false)

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// Validate token on mount
onMounted(async () => {
  if (!token.value || !email.value) {
    toast.add({
      title: 'Invalid or expired reset password link',
      icon: 'i-lucide-circle-x',
      color: 'error'
    })
    navigateTo('/auth/forgot-password')
    return
  }

  try {
    await authService.validateResetPassword(email.value, token.value)
    isValidating.value = false
  } catch {
    toast.add({
      title: 'Invalid or expired reset password link',
      icon: 'i-lucide-circle-x',
      color: 'error'
    })
    navigateTo('/auth/forgot-password')
  }
})

const handleReset = async () => {
  loading.value = true
  try {
    await authService.resetPassword(token.value, state.password)
    isSuccess.value = true
    toast.add({
      title: 'Password reset successfully',
      icon: 'i-lucide-circle-check',
      color: 'success'
    })
  } finally {
    loading.value = false
  }
}
</script>
