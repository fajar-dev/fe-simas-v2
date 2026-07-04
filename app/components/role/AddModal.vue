<template>
  <UModal 
    :title="$t('component.role.addModal.title')"
    :description="$t('component.role.addModal.description')"
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="add-role-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
        <UFormField :label="$t('common.name')" name="name" required>
          <UInput v-model="form.name" :placeholder="$t('component.role.addModal.namePlaceholder')" class="w-full" />
        </UFormField>

        <div class="space-y-3">
          <label class="text-sm font-medium text-neutral-700">{{ $t('common.permissions') }}</label>

          <!-- Select All -->
          <div class="border border-neutral-200 rounded-lg p-3">
            <UCheckbox
              :model-value="isAllSelected"
              :indeterminate="isSomeSelected && !isAllSelected"
              :label="$t('common.selectAll')"
              @update:model-value="toggleAll"
            />
          </div>

          <!-- Loading state -->
          <div v-if="isLoadingPermissions" class="flex items-center justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-neutral-400" />
            <span class="ml-2 text-sm text-neutral-500">{{ $t('component.role.addModal.loadingPermissions') }}</span>
          </div>

          <!-- Permission Groups by Module -->
          <div v-else class="space-y-3">
            <div 
              v-for="(perms, moduleName) in groupedPermissions" 
              :key="moduleName"
              class="border border-neutral-200 rounded-lg p-3 space-y-2"
            >
              <!-- Module Header with Select All for module -->
              <div class="flex items-center gap-2 border-b border-neutral-100 pb-2">
                <UCheckbox
                  :model-value="isModuleAllSelected(moduleName)"
                  :indeterminate="isModuleSomeSelected(moduleName) && !isModuleAllSelected(moduleName)"
                  :label="formatModuleName(moduleName)"
                  @update:model-value="toggleModule(moduleName)"
                  :ui="{ label: 'font-semibold text-neutral-900 capitalize' }"
                />
              </div>

              <!-- Permission Checkboxes -->
              <div class="flex flex-wrap gap-x-4 gap-y-1 pl-6">
                <UCheckbox
                  v-for="perm in perms"
                  :key="perm.id"
                  :model-value="form.permissionIds.includes(perm.id)"
                  :label="formatActionName(perm.action)"
                  @update:model-value="togglePermission(perm.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton :label="$t('common.cancel')" @click="() => { open = false }" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="add-role-form"
          color="primary"
          :loading="isSubmitting"
        >
          {{ $t('component.role.addModal.submit') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { roleService } from '~/services/role-service'
import type { Permission } from '~/types/role'

const { t } = useI18n()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const toast = useToast()
const isSubmitting = ref(false)
const isLoadingPermissions = ref(false)

const permissions = ref<Permission[]>([])

const schema = computed(() => z.object({
  name: z.string().min(1, t('common.nameRequired')),
  permissionIds: z.array(z.number())
}))

const form = reactive({
  name: '',
  permissionIds: [] as number[]
})

const resetForm = () => {
  form.name = ''
  form.permissionIds = []
}

// Group permissions by module
const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {}
  for (const perm of permissions.value) {
    if (!groups[perm.module]) {
      groups[perm.module] = []
    }
    groups[perm.module]!.push(perm)
  }
  return groups
})

// Select all logic
const allPermissionIds = computed(() => permissions.value.map(p => p.id))
const isAllSelected = computed(() => 
  allPermissionIds.value.length > 0 && allPermissionIds.value.every(id => form.permissionIds.includes(id))
)
const isSomeSelected = computed(() => 
  form.permissionIds.length > 0
)

const toggleAll = (checked: boolean | 'indeterminate') => {
  if (checked) {
    form.permissionIds = [...allPermissionIds.value]
  } else {
    form.permissionIds = []
  }
}

// Module select all logic
const isModuleAllSelected = (moduleName: string) => {
  const modulePerms = groupedPermissions.value[moduleName] || []
  return modulePerms.length > 0 && modulePerms.every(p => form.permissionIds.includes(p.id))
}

const isModuleSomeSelected = (moduleName: string) => {
  const modulePerms = groupedPermissions.value[moduleName] || []
  return modulePerms.some(p => form.permissionIds.includes(p.id))
}

const toggleModule = (moduleName: string) => {
  const modulePerms = groupedPermissions.value[moduleName] || []
  const moduleIds = modulePerms.map(p => p.id)
  const allSelected = isModuleAllSelected(moduleName)

  if (allSelected) {
    form.permissionIds = form.permissionIds.filter(id => !moduleIds.includes(id))
  } else {
    const newIds = moduleIds.filter(id => !form.permissionIds.includes(id))
    form.permissionIds = [...form.permissionIds, ...newIds]
  }
}

// Single permission toggle
const togglePermission = (id: number) => {
  const index = form.permissionIds.indexOf(id)
  if (index > -1) {
    form.permissionIds.splice(index, 1)
  } else {
    form.permissionIds.push(id)
  }
}

// Format helpers
const formatModuleName = (name: string) => {
  return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const formatActionName = (action: string) => {
  return action.charAt(0).toUpperCase() + action.slice(1)
}

// Fetch permissions
const fetchPermissions = async () => {
  isLoadingPermissions.value = true
  try {
    const response = await roleService.getAllPermissions()
    if (response.success) {
      permissions.value = response.data
    }
  } finally {
    isLoadingPermissions.value = false
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await roleService.create(form)
    if (response.success) {
      toast.add({
        title: t('component.role.addModal.success'),
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
    fetchPermissions()
  } else {
    resetForm()
  }
})
</script>
