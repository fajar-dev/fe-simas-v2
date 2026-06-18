<template>
  <UModal 
    title="Add Branch"
    description="Fill in the details to create a new branch."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="add-branch-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField label="Code" name="code" required>
          <UInput v-model="form.code" placeholder="Enter branch code" class="w-full" />
        </UFormField>
        <UFormField label="Name" name="name" required>
          <UInput v-model="form.name" placeholder="Enter branch name" class="w-full" />
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
          form="add-branch-form"
          color="primary"
          :loading="isSubmitting"
        >
          Save Branch
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { branchService } from '~/services/branch-service'
import type { BranchPayload } from '~/types/branch'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

const schema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
})

const form = reactive<BranchPayload>({
  code: '',
  name: '',
  description: '',
})

const resetForm = () => {
  form.code = ''
  form.name = ''
  form.description = ''
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await branchService.create(form)
    if (response.success) {
      toast.add({
        title: 'Branch created successfully!',
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
  if (!val) resetForm()
})
</script>
