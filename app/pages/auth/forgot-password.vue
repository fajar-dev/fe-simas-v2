<template>
  <div class="w-full max-w-[420px] mx-auto">
    <!-- Logo and Header -->
    <div class="flex flex-col gap-5 mb-6">
      <BrandLogo />
      <div class="space-y-1">
        <h1 class="text-3xl font-bold text-neutral-900">
          {{ $t('pages.auth.forgotPassword.title') }}
        </h1>
        <p class="text-neutral-600">
          {{ $t('pages.auth.forgotPassword.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Success State -->
    <div v-if="isSubmitted" class="space-y-6">
      <UAlert
        title="Check your email"
        description="We've sent a password reset link to your email address. Please check your inbox."
        icon="i-lucide-mail-check"
        color="success"
        variant="subtle"
      />

      <div class="space-y-3">
        <UButton
          
          block
          color="primary"
          @click="() => { isSubmitted = false }"
        >
          {{ $t('pages.auth.forgotPassword.submit') }}
        </UButton>

        <NuxtLink
          to="/auth/sign-in"
          class="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          {{ $t('pages.auth.forgotPassword.backToLogin') }}
        </NuxtLink>
      </div>
    </div>

    <!-- Form State -->
    <UForm v-else :state="state" :schema="forgotSchema" @submit="handleSubmit" class="space-y-4">
      <UFormField :label="$t('pages.auth.forgotPassword.emailLabel')" name="email" class="w-full font-medium text-neutral-800" :ui="{ label: 'text-sm font-medium text-neutral-800' }">
        <UInput
          id="forgot-email"
          v-model="state.email"
          type="email"
          :placeholder="$t('pages.auth.forgotPassword.emailPlaceholder')"
          
          class="w-full"
        />
      </UFormField>

      <div class="flex flex-col gap-3 pt-2">
        <UButton
          type="submit"
          
          block
          color="primary"
          :loading="loading"
        >
          {{ $t('pages.auth.forgotPassword.submit') }}
        </UButton>

        <NuxtLink
          to="/auth/sign-in"
          class="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          {{ $t('pages.auth.forgotPassword.backToLogin') }}
        </NuxtLink>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { authService } from '~/services/auth-service'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { t } = useI18n()

useHead({
  title: t('pages.auth.forgotPassword.title')
})

const state = reactive({
  email: ''
})

const loading = ref(false)
const isSubmitted = ref(false)
const toast = useToast()

const forgotSchema = z.object({
  email: z.string().min(1, t('pages.auth.forgotPassword.emailRequired'))
})

const handleSubmit = async () => {
  loading.value = true
  try {
    await authService.forgotPassword(state.email)
    isSubmitted.value = true
    toast.add({
      title: t('pages.auth.forgotPassword.success'),
      icon: 'i-lucide-circle-check',
      color: 'success'
    })
  } finally {
    loading.value = false
  }
}
</script>
