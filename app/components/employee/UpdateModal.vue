<template>
  <UModal 
    :title="$t('component.employee.updateModal.title')"
    :description="$t('component.employee.updateModal.description')"
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <!-- Avatar Upload Section -->
      <div class="flex items-center gap-5 pb-4">
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
            <UButton v-if="previewUrl || form.photo" size="xs" color="error" variant="outline" @click="removePhoto" icon="i-lucide-trash">{{ $t('common.remove') }}</UButton>
          </div>
        </div>
        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileChange" />
      </div>

      <UForm id="update-employee-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField :label="$t('component.employee.updateModal.employeeId')" name="employeeId" required>
          <UInput v-model="form.employeeId" :placeholder="$t('component.employee.updateModal.employeeIdPlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('common.name')" name="name" required>
          <UInput v-model="form.name" :placeholder="$t('component.employee.updateModal.namePlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('component.employee.updateModal.jobPosition')" name="jobPosition" required>
          <UInput v-model="form.jobPosition" :placeholder="$t('component.employee.updateModal.jobPositionPlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('common.email')" name="email" required>
          <UInput v-model="form.email" type="email" :placeholder="$t('component.employee.updateModal.emailPlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('common.phone')" name="phone" required>
          <UInput v-model="form.phone" type="tel" :placeholder="$t('component.employee.updateModal.phonePlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('common.status')" name="isActive">
          <div class="flex items-center gap-2">
            <USwitch v-model="form.isActive" />
            <span class="text-sm text-neutral-600">{{ form.isActive ? $t('common.active') : $t('common.inactive') }}</span>
          </div>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton :label="$t('common.cancel')" @click="() => { open = false }" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="update-employee-form"
          color="primary"
          :loading="isSubmitting"
          :disabled="isUploading"
        >
          {{ $t('common.saveChanges') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { employeeService } from '~/services/employee-service'
import type { Employee, EmployeePayload } from '~/types/employee'

const { t } = useI18n()

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  employee: Employee | null
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()
const isSubmitting = ref(false)
const isUploading = ref(false)

const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}
const schema = computed(() => z.object({
  employeeId: z.string().min(1, t('component.employee.updateModal.employeeIdRequired')),
  name: z.string().min(1, t('common.nameRequired')),
  jobPosition: z.string().min(1, t('component.employee.updateModal.jobPositionRequired')),
  email: z.string().min(1, t('component.employee.updateModal.emailRequired')).email(t('component.employee.updateModal.emailInvalid')),
  phone: z.string().min(1, t('component.employee.updateModal.phoneRequired'))
}))

const form = reactive<EmployeePayload>({
  employeeId: '',
  name: '',
  jobPosition: '',
  email: '',
  phone: '',
  photo: null,
  isActive: true
})

const populateForm = () => {
  if (props.employee) {
    form.employeeId = props.employee.employeeId
    form.name = props.employee.name
    form.jobPosition = props.employee.jobPosition
    form.email = props.employee.email
    form.phone = props.employee.phone
    form.photo = props.employee.photo
    form.isActive = props.employee.isActive
    previewUrl.value = props.employee.photo
  }
}



const onFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Show local preview immediately
  previewUrl.value = URL.createObjectURL(file)

  // Upload to MinIO immediately
  isUploading.value = true
  try {
    const response = await employeeService.uploadPhoto(file)
    if (response.success && response.data?.path) {
      form.photo = response.data.path
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
  form.photo = null
  previewUrl.value = null
}

const handleSubmit = async () => {
  if (!props.employee) return
  isSubmitting.value = true

  // Build payload
  const payload: EmployeePayload = {
    employeeId: form.employeeId,
    name: form.name,
    jobPosition: form.jobPosition,
    email: form.email,
    phone: form.phone,
    photo: form.photo,
    isActive: form.isActive
  }

  try {
    const response = await employeeService.update(props.employee.id, payload)
    if (response.success) {
      toast.add({
        title: t('component.employee.updateModal.success'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('updated')
      open.value = false
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (val) => {
  if (val) {
    populateForm()
  } else {
    previewUrl.value = null
  }
})
</script>
