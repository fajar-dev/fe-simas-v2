<template>
  <UModal
    :title="$t('component.assetHolder.updateModal.title')"
    :description="$t('component.assetHolder.updateModal.description')"
    v-model:open="open"
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="update-asset-holder-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
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

        <!-- Assign Note Field -->
        <UFormField :label="$t('component.assetHolder.assignModal.assignmentNotes')" name="assignNote">
          <UTextarea v-model="form.assignNote" :placeholder="$t('component.assetHolder.assignModal.notesPlaceholder')" class="w-full" :rows="3" />
        </UFormField>

        <!-- Return fields — only editable once the record has actually been returned -->
        <template v-if="isReturned">
          <USeparator />

          <UFormField :label="$t('component.assetHolder.returnModal.returnDate')" name="returnedDate" required>
            <UInput type="datetime-local" v-model="form.returnedDate" class="w-full" />
          </UFormField>

          <UFormField :label="$t('component.assetHolder.returnModal.returnNotes')" name="returnNote">
            <UTextarea v-model="form.returnNote" :placeholder="$t('component.assetHolder.returnModal.notesPlaceholder')" class="w-full" :rows="3" />
          </UFormField>
        </template>

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
        <UButton :label="$t('common.save')" type="submit" form="update-asset-holder-form" color="primary" :loading="isSubmitting" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { assetHolderService } from '~/services/asset-holder-service'
import { employeeService } from '~/services/employee-service'
import { organizationService } from '~/services/organization-service'
import type { AssetHolder } from '~/types/asset-holder'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  holder: AssetHolder | null
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()

const isReturned = computed(() => !!props.holder?.returnedDate)

// State
const isSubmitting = ref(false)
const isLoadingEmployees = ref(false)
const isLoadingOrganizations = ref(false)

const employeeOptions = ref<{
  label: string
  value: number
  avatar?: { src: string; alt: string; loading?: 'lazy' | 'eager' }
  photo?: { src: string; alt: string; loading?: 'lazy' | 'eager' }
}[]>([])
const organizationOptions = ref<{ label: string; value: number }[]>([])

const selectedEmployee = ref<{ label: string; value: number; avatar?: any; photo?: any } | undefined>(undefined)
const selectedOrganization = ref<{ label: string; value: number } | undefined>(undefined)
const uploadedAttachments = ref<Attachment[]>([])

const holderKindOptions = computed(() => [
  { label: t('common.employee'), value: 'employee' as const },
  { label: t('common.organization'), value: 'organization' as const },
])

const schema = z.object({
  holderKind: z.enum(['employee', 'organization']),
  employeeId: z.number().int().positive().optional(),
  organizationId: z.number().int().positive().optional(),
  assignedDate: z.string().min(1, t('component.assetHolder.assignModal.dateRequired')),
  assignNote: z.string().optional().or(z.literal('')),
  returnedDate: z.string().optional().or(z.literal('')),
  returnNote: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.holderKind === 'employee' && !data.employeeId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('component.assetHolder.assignModal.employeeRequired'), path: ['employeeId'] })
  }
  if (data.holderKind === 'organization' && !data.organizationId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('component.assetHolder.assignModal.organizationRequired'), path: ['organizationId'] })
  }
})

const form = reactive({
  holderKind: 'employee' as 'employee' | 'organization',
  employeeId: undefined as number | undefined,
  organizationId: undefined as number | undefined,
  assignedDate: '',
  assignNote: '',
  returnedDate: '',
  returnNote: '',
  attachmentIds: [] as number[],
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

const loadEmployees = async () => {
  isLoadingEmployees.value = true
  try {
    const res = await employeeService.getList(true)
    if (res.success && res.data) {
      employeeOptions.value = res.data.map(e => ({
        label: `${e.name} (${e.employeeId})`,
        value: e.id,
        photo: e.photo ? { src: e.photo, alt: e.name, loading: 'lazy' as const } : undefined,
        avatar: e.photo ? { src: e.photo, alt: e.name, loading: 'lazy' as const } : undefined
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

const populateForm = () => {
  if (!props.holder) return

  form.holderKind = props.holder.holderKind
  form.employeeId = props.holder.employee?.id
  form.organizationId = props.holder.organization?.id
  form.assignedDate = props.holder.assignedDate
  form.assignNote = props.holder.assignNote || ''
  form.returnedDate = props.holder.returnedDate || ''
  form.returnNote = props.holder.returnNote || ''
  form.attachmentIds = props.holder.attachments?.map(a => a.id) || []
  uploadedAttachments.value = props.holder.attachments || []

  selectedEmployee.value = props.holder.employee
    ? employeeOptions.value.find(o => o.value === props.holder!.employee!.id)
    : undefined
  selectedOrganization.value = props.holder.organization
    ? organizationOptions.value.find(o => o.value === props.holder!.organization!.id)
    : undefined
}

const handleSubmit = async () => {
  if (!props.holder) return
  isSubmitting.value = true
  try {
    const response = await assetHolderService.update(props.holder.id, {
      holderKind: form.holderKind,
      employeeId: form.holderKind === 'employee' ? form.employeeId : null,
      organizationId: form.holderKind === 'organization' ? form.organizationId : null,
      assignedDate: form.assignedDate,
      assignNote: form.assignNote,
      ...(isReturned.value ? {
        returnedDate: form.returnedDate,
        returnNote: form.returnNote,
      } : {}),
      attachmentIds: form.attachmentIds,
    })
    if (response.success) {
      toast.add({
        title: t('component.assetHolder.updateModal.success'),
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

watch([open, () => props.holder], async ([isOpen, currentHolder]) => {
  if (isOpen && currentHolder) {
    await Promise.all([loadEmployees(), loadOrganizations()])
    populateForm()
  }
}, { immediate: true })
</script>
