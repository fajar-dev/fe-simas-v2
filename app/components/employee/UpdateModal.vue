<template>
  <UModal 
    title="Edit Employee"
    description="Update the employee information below."
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
          <span class="text-sm font-semibold text-neutral-900">Photo</span>
          <p class="text-xs text-neutral-400">JPG, GIF or PNG. 1MB Max.</p>
          <div class="flex gap-2 mt-2">
            <UButton size="xs" color="neutral" variant="outline" @click="triggerFileInput" icon="i-lucide-upload">Choose Photo</UButton>
            <UButton v-if="previewUrl || form.photo" size="xs" color="error" variant="outline" @click="removePhoto" icon="i-lucide-trash">Remove</UButton>
          </div>
        </div>
        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileChange" />
      </div>

      <UForm id="update-employee-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField label="Employee ID" name="employeeId" required>
          <UInput v-model="form.employeeId" placeholder="Enter employee ID" class="w-full" />
        </UFormField>
        <UFormField label="Name" name="name" required>
          <UInput v-model="form.name" placeholder="Enter full name" class="w-full" />
        </UFormField>
        <UFormField label="Job Position" name="jobPosition" required>
          <UInput v-model="form.jobPosition" placeholder="Enter job position" class="w-full" />
        </UFormField>
        <UFormField label="Email" name="email" required>
          <UInput v-model="form.email" type="email" placeholder="Enter email address" class="w-full" />
        </UFormField>
        <UFormField label="Phone" name="phone" required>
          <UInput v-model="form.phone" type="tel" placeholder="Enter phone number" class="w-full" />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton label="Cancel" @click="open = false" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="update-employee-form"
          color="primary"
          :loading="isSubmitting"
          :disabled="isUploading"
        >
          Save Changes
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { employeeService } from '~/services/employee-service'
import type { Employee, EmployeePayload } from '~/types/employee'

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
const schema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(1, 'Name is required'),
  jobPosition: z.string().min(1, 'Job Position is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone is required')
})

const form = reactive<EmployeePayload>({
  employeeId: '',
  name: '',
  jobPosition: '',
  email: '',
  phone: '',
  photo: null
})

const populateForm = () => {
  if (props.employee) {
    form.employeeId = props.employee.employeeId
    form.name = props.employee.name
    form.jobPosition = props.employee.jobPosition
    form.email = props.employee.email
    form.phone = props.employee.phone
    form.photo = props.employee.photo
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
        title: 'Photo uploaded successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    } else {
      toast.add({
        title: 'Failed to upload photo',
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    }
  } catch (error) {
    toast.add({
      title: 'Failed to upload photo',
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
    photo: form.photo
  }

  try {
    const response = await employeeService.update(props.employee.id, payload)
    if (response.success) {
      toast.add({
        title: 'Employee updated successfully!',
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
