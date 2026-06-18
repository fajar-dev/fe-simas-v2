<template>
  <!-- Tab Content: Password -->
  <div class="p-6 space-y-6">
    <UForm :schema="passwordSchema" :state="formPassword" @submit="handlePasswordSubmit" class="space-y-4">
      <UFormField v-if="authState.user?.hasPassword" name="oldPassword">
        <template #label>
          <div class="flex flex-col gap-0.5">
            <span class="font-medium text-sm text-neutral-900">Current Password</span>
            <span class="text-[10px] text-neutral-400 font-normal">Enter your current password to verify</span>
          </div>
        </template>
        <UInput v-model="formPassword.oldPassword" type="password" placeholder="Enter current password" class="w-full" />
      </UFormField>
      <UFormField label="New Password" name="newPassword">
        <UInput v-model="formPassword.newPassword" type="password" placeholder="Minimum 6 characters" class="w-full" />
      </UFormField>
      <UFormField label="Confirm New Password" name="confirmPassword">
        <UInput v-model="formPassword.confirmPassword" type="password" placeholder="Confirm new password" class="w-full" />
      </UFormField>
      
      <div class="flex justify-end pt-2">
        <UButton
          type="submit"
          color="primary"
          :loading="isSavingPassword"
          icon="i-lucide-key-round"
        >
          Change Password
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { UpdatePasswordPayload } from '~/types/profile'

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
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
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
        title: 'Password updated successfully!',
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
