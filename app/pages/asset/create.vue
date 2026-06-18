<template>
  <div class="space-y-6">
    <Header
      title="Add New Asset"
      description="Create a new asset record"
    />

    <div class="max-w-2xl bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
      <!-- Image Upload Section -->
      <div class="flex flex-col items-center justify-center pb-4 space-y-2 border-b border-neutral-100 mb-6">
        <div class="relative group cursor-pointer" @click="triggerFileInput">
          <div class="w-48 h-32 rounded-lg overflow-hidden border-2 border-neutral-200 hover:border-primary/50 transition-colors duration-200 flex items-center justify-center bg-neutral-50 relative">
            <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover" />
            <div v-else class="flex flex-col items-center justify-center text-neutral-400">
              <UIcon name="i-lucide-image" class="w-10 h-10" />
              <span class="text-xs mt-1">Upload Asset Image</span>
            </div>
            
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <UIcon name="i-lucide-camera" class="w-6 h-6 text-white" />
            </div>

            <div v-if="isUploading" class="absolute inset-0 bg-black/50 flex items-center justify-center">
              <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-white animate-spin" />
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton size="xs" color="neutral" variant="outline" @click="triggerFileInput" icon="i-lucide-upload">Choose Image</UButton>
          <UButton v-if="previewUrl || form.image" size="xs" color="error" variant="outline" @click="removeImage" icon="i-lucide-trash">Remove</UButton>
        </div>
        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileChange" />
      </div>

      <UForm id="create-asset-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Code" name="code" required>
            <UInput v-model="form.code" placeholder="e.g. AST-001" class="w-full" />
          </UFormField>
          <UFormField label="Name" name="name" required>
            <UInput v-model="form.name" placeholder="Asset name" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Category" required>
            <USelect
              v-model="selectedCategoryId"
              :items="categoryOptions"
              placeholder="Select category"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Sub Category" name="subCategoryId" required>
            <USelect
              v-model="form.subCategoryId"
              :items="subCategoryOptions"
              placeholder="Select sub category"
              :disabled="!selectedCategoryId || isLoadingSubCategories"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Purchase Date" name="purchaseDate">
            <UInput v-model="form.purchaseDate" type="date" class="w-full" />
          </UFormField>
          <span class="hidden md:inline-block"></span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Brand" name="brand">
            <UInput v-model="form.brand" placeholder="e.g. Apple" class="w-full" />
          </UFormField>
          <UFormField label="Model" name="model">
            <UInput v-model="form.model" placeholder="e.g. MacBook Pro" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Modal (Capital/Cost)" name="modal">
            <UInput v-model="form.modal" type="number" placeholder="Cost price" class="w-full" />
          </UFormField>
          <UFormField label="Price" name="price">
            <UInput v-model="form.price" type="number" placeholder="Asset value" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Description" name="description">
          <UTextarea v-model="form.description" placeholder="Description of the asset..." class="w-full" :rows="3" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-4 border-t border-neutral-100">
          <UButton label="Cancel" to="/asset" color="neutral" variant="outline" />
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
            :disabled="isUploading"
          >
            Save Asset
          </UButton>
        </div>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { assetService } from '~/services/asset-service'
import { categoryService } from '~/services/category-service'
import { subCategoryService } from '~/services/sub-category-service'
import type { AssetPayload } from '~/types/asset'

definePageMeta({
  layout: 'dashboard'
})

const toast = useToast()
const isSubmitting = ref(false)
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)

// Category & Sub Category API state
const selectedCategoryId = ref<number | undefined>(undefined)
const categoryOptions = ref<{ label: string; value: number }[]>([])
const subCategoryOptions = ref<{ label: string; value: number }[]>([])
const isLoadingSubCategories = ref(false)

watch(selectedCategoryId, async (newVal) => {
  if (!newVal) {
    subCategoryOptions.value = []
    form.subCategoryId = undefined as unknown as number
    return
  }
  isLoadingSubCategories.value = true
  try {
    const res = await subCategoryService.getAll(1, 999, '', Number(newVal))
    if (res.success) {
      subCategoryOptions.value = res.data.map((s) => ({
        label: s.name,
        value: s.id,
      }))
    }
  } finally {
    isLoadingSubCategories.value = false
  }

  // Reset selected sub-category if it is no longer valid in the newly fetched sub-categories list
  if (form.subCategoryId && !subCategoryOptions.value.some((s) => s.value === form.subCategoryId)) {
    form.subCategoryId = undefined as unknown as number
  }
})

const schema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  subCategoryId: z.number().int().positive('Sub category is required'),
  brand: z.string().optional().nullable().or(z.literal('')),
  model: z.string().optional().nullable().or(z.literal('')),
  modal: z.preprocess((val) => (val === '' || val === null || val === undefined) ? null : Number(val), z.number().int().nullable().optional()),
  price: z.preprocess((val) => (val === '' || val === null || val === undefined) ? null : Number(val), z.number().int().nullable().optional()),
  purchaseDate: z.string().optional().nullable().or(z.literal('')),
  description: z.string().optional().nullable().or(z.literal('')),
})

const form = reactive<AssetPayload>({
  code: '',
  name: '',
  description: '',
  modal: undefined,
  price: undefined,
  purchaseDate: '',
  brand: '',
  model: '',
  image: null,
  subCategoryId: undefined as unknown as number,
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const fetchCategories = async () => {
  const catRes = await categoryService.getAll(1, 999)
  if (catRes.success) {
    categoryOptions.value = catRes.data.map((c) => ({
      label: c.name,
      value: c.id,
    }))
  }
}

const onFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  previewUrl.value = URL.createObjectURL(file)
  isUploading.value = true
  try {
    const response = await assetService.uploadImage(file)
    if (response.success && response.data?.path) {
      form.image = response.data.path
      toast.add({
        title: 'Image uploaded successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    } else {
      toast.add({
        title: 'Failed to upload image',
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    }
  } catch (error) {
    toast.add({
      title: 'Failed to upload image',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isUploading.value = false
  }
}

const removeImage = () => {
  form.image = null
  previewUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await assetService.create(form)
    if (response.success) {
      toast.add({
        title: 'Asset created successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      navigateTo('/asset')
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>
