<template>
  <UModal 
    :title="$t('component.user.updateModal.title')"
    :description="$t('component.user.updateModal.description')"
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

      <UForm id="update-user-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField :label="$t('component.user.updateModal.linkEmployee')" name="employeeId">
          <USelectMenu
            v-model="selectedEmployee"
            :items="employeeOptions"
            :placeholder="$t('component.user.updateModal.selectEmployee')"
            class="w-full"
          />
        </UFormField>
        <UFormField :label="$t('common.name')" name="name" required>
          <UInput v-model="form.name" :placeholder="$t('component.user.updateModal.namePlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('common.email')" name="email" required>
          <UInput v-model="form.email" type="email" :placeholder="$t('component.user.updateModal.emailPlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('component.user.updateModal.newPassword')" name="password">
          <UInput v-model="form.password" type="password" :placeholder="$t('component.user.updateModal.passwordPlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('common.status')" name="isActive">
          <div class="flex items-center gap-2">
            <USwitch v-model="form.isActive" />
            <span class="text-sm text-neutral-600">{{ form.isActive ? $t('common.active') : $t('common.inactive') }}</span>
          </div>
        </UFormField>
        <UFormField :label="$t('common.role')" name="roleId">
          <USelectMenu
            v-model="selectedRole"
            :items="roleOptions"
            :placeholder="$t('component.user.updateModal.selectRole')"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton :label="$t('common.cancel')" @click="() => { open = false }" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="update-user-form"
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
import { userService } from '~/services/user-service'
import { roleService } from '~/services/role-service'
import { employeeService } from '~/services/employee-service'
import type { User, UserPayload } from '~/types/user'
import type { Role } from '~/types/role'
import type { Employee } from '~/types/employee'

const { t } = useI18n()

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  user: User | null
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
// Schema for updating (password is optional, min 6 if filled)
const schema = computed(() => z.object({
  name: z.string().min(1, t('common.nameRequired')),
  email: z.string().min(1, t('component.user.updateModal.emailRequired')).email(t('component.user.updateModal.emailInvalid')),
  password: z.string().min(6, t('component.user.updateModal.passwordMin')).optional().or(z.literal('')),
  isActive: z.boolean()
}))

const roles = ref<Role[]>([])
const roleOptions = computed(() => 
  roles.value.map(r => ({ label: r.name, value: r.id }))
)

const employees = ref<Employee[]>([])
const employeeOptions = computed(() => 
  employees.value.map(e => ({ label: `${e.name} (${e.employeeId})`, value: e.id }))
)

const form = reactive<UserPayload>({
  name: '',
  email: '',
  password: '',
  photo: null,
  isActive: true,
  roleId: null,
  employeeId: null
})

const selectedRole = computed({
  get: () => roleOptions.value.find(r => r.value === form.roleId),
  set: (val) => { form.roleId = val?.value as unknown as number ?? null }
})

const selectedEmployee = computed({
  get: () => employeeOptions.value.find(e => e.value === form.employeeId),
  set: (val) => {
    const prevId = form.employeeId
    form.employeeId = val?.value as unknown as number ?? null
    // Auto-populate fields when an employee is newly selected
    if (form.employeeId && form.employeeId !== prevId) {
      const emp = employees.value.find(e => e.id === form.employeeId)
      if (emp) {
        form.name = emp.name
        form.email = emp.email
        if (emp.photo) {
          previewUrl.value = emp.photo
          form.photo = emp.photo
        }
      }
    }
  }
})

const populateForm = () => {
  if (props.user) {
    form.name = props.user.name
    form.email = props.user.email
    form.password = ''
    form.photo = props.user.photo
    form.isActive = props.user.isActive
    form.roleId = props.user.role?.id || null
    form.employeeId = props.user.employee?.id || null
    previewUrl.value = props.user.photo
  }
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

const fetchEmployees = async () => {
  try {
    const response = await employeeService.getList()
    if (response.success) {
      employees.value = response.data as any
    }
  } catch (error) {
    // silently fail
  }
}

const onFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
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
  if (!props.user) return
  isSubmitting.value = true

  // Build payload
  const payload: UserPayload = {
    name: form.name,
    email: form.email,
    photo: form.photo,
    isActive: form.isActive,
    roleId: form.roleId,
    employeeId: form.employeeId
  }

  // Only send password if user filled it
  if (form.password && form.password.trim() !== '') {
    payload.password = form.password
  }

  try {
    const response = await userService.update(props.user.id, payload)
    if (response.success) {
      toast.add({
        title: t('component.user.updateModal.success'),
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
    fetchRoles()
    fetchEmployees()
  } else {
    previewUrl.value = null
  }
})
</script>
