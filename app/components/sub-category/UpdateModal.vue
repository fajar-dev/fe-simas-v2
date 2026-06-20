<template>
  <UModal 
    title="Edit Sub Category"
    description="Update the sub category information below."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="update-sub-category-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-3">
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
          form="update-sub-category-form"
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
import { subCategoryService } from '~/services/sub-category-service'
import { categoryService } from '~/services/category-service'
import type { SubCategory, SubCategoryPayload } from '~/types/sub-category'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  subCategory: SubCategory | null
}>()

const emit = defineEmits<{ updated: [] }>()
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

const fetchCategories = async () => {
  const response = await categoryService.getAll(1, 999)
  if (response.success) {
    categoryOptions.value = response.data.map((c) => ({
      label: c.name,
      value: c.id,
    }))
  }
}

const populateForm = () => {
  if (props.subCategory) {
    form.code = props.subCategory.code || ''
    form.name = props.subCategory.name
    form.description = props.subCategory.description || ''
    form.categoryId = props.subCategory.categoryId
  }
}

const handleSubmit = async () => {
  if (!props.subCategory) return
  isSubmitting.value = true
  try {
    const response = await subCategoryService.update(props.subCategory.id, form)
    if (response.success) {
      toast.add({
        title: 'Sub category updated successfully!',
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
    fetchCategories()
    populateForm()
  }
})
</script>
