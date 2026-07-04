<template>
  <UModal 
    :title="$t('component.location.addModal.title')"
    :description="$t('component.location.addModal.description')"
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="add-location-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField :label="$t('common.branch')" name="branchId" required>
          <USelectMenu
            v-model="selectedBranch"
            :items="branchOptions"
            searchable
            :searchable-placeholder="$t('component.location.addModal.searchBranch')"
            :placeholder="$t('component.location.addModal.selectBranch')"
            class="w-full"
          />
        </UFormField>
        <UFormField :label="$t('common.name')" name="name" required>
          <UInput v-model="form.name" :placeholder="$t('component.location.addModal.namePlaceholder')" class="w-full" />
        </UFormField>
        <UFormField :label="$t('common.description')" name="description">
          <UTextarea v-model="form.description" :placeholder="$t('common.enterDescription')" class="w-full" :rows="3" />
        </UFormField>
        <UFormField :label="$t('component.location.addModal.mistZoneIdLabel')" name="mistZoneId">
          <UInput :model-value="form.mistZoneId ?? undefined" @update:model-value="form.mistZoneId = $event || null" placeholder="Enter Mist Zone UUID" class="w-full" />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton :label="$t('common.cancel')" @click="() => { open = false }" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="add-location-form"
          color="primary"
          :loading="isSubmitting"
        >
          {{ $t('component.location.addModal.submit') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { locationService } from '~/services/location-service'
import { branchService } from '~/services/branch-service'
import type { LocationPayload } from '~/types/location'

const { t } = useI18n()

const props = defineProps<{
  defaultBranchId?: number
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

const branchOptions = ref<{ label: string; value: number }[]>([])

const selectedBranch = computed({
  get: () => branchOptions.value.find((b) => b.value === form.branchId),
  set: (val) => {
    form.branchId = val?.value as unknown as number
  }
})

const schema = computed(() => z.object({
  branchId: z.number().int().positive(t('component.location.addModal.branchRequired')),
  name: z.string().min(1, t('common.nameRequired')),
  description: z.string().optional().or(z.literal('')),
}))

const form = reactive<LocationPayload>({
  name: '',
  description: '',
  branchId: undefined as unknown as number,
  mistZoneId: null,
})

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.branchId = props.defaultBranchId || (undefined as unknown as number)
  form.mistZoneId = null
}

const fetchBranches = async () => {
  const response = await branchService.getList()
  if (response.success) {
    branchOptions.value = response.data.map((b) => ({
      label: b.name,
      value: b.id,
    }))
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await locationService.create(form)
    if (response.success) {
      toast.add({
        title: t('component.location.addModal.success'),
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
    fetchBranches()
  } else {
    resetForm()
  }
})
</script>
