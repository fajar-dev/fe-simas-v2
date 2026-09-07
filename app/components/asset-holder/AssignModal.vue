<template>
  <UModal 
    :title="$t('component.assetHolder.assignModal.title')"
    :description="$t('component.assetHolder.assignModal.description')"
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="assign-asset-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
        <!-- Asset Field (Only shown if not locked to a specific asset) -->
        <UFormField v-if="!lockAssetId" :label="$t('common.asset')" name="assetId" required>
          <USelectMenu
            v-model="selectedAsset"
            :items="assetOptions"
            searchable
            :searchable-placeholder="$t('common.search')"
            :placeholder="$t('component.assetHolder.assignModal.selectAsset')"
            :loading="isLoadingAssets"
            class="w-full"
          />
        </UFormField>

        <!-- Holder Kind Field -->
        <UFormField :label="$t('component.assetHolder.assignModal.holderKind')" name="holderKind" required>
          <URadioGroup v-model="form.holderKind" :items="holderKindOptions" orientation="horizontal" />
        </UFormField>

        <!-- Employee Field -->
        <UFormField v-if="form.holderKind === 'employee'" :label="$t('common.employee')" name="employeeId" required>
          <USelectMenu
            v-model="selectedEmployee"
            :items="employeeOptions"
            :avatar="selectedEmployee?.avatar"
            searchable
            :searchable-placeholder="$t('common.search')"
            :placeholder="$t('component.assetHolder.assignModal.selectEmployee')"
            :loading="isLoadingEmployees"
            class="w-full"
          />
        </UFormField>

        <!-- Organization Field -->
        <UFormField v-else :label="$t('common.organization')" name="organizationId" required>
          <USelectMenu
            v-model="selectedOrganization"
            :items="organizationOptions"
            searchable
            :searchable-placeholder="$t('common.search')"
            :placeholder="$t('component.assetHolder.assignModal.selectOrganization')"
            :loading="isLoadingOrganizations"
            class="w-full"
          />
        </UFormField>

        <!-- Assigned Date Field -->
        <UFormField :label="$t('component.assetHolder.assignModal.assignmentDate')" name="assignedDate" required>
          <UInput type="datetime-local" v-model="form.assignedDate" class="w-full" />
        </UFormField>

        <!-- Note Field -->
        <UFormField :label="$t('component.assetHolder.assignModal.assignmentNotes')" name="assignNote">
          <UTextarea v-model="form.assignNote" :placeholder="$t('component.assetHolder.assignModal.notesPlaceholder')" class="w-full" :rows="3" />
        </UFormField>

        <!-- Attachment Manager -->
        <AttachmentManager
          v-model="uploadedAttachments"
          @change="onAttachmentsChanged"
        />
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton :label="$t('common.cancel')" @click="() => { open = false }" color="neutral" variant="outline" />
        <UButton :label="$t('common.save')" type="submit" form="assign-asset-form" color="primary" :loading="isSubmitting" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { assetHolderService } from '~/services/asset-holder-service'
import { employeeService } from '~/services/employee-service'
import { organizationService } from '~/services/organization-service'
import { assetService } from '~/services/asset-service'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  lockAssetId?: number
}>()

const emit = defineEmits<{ created: [] }>()
const toast = useToast()

// State
const isSubmitting = ref(false)
const isLoadingAssets = ref(false)
const isLoadingEmployees = ref(false)
const isLoadingOrganizations = ref(false)

const assetOptions = ref<{ label: string; value: number }[]>([])
const employeeOptions = ref<{
  label: string
  value: number
  avatar?: { src: string; alt: string; loading?: 'lazy' | 'eager' }
  photo?: { src: string; alt: string; loading?: 'lazy' | 'eager' }
}[]>([])
const organizationOptions = ref<{ label: string; value: number }[]>([])

const selectedAsset = ref<{ label: string; value: number } | undefined>(undefined)
const selectedEmployee = ref<{ label: string; value: number; avatar?: any; photo?: any } | undefined>(undefined)
const selectedOrganization = ref<{ label: string; value: number } | undefined>(undefined)
const uploadedAttachments = ref<Attachment[]>([])

const holderKindOptions = computed(() => [
  { label: t('common.employee'), value: 'employee' as const },
  { label: t('common.organization'), value: 'organization' as const },
])

const schema = z.object({
  assetId: z.number().int().positive(t('component.assetHolder.assignModal.assetRequired')),
  holderKind: z.enum(['employee', 'organization']),
  employeeId: z.number().int().positive().optional(),
  organizationId: z.number().int().positive().optional(),
  assignedDate: z.string().min(1, t('component.assetHolder.assignModal.dateRequired')),
  assignNote: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.holderKind === 'employee' && !data.employeeId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('component.assetHolder.assignModal.employeeRequired'), path: ['employeeId'] })
  }
  if (data.holderKind === 'organization' && !data.organizationId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('component.assetHolder.assignModal.organizationRequired'), path: ['organizationId'] })
  }
})

const form = reactive({
  assetId: undefined as unknown as number,
  holderKind: 'employee' as 'employee' | 'organization',
  employeeId: undefined as number | undefined,
  organizationId: undefined as number | undefined,
  assignedDate: getLocalDatetimeString(), // Default to current date & time
  assignNote: '',
  attachmentIds: [] as number[],
})

// Sync selections with form fields
watch(selectedAsset, (val) => {
  if (val) form.assetId = val.value
})

watch(selectedEmployee, (val) => {
  if (val) form.employeeId = val.value
})

watch(selectedOrganization, (val) => {
  if (val) form.organizationId = val.value
})

// Keep employeeId/organizationId mutually exclusive.
watch(() => form.holderKind, (kind) => {
  if (kind === 'employee') {
    form.organizationId = undefined
    selectedOrganization.value = undefined
  } else {
    form.employeeId = undefined
    selectedEmployee.value = undefined
  }
})

const onAttachmentsChanged = (ids: number[]) => {
  form.attachmentIds = ids
}

const loadAssets = async () => {
  isLoadingAssets.value = true
  try {
    const res = await assetService.getAll(1, 200)
    if (res.success && res.data) {
      assetOptions.value = res.data.map(a => ({
        label: `${a.code} - ${a.name}`,
        value: a.id
      }))
    }
  } finally {
    isLoadingAssets.value = false
  }
}

const loadEmployees = async () => {
  isLoadingEmployees.value = true
  try {
    const res = await employeeService.getList(true)
    if (res.success && res.data) {
      employeeOptions.value = res.data.map(e => ({
        label: `${e.name} (${e.employeeId})`,
        value: e.id,
        photo: e.photo ? {
          src: e.photo,
          alt: e.name,
          loading: 'lazy' as const
        } : undefined,
        avatar: e.photo ? {
          src: e.photo,
          alt: e.name,
          loading: 'lazy' as const
        } : undefined
      }))
    }
  } finally {
    isLoadingEmployees.value = false
  }
}

const loadOrganizations = async () => {
  isLoadingOrganizations.value = true
  try {
    const res = await organizationService.getList()
    if (res.success && res.data) {
      organizationOptions.value = res.data
        .filter(o => o.isActive)
        .map(o => ({ label: o.name, value: o.id }))
    }
  } finally {
    isLoadingOrganizations.value = false
  }
}

const resetForm = () => {
  form.assetId = props.lockAssetId ? props.lockAssetId : (undefined as unknown as number)
  form.holderKind = 'employee'
  form.employeeId = undefined
  form.organizationId = undefined
  form.assignedDate = getLocalDatetimeString()
  form.assignNote = ''
  form.attachmentIds = []
  selectedAsset.value = undefined
  selectedEmployee.value = undefined
  selectedOrganization.value = undefined
  uploadedAttachments.value = []
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await assetHolderService.create({
      assetId: form.assetId,
      holderKind: form.holderKind,
      employeeId: form.holderKind === 'employee' ? form.employeeId : undefined,
      organizationId: form.holderKind === 'organization' ? form.organizationId : undefined,
      assignedDate: form.assignedDate,
      assignNote: form.assignNote,
      attachmentIds: form.attachmentIds,
    })
    if (response.success) {
      toast.add({
        title: t('component.assetHolder.assignModal.success'),
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
    resetForm()
    loadEmployees()
    loadOrganizations()
    if (props.lockAssetId) {
      form.assetId = props.lockAssetId
    } else {
      loadAssets()
    }
  }
})
</script>
