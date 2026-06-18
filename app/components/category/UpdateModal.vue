<template>
  <UModal 
    title="Edit Category"
    description="Update the category information below."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="update-category-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField label="Name" name="name" required>
          <UInput v-model="form.name" placeholder="Enter category name" class="w-full" />
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
          form="update-category-form"
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
import { categoryService } from '~/services/category-service'
import type { Category, CategoryPayload } from '~/types/category'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  category: Category | null
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
})

const form = reactive<CategoryPayload>({
  name: '',
  description: '',
})

const populateForm = () => {
  if (props.category) {
    form.name = props.category.name
    form.description = props.category.description || ''
  }
}

const handleSubmit = async () => {
  if (!props.category) return
  isSubmitting.value = true
  try {
    const response = await categoryService.update(props.category.id, form)
    if (response.success) {
      toast.add({
        title: 'Category updated successfully!',
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
