<template>
  <UModal 
    title="Add User"
    description="Fill in the details to create a new user account."
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

      <UForm id="add-user-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField label="Name" name="name" required>
          <UInput v-model="form.name" placeholder="Enter full name" class="w-full" />
        </UFormField>
        <UFormField label="Email" name="email" required>
          <UInput v-model="form.email" type="email" placeholder="Enter email address" class="w-full" />
        </UFormField>
        <UFormField label="Password" name="password">
          <UInput v-model="form.password" type="password" placeholder="Enter password (optional)" class="w-full" />
        </UFormField>
        <UFormField label="Status" name="isActive">
          <div class="flex items-center gap-2">
            <USwitch v-model="form.isActive" />
            <span class="text-sm text-neutral-600">{{ form.isActive ? 'Active' : 'Inactive' }}</span>
          </div>
        </UFormField>
        <UFormField label="Role" name="roleId">
          <USelectMenu
            v-model="form.roleId"
            :items="roleOptions"
            placeholder="Select a role"
            value-key="value"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton label="Cancel" @click="open = false" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="add-user-form"
          color="primary"
          :loading="isSubmitting"
          :disabled="isUploading"
        >
          Save User
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { userService } from '~/services/user-service'
import { roleService } from '~/services/role-service'
import type { UserPayload } from '~/types/user'
import type { Role } from '~/types/role'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const toast = useToast()
const isSubmitting = ref(false)
const isUploading = ref(false)

const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  isActive: z.boolean()
})

const roles = ref<Role[]>([])
const roleOptions = computed(() => 
  roles.value.map(r => ({ label: r.name, value: r.id }))
)

const form = reactive<UserPayload>({
  name: '',
  email: '',
  password: '',
  photo: null,
  isActive: true,
  roleId: null
})

const resetForm = () => {
  form.name = ''
  form.email = ''
  form.password = ''
  form.photo = null
  form.isActive = true
  form.roleId = null
  previewUrl.value = null
}

const fetchRoles = async () => {
  try {
    const response = await roleService.getAll(1, 100)
    if (response.success) {
      roles.value = response.data
    }
  } catch (error) {
    // silently fail
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
    const response = await userService.uploadPhoto(file)
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
  isSubmitting.value = true
  try {
    const response = await userService.create(form)
    if (response.success) {
      toast.add({
        title: 'User created successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('created')
      open.value = false
      resetForm()
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (val) => {
  if (val) {
    fetchRoles()
  } else {
    resetForm()
  }
})
</script>
