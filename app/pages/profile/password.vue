<template>
  <!-- Tab Content: Password -->
  <div class="p-6 space-y-6">
    <UForm :schema="passwordSchema" :state="formPassword" @submit="handlePasswordSubmit" class="space-y-4">
      <UFormField v-if="authState.user?.hasPassword" name="oldPassword" required>
        <template #label>
          <div class="flex flex-col gap-0.5">
            <span class="font-medium text-sm text-neutral-900">{{ $t('pages.profile.passwordPage.currentPassword') }}</span>
            <span class="text-[10px] text-neutral-400 font-normal">{{ $t('pages.profile.passwordPage.currentPasswordHelper') }}</span>
          </div>
        </template>
        <UInput v-model="formPassword.oldPassword" type="password" :placeholder="$t('pages.profile.passwordPage.currentPasswordPlaceholder')" class="w-full" />
      </UFormField>
      <UFormField :label="$t('pages.profile.passwordPage.newPassword')" name="newPassword" required>
        <UInput v-model="formPassword.newPassword" type="password" :placeholder="$t('pages.profile.passwordPage.newPasswordPlaceholder')" class="w-full" />
      </UFormField>
      <UFormField :label="$t('pages.profile.passwordPage.confirmPassword')" name="confirmPassword" required>
        <UInput v-model="formPassword.confirmPassword" type="password" :placeholder="$t('pages.profile.passwordPage.confirmPasswordPlaceholder')" class="w-full" />
      </UFormField>
      
      <div class="flex justify-end pt-2">
        <UButton
          type="submit"
          color="primary"
          :loading="isSavingPassword"
          icon="i-lucide-key-round"
        >
          {{ $t('pages.profile.passwordPage.save') }}
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { UpdatePasswordPayload } from '~/types/profile'

const { t } = useI18n()
const { state: authState, service: authService } = useAuth()
const toast = useToast()

// Saving state
const isSavingPassword = ref(false)

// Form - Password
const formPassword = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordSchema = z.object({
  oldPassword: z.string().optional().or(z.literal('')),
  newPassword: z.string().min(6, t('pages.profile.passwordPage.passwordMin')),
  confirmPassword: z.string().min(6, t('pages.profile.passwordPage.confirmMin'))
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: t('pages.profile.passwordPage.mismatch'),
  path: ["confirmPassword"]
})

const handlePasswordSubmit = async () => {
  isSavingPassword.value = true

  const payload: UpdatePasswordPayload = {
    newPassword: formPassword.newPassword
  }

  if (formPassword.oldPassword && formPassword.oldPassword.trim() !== '') {
    payload.oldPassword = formPassword.oldPassword
  }

  try {
    const response = await authService.updatePassword(payload)
    if (response.success) {
      toast.add({
        title: t('pages.profile.passwordPage.success'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      // Clear password form fields
      formPassword.oldPassword = ''
      formPassword.newPassword = ''
      formPassword.confirmPassword = ''
    }
  } finally {
    isSavingPassword.value = false
  }
}
</script>
