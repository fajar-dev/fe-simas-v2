<template>
  <div class="space-y-6">
    <Header
      title="Add New Asset"
      description="Create a new asset record"
    />

    <UCard class="w-full">
      <!-- Image Upload Section -->
      <div class="flex flex-col items-center justify-center pb-4 space-y-2 border-b border-neutral-100 mb-6">
        <div v-if="previewUrl" class="relative">
          <img :src="previewUrl" class="w-48 h-32 rounded-lg object-cover border-2 border-neutral-200" />
          <UButton
            icon="i-lucide-x"
            color="error"
            variant="solid"
            size="xs"
            class="absolute -top-1 -right-1 rounded-full"
            @click="removeImage"
          />
        </div>
        <UFileUpload
          v-else
          accept="image/*"
          icon="i-lucide-image"
          label="Choose an image"
          description="PNG, JPG up to 2MB"
          :loading="isUploading"
          @change="onFileChange"
        />
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
            <div class="flex items-center gap-2">
              <USelectMenu
                v-model="selectedCategory"
                :items="categoryOptions"
                searchable
                searchable-placeholder="Search category..."
                placeholder="Select category"
                class="w-full"
              />
              <UButton
                icon="i-lucide-plus"
                color="primary"
                variant="soft"
                size="sm"
                square
                @click="showAddCategory = true"
              />
            </div>
          </UFormField>
          <UFormField label="Sub Category" name="subCategoryId" required>
            <div class="flex items-center gap-2">
              <USelectMenu
                v-model="selectedSubCategory"
                :items="subCategoryOptions"
                searchable
                searchable-placeholder="Search sub category..."
                placeholder="Select sub category"
                :disabled="!selectedCategoryId || isLoadingSubCategories"
                class="w-full"
              />
              <UButton
                icon="i-lucide-plus"
                color="primary"
                variant="soft"
                size="sm"
                square
                @click="showAddSubCategory = true"
              />
            </div>
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
          <UFormField label="Price" name="price">
            <UInput v-model="form.price" type="number" placeholder="Asset value" class="w-full" />
          </UFormField>
          <span class="hidden md:inline-block"></span>
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
    </UCard>

    <!-- Add Category Modal -->
    <CategoryAddModal v-model="showAddCategory" @created="onCategoryCreated" />
    <!-- Add Sub Category Modal -->
    <SubCategoryAddModal v-model="showAddSubCategory" @created="onSubCategoryCreated" />
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

const previewUrl = ref<string | null>(null)
const showAddCategory = ref(false)
const showAddSubCategory = ref(false)

// Category & Sub Category API state
const selectedCategoryId = ref<number | undefined>(undefined)
const categoryOptions = ref<{ label: string; value: number }[]>([])
const subCategoryOptions = ref<{ label: string; value: number }[]>([])
const isLoadingSubCategories = ref(false)

const selectedCategory = computed({
  get: () => categoryOptions.value.find((c) => c.value === selectedCategoryId.value),
  set: (val) => {
    selectedCategoryId.value = val?.value
  }
})

const selectedSubCategory = computed({
  get: () => subCategoryOptions.value.find((s) => s.value === form.subCategoryId),
  set: (val) => {
    form.subCategoryId = val?.value as unknown as number
  }
})

watch(selectedCategoryId, async (newVal) => {
  if (!newVal) {
    subCategoryOptions.value = []
    form.subCategoryId = undefined as unknown as number
    return
  }
  isLoadingSubCategories.value = true
  try {
    const res = await subCategoryService.getByCategoryId(Number(newVal))
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
  price: z.preprocess((val) => (val === '' || val === null || val === undefined) ? null : Number(val), z.number().int().nullable().optional()),
  purchaseDate: z.string().optional().nullable().or(z.literal('')),
  description: z.string().optional().nullable().or(z.literal('')),
})

const form = reactive<AssetPayload>({
  code: '',
  name: '',
  description: '',
  price: undefined,
  purchaseDate: '',
  brand: '',
  model: '',
  image: null,
  subCategoryId: undefined as unknown as number,
})



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
    }
  }  finally {
    isUploading.value = false
  }
}

const removeImage = () => {
  form.image = null
  previewUrl.value = null
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

const onCategoryCreated = async () => {
  await fetchCategories()
  // Auto-select the last created category (most recent)
  const last = categoryOptions.value[categoryOptions.value.length - 1]
  if (last) {
    selectedCategoryId.value = last.value
  }
}

const onSubCategoryCreated = async () => {
  if (selectedCategoryId.value) {
    const res = await subCategoryService.getByCategoryId(Number(selectedCategoryId.value))
    if (res.success) {
      subCategoryOptions.value = res.data.map((s) => ({
        label: s.name,
        value: s.id,
      }))
      // Auto-select the last created sub-category
      const last = subCategoryOptions.value[subCategoryOptions.value.length - 1]
      if (last) {
        form.subCategoryId = last.value
      }
    }
  }
}

onMounted(() => {
  fetchCategories()
})
</script>
