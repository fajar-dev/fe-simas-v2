<template>
  <!-- Tab Content: Information -->
  <div class="p-6 space-y-6">
    <!-- Photo Upload Section -->
    <div class="flex items-center gap-5 pb-4 border-b border-neutral-100">
      <div class="relative group cursor-pointer shrink-0" @click="triggerFileInput">
        <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-200 hover:border-primary/50 transition-colors duration-200 flex items-center justify-center bg-neutral-50 relative">
          <NuxtImg v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover" />
          <UIcon v-else name="i-lucide-user" class="w-10 h-10 text-neutral-400" />
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <UIcon name="i-lucide-camera" class="w-5 h-5 text-white" />
          </div>
          <div v-if="isUploading" class="absolute inset-0 bg-black/50 flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="w-5 h-5 text-white animate-spin" />
          </div>
        </div>
      </div>
      <div class="flex flex-col">
        <span class="text-sm font-semibold text-neutral-900">{{ $t('common.photo') }}</span>
        <p class="text-xs text-neutral-400">{{ $t('common.photoHint') }}</p>
        <div class="flex gap-2 mt-2">
          <UButton size="xs" color="neutral" variant="outline" @click="triggerFileInput" icon="i-lucide-upload">{{ $t('common.choosePhoto') }}</UButton>
          <UButton v-if="previewUrl || formInfo.photo" size="xs" color="error" variant="outline" @click="removePhoto" icon="i-lucide-trash">{{ $t('common.remove') }}</UButton>
        </div>
      </div>
      <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileChange" />
    </div>

    <UForm :schema="infoSchema" :state="formInfo" @submit="handleInfoSubmit" class="space-y-4">
      <UFormField :label="$t('pages.profile.informationPage.fullName')" name="name" required>
        <UInput v-model="formInfo.name" :placeholder="$t('pages.profile.informationPage.fullNamePlaceholder')" class="w-full" />
      </UFormField>
      <UFormField :label="$t('pages.profile.informationPage.emailAddress')" name="email" required>
        <UInput v-model="formInfo.email" type="email" :placeholder="$t('pages.profile.informationPage.emailPlaceholder')" class="w-full" />
      </UFormField>
      
      <div class="flex justify-end pt-2">
        <UButton
          type="submit"
          color="primary"
          :loading="isSavingInfo"
          :disabled="isUploading"
          icon="i-lucide-save"
        >
          {{ $t('pages.profile.informationPage.save') }}
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { userService } from '~/services/user-service'
import type { UpdateProfilePayload } from '~/types/profile'

const { t } = useI18n()
const { state: authState, service: authService } = useAuth()
const toast = useToast()

// Upload state
const isUploading = ref(false)

const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}
// Saving state
const isSavingInfo = ref(false)

// Form - Information
const formInfo = reactive<UpdateProfilePayload>({
  name: '',
  email: '',
  photo: null
})

// Validation Schemas
const infoSchema = z.object({
  name: z.string().min(1, t('pages.profile.informationPage.nameRequired')),
  email: z.string().min(1, t('pages.profile.informationPage.emailRequired')).email(t('pages.profile.informationPage.emailInvalid'))
})

// Populate profile details
const populateProfile = () => {
  if (authState.user) {
    formInfo.name = authState.user.name
    formInfo.email = authState.user.email
    formInfo.photo = authState.user.photo
    previewUrl.value = authState.user.photo
  }
}



const onFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Local preview URL
  previewUrl.value = URL.createObjectURL(file)

  isUploading.value = true
  try {
    const response = await userService.uploadPhoto(file)
    if (response.success && response.data?.path) {
      formInfo.photo = response.data.path
      toast.add({
        title: t('common.photoUploaded'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    } else {
      toast.add({
        title: t('common.photoUploadFailed'),
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    }
  } catch (error) {
    toast.add({
      title: t('common.photoUploadFailed'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isUploading.value = false
  }
}

const removePhoto = () => {
  formInfo.photo = null
  previewUrl.value = null
}

const handleInfoSubmit = async () => {
  isSavingInfo.value = true
  try {
    const response = await authService.updateProfile(formInfo)
    if (response.success) {
      toast.add({
        title: t('pages.profile.informationPage.success'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
  } finally {
    isSavingInfo.value = false
  }
}

// Watch session user changes
watch(() => authState.user, () => {
  populateProfile()
}, { immediate: true })

onMounted(() => {
  populateProfile()
})
</script>
