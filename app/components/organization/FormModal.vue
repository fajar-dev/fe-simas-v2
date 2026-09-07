<template>
  <UModal
    v-model:open="open"
    :title="isEdit ? $t('component.organization.formModal.editTitle') : $t('component.organization.formModal.addTitle')"
    :description="isEdit ? $t('component.organization.formModal.editDescription') : $t('component.organization.formModal.addDescription')"
    :ui="{ content: 'sm:max-w-md', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <UForm id="organization-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField :label="$t('common.name')" name="name" required>
          <UInput v-model="form.name" :placeholder="$t('component.organization.formModal.namePlaceholder')" class="w-full" />
        </UFormField>

        <UFormField :label="$t('pages.organization.type')" name="type" required>
          <UInput v-model="form.type" :placeholder="$t('component.organization.formModal.typePlaceholder')" class="w-full" />
        </UFormField>

        <UFormField :label="$t('pages.organization.parent')" name="parentId">
          <USelectMenu
            v-model="selectedParent"
            :items="parentOptions"
            searchable
            :searchable-placeholder="$t('common.search')"
            :placeholder="$t('component.organization.formModal.parentPlaceholder')"
            :loading="isLoadingParents"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('common.description')" name="description">
          <UTextarea v-model="form.description" :placeholder="$t('common.enterDescription')" class="w-full" :rows="3" />
        </UFormField>

        <UFormField :label="$t('pages.organization.active')" name="isActive">
          <USwitch v-model="form.isActive" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton :label="$t('common.cancel')" color="neutral" variant="outline" @click="() => { open = false }" />
        <UButton :label="$t('common.save')" type="submit" form="organization-form" color="primary" :loading="isSubmitting" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { organizationService } from '~/services/organization-service'
import type { Organization, OrganizationOption, OrganizationPayload } from '~/types/organization'

const { t } = useI18n()
const toast = useToast()

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  organization?: Organization | null
  /** Pre-select this parent when creating (e.g. "Add child" from a tree row). */
  defaultParentId?: number | null
}>()

const emit = defineEmits<{ saved: [] }>()

const isEdit = computed(() => !!props.organization)
const isSubmitting = ref(false)
const isLoadingParents = ref(false)

type ParentOption = { label: string; value: number | null }
const noParentOption: ParentOption = { label: t('component.organization.formModal.noParent'), value: null }
const parentOptions = ref<ParentOption[]>([noParentOption])
const selectedParent = ref<ParentOption>(noParentOption)

const schema = z.object({
  name: z.string().min(1, t('common.nameRequired')),
  type: z.string().min(1, t('component.organization.formModal.typeRequired')),
})

interface OrganizationFormState {
  name: string
  type: string
  description: string
  parentId: number | null
  isActive: boolean
}

const form = reactive<OrganizationFormState>({
  name: '',
  type: '',
  description: '',
  parentId: null,
  isActive: true,
})

watch(selectedParent, (val) => { form.parentId = val?.value ?? null })

// Descendants of the org being edited can't be picked as its new parent (would create a cycle) —
// the backend also rejects this, but filtering it out here avoids a round-trip error.
const descendantIds = (all: OrganizationOption[], rootId: number): Set<number> => {
  const childrenMap = new Map<number, number[]>()
  for (const o of all) {
    if (o.parentId != null) {
      if (!childrenMap.has(o.parentId)) childrenMap.set(o.parentId, [])
      childrenMap.get(o.parentId)!.push(o.id)
    }
  }
  const result = new Set<number>()
  const stack = [...(childrenMap.get(rootId) || [])]
  while (stack.length) {
    const current = stack.pop()!
    result.add(current)
    stack.push(...(childrenMap.get(current) || []))
  }
  return result
}

const loadParentOptions = async () => {
  isLoadingParents.value = true
  try {
    const res = await organizationService.getList()
    if (res.success && res.data) {
      let excluded = new Set<number>()
      if (props.organization) {
        excluded = descendantIds(res.data, props.organization.id)
        excluded.add(props.organization.id)
      }
      const options = res.data
        .filter((o) => !excluded.has(o.id))
        .map((o) => ({ label: o.name, value: o.id }))
      parentOptions.value = [noParentOption, ...options]
    }
  } finally {
    isLoadingParents.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.type = ''
  form.description = ''
  form.parentId = props.defaultParentId ?? null
  form.isActive = true
  selectedParent.value = noParentOption
}

const hydrateFromOrganization = (org: Organization) => {
  form.name = org.name
  form.type = org.type
  form.description = org.description || ''
  form.parentId = org.parentId
  form.isActive = org.isActive
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const payload: OrganizationPayload = {
      name: form.name,
      type: form.type,
      description: form.description || null,
      parentId: form.parentId,
      isActive: form.isActive,
    }

    const res = props.organization
      ? await organizationService.update(props.organization.id, payload)
      : await organizationService.create(payload)

    if (res.success) {
      toast.add({
        title: props.organization ? t('component.organization.formModal.updateSuccess') : t('component.organization.formModal.createSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check',
      })
      emit('saved')
      open.value = false
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, async (val) => {
  if (!val) return
  await loadParentOptions()
  if (props.organization) {
    hydrateFromOrganization(props.organization)
    selectedParent.value = parentOptions.value.find((o) => o.value === props.organization!.parentId) || noParentOption
  } else {
    resetForm()
    selectedParent.value = parentOptions.value.find((o) => o.value === form.parentId) || noParentOption
  }
})
</script>
