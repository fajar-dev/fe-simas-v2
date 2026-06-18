<template>
  <UModal 
    title="Edit Location"
    description="Update the location information below."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="update-location-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField label="Branch" name="branchId" required>
          <USelectMenu
            v-model="selectedBranch"
            :items="branchOptions"
            searchable
            searchable-placeholder="Search branch..."
            placeholder="Select branch"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Name" name="name" required>
          <UInput v-model="form.name" placeholder="Enter location name" class="w-full" />
        </UFormField>
        <UFormField label="Description" name="description">
          <UTextarea v-model="form.description" placeholder="Enter description (optional)" class="w-full" :rows="3" />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton label="Cancel" @click="open = false" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="update-location-form"
          color="primary"
          :loading="isSubmitting"
        >
          Save Changes
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { locationService } from '~/services/location-service'
import { branchService } from '~/services/branch-service'
import type { Location, LocationPayload } from '~/types/location'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  location: Location | null
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

const branchOptions = ref<{ label: string; value: number }[]>([])

const selectedBranch = computed({
  get: () => branchOptions.value.find((b) => b.value === form.branchId),
  set: (val) => {
    form.branchId = val?.value as unknown as number
  }
})

const schema = z.object({
  branchId: z.number().int().positive('Branch is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
})

const form = reactive<LocationPayload>({
  name: '',
  description: '',
  branchId: undefined as unknown as number,
})

const fetchBranches = async () => {
  const response = await branchService.getAll(1, 999)
  if (response.success) {
    branchOptions.value = response.data.map((b) => ({
      label: `[${b.code}] ${b.name}`,
      value: b.id,
    }))
  }
}

const populateForm = () => {
  if (props.location) {
    form.name = props.location.name
    form.description = props.location.description || ''
    form.branchId = props.location.branchId
  }
}

const handleSubmit = async () => {
  if (!props.location) return
  isSubmitting.value = true
  try {
    const response = await locationService.update(props.location.id, form)
    if (response.success) {
      toast.add({
        title: 'Location updated successfully!',
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
    fetchBranches()
    populateForm()
  }
})
</script>
