<template>
  <UModal 
    title="Add Sub Category"
    description="Fill in the details to create a new sub category."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="add-sub-category-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
        <UFormField label="Category" name="categoryId" required>
          <USelectMenu
            v-model="selectedCategory"
            :items="categoryOptions"
            searchable
            searchable-placeholder="Search category..."
            placeholder="Select category"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Code" name="code">
          <UInput v-model="form.code" placeholder="Auto-generated if empty" class="w-full" />
        </UFormField>
        <UFormField label="Name" name="name" required>
          <UInput v-model="form.name" placeholder="Enter sub category name" class="w-full" />
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
          form="add-sub-category-form"
          color="primary"
          :loading="isSubmitting"
        >
          Save Sub Category
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { subCategoryService } from '~/services/sub-category-service'
import { categoryService } from '~/services/category-service'
import type { SubCategoryPayload } from '~/types/sub-category'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

const categoryOptions = ref<{ label: string; value: number }[]>([])

const selectedCategory = computed({
  get: () => categoryOptions.value.find((c) => c.value === form.categoryId),
  set: (val) => {
    form.categoryId = val?.value as unknown as number
  }
})

const schema = z.object({
  categoryId: z.number().int().positive('Category is required'),
  code: z.string().optional().or(z.literal('')),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
})

const form = reactive<SubCategoryPayload>({
  code: '',
  name: '',
  description: '',
  categoryId: undefined as unknown as number,
})

const resetForm = () => {
  form.code = ''
  form.name = ''
  form.description = ''
  form.categoryId = undefined as unknown as number
}

const fetchCategories = async () => {
  const response = await categoryService.getList()
  if (response.success) {
    categoryOptions.value = response.data.map((c) => ({
      label: c.name,
      value: c.id,
    }))
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await subCategoryService.create(form)
    if (response.success) {
      toast.add({
        title: 'Sub category created successfully!',
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
    fetchCategories()
  } else {
    resetForm()
  }
})
</script>
