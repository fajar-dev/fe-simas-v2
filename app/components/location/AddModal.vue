<template>
  <UModal 
    title="Add Location"
    description="Fill in the details to create a new location."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="add-location-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField label="Branch" name="branchId" required>
          <USelect
            v-model="form.branchId"
            :items="branchOptions"
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
          form="add-location-form"
          color="primary"
          :loading="isSubmitting"
        >
          Save Location
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

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

const branchOptions = ref<{ label: string; value: number }[]>([])

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

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.branchId = undefined as unknown as number
}

const fetchBranches = async () => {
  const response = await branchService.getAll(1, 999)
  if (response.success) {
    branchOptions.value = response.data.map((b) => ({
      label: `[${b.code}] ${b.name}`,
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
        title: 'Location created successfully!',
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
