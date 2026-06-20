<template>
  <UModal 
    title="Edit Branch"
    description="Update the branch information below."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="update-branch-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField label="Code" name="code">
          <UInput v-model="form.code" placeholder="Auto-generated if empty" class="w-full" />
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
          form="update-branch-form"
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
import { branchService } from '~/services/branch-service'
import type { Branch, BranchPayload } from '~/types/branch'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  branch: Branch | null
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

const schema = z.object({
  code: z.string().optional().or(z.literal('')),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
})

const form = reactive<BranchPayload>({
  code: '',
  name: '',
  description: '',
})

const populateForm = () => {
  if (props.branch) {
    form.code = props.branch.code
    form.name = props.branch.name
    form.description = props.branch.description || ''
  }
}

const handleSubmit = async () => {
  if (!props.branch) return
  isSubmitting.value = true
  try {
    const response = await branchService.update(props.branch.id, form)
    if (response.success) {
      toast.add({
        title: 'Branch updated successfully!',
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
  }
})
</script>
