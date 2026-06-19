<template>
  <div class="space-y-6">
    <Header title="Edit Asset" description="Update asset details below" />

    <div v-if="isLoadingAsset" class="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
      <UIcon name="i-lucide-loader-2" class="w-10 h-10 text-primary animate-spin" />
      <span class="text-neutral-500 text-sm mt-2">Loading asset details...</span>
    </div>

    <UCard v-else class="w-full">
      <UForm id="edit-asset-form" :schema="schema" :state="form" @submit="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

          <!-- ═══ Column 1: Identity ═══ -->
          <div class="space-y-4">
            <UFormField label="Code" name="code" required>
              <div class="relative w-full">
                <UInput v-model="form.code" placeholder="e.g. AST-001" class="w-full" />
                <div v-if="codeStatus" class="absolute right-2 top-1/2 -translate-y-1/2">
                  <UIcon v-if="codeStatus === 'checking'" name="i-lucide-loader-2" class="w-4 h-4 text-neutral-400 animate-spin" />
                  <UIcon v-else-if="codeStatus === 'available'" name="i-lucide-circle-check" class="w-4 h-4 text-green-500" />
                  <UIcon v-else-if="codeStatus === 'exists'" name="i-lucide-circle-x" class="w-4 h-4 text-red-500" />
                </div>
              </div>
              <p v-if="codeStatus === 'exists'" class="text-xs text-red-500 mt-1">Code "{{ form.code }}" already exists</p>
              <p v-else-if="codeStatus === 'available'" class="text-xs text-green-500 mt-1">Code available</p>
            </UFormField>

            <UFormField label="Name" name="name" required>
              <UInput v-model="form.name" placeholder="Asset name" class="w-full" />
            </UFormField>

            <UFormField label="Description" name="description">
              <UTextarea v-model="form.description" placeholder="Asset description (optional)" class="w-full" :rows="3" />
            </UFormField>

            <UFormField label="Brand" name="brand">
              <UInput v-model="form.brand" placeholder="Brand (optional)" class="w-full" />
            </UFormField>

            <UFormField label="Model" name="model">
              <UInput v-model="form.model" placeholder="Model (optional)" class="w-full" />
            </UFormField>
          </div>

          <!-- ═══ Column 2: Details ═══ -->
          <div class="space-y-4">
            <UFormField label="Price" name="price">
              <UInput v-model="priceDisplay" placeholder="0" class="w-full">
                <template #leading>
                  <span class="text-neutral-500 text-sm">Rp</span>
                </template>
              </UInput>
            </UFormField>

            <UFormField label="Purchase Date" name="purchaseDate">
              <UInputDate v-model="purchaseDateVal" class="w-full">
                <template #trailing>
                  <UPopover>
                    <UButton icon="i-lucide-calendar" color="neutral" variant="ghost" size="sm" square />
                    <template #content>
                      <UCalendar v-model="purchaseDateVal" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
            </UFormField>

            <div>
              <label class="text-sm font-medium text-neutral-700 mb-1.5 block">Asset Image</label>
              <div v-if="previewUrl" class="relative inline-block w-full">
                <img :src="previewUrl" class="w-full h-40 rounded-lg object-cover border border-neutral-200" />
                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="solid"
                  size="xs"
                  class="absolute top-1 right-1 rounded-full"
                  @click="removeImage"
                />
              </div>
              <UFileUpload
                v-else
                accept="image/*"
                icon="i-lucide-upload"
                label="Drop your image here"
                description="PNG, JPG up to 2MB"
                :loading="isUploading"
                class="w-full"
                @change="onFileChange"
              />
            </div>
          </div>

          <!-- ═══ Column 3: Classification ═══ -->
          <div class="space-y-4">
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
                <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" square @click="showAddCategory = true" />
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
                <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" square @click="showAddSubCategory = true" />
              </div>
            </UFormField>

            <!-- Labels -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-sm font-medium text-neutral-700">Labels</label>
                <UButton icon="i-lucide-plus" color="primary" variant="soft" size="xs" @click="addLabel">
                  Add
                </UButton>
              </div>
              <div v-if="labels.length === 0" class="text-sm text-neutral-400 py-3 text-center border border-dashed border-neutral-200 rounded-lg">
                No labels added yet
              </div>
              <div v-else class="space-y-2">
                <div v-for="(label, index) in labels" :key="index" class="flex items-center gap-2">
                  <UInput v-model="label.key" placeholder="Key" class="w-full" />
                  <UInput v-model="label.value" placeholder="Value" class="w-full" />
                  <UButton icon="i-lucide-trash" color="error" variant="ghost" size="sm" square @click="removeLabel(index)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-2 pt-4 mt-6 border-t border-neutral-100">
          <UButton label="Cancel" to="/asset" color="neutral" variant="outline" />
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
            :disabled="isUploading || codeStatus === 'exists'"
          >
            Save Changes
          </UButton>
        </div>
      </UForm>
    </UCard>

    <CategoryAddModal v-model="showAddCategory" @created="onCategoryCreated" />
    <SubCategoryAddModal v-model="showAddSubCategory" @created="onSubCategoryCreated" />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { parseDate } from '@internationalized/date'
import { useRoute } from 'vue-router'
import { assetService } from '~/services/asset-service'
import { categoryService } from '~/services/category-service'
import { subCategoryService } from '~/services/sub-category-service'
import type { AssetPayload, AssetLabel } from '~/types/asset'

definePageMeta({ layout: 'dashboard' })

// ── State ───────────────────────────────────────────────────────────────────
const route = useRoute()
const assetId = Number(route.params.id)
const toast = useToast()
const isSubmitting = ref(false)
const isUploading = ref(false)
const isLoadingAsset = ref(true)
const previewUrl = ref<string | null>(null)
const showAddCategory = ref(false)
const showAddSubCategory = ref(false)

// ── Labels ──────────────────────────────────────────────────────────────────
const labels = ref<AssetLabel[]>([])
const addLabel = () => { labels.value.push({ key: '', value: '' }) }
const removeLabel = (index: number) => { labels.value.splice(index, 1) }

// ── Code Validation ─────────────────────────────────────────────────────────
type CodeStatus = 'checking' | 'available' | 'exists' | null
const codeStatus = ref<CodeStatus>(null)
const originalCode = ref('')
let codeTimer: ReturnType<typeof setTimeout> | null = null

const validateCode = (code: string) => {
  if (codeTimer) clearTimeout(codeTimer)
  const trimmed = code?.trim()
  if (!trimmed) { codeStatus.value = null; return }
  // If code is same as original, no need to check
  if (trimmed === originalCode.value) { codeStatus.value = null; return }
  codeStatus.value = 'checking'
  codeTimer = setTimeout(async () => {
    const res = await assetService.checkCode(trimmed, assetId)
    if (form.code?.trim() === trimmed && res.success) {
      codeStatus.value = res.data.exists ? 'exists' : 'available'
    }
  }, 500)
}


// ── Category & Sub Category ─────────────────────────────────────────────────
const selectedCategoryId = ref<number | undefined>(undefined)
const categoryOptions = ref<{ label: string; value: number }[]>([])
const subCategoryOptions = ref<{ label: string; value: number }[]>([])
const isLoadingSubCategories = ref(false)
const lastFetchedCategoryId = ref<number | undefined>(undefined)

const selectedCategory = computed({
  get: () => categoryOptions.value.find((c) => c.value === selectedCategoryId.value),
  set: (val) => { selectedCategoryId.value = val?.value }
})

const selectedSubCategory = computed({
  get: () => subCategoryOptions.value.find((s) => s.value === form.subCategoryId),
  set: (val) => { form.subCategoryId = val?.value as unknown as number }
})

watch(selectedCategoryId, async (newVal) => {
  if (!newVal) {
    subCategoryOptions.value = []
    form.subCategoryId = undefined as unknown as number
    lastFetchedCategoryId.value = undefined
    return
  }
  if (lastFetchedCategoryId.value === Number(newVal)) return
  isLoadingSubCategories.value = true
  try {
    const res = await subCategoryService.getByCategoryId(Number(newVal))
    if (res.success) {
      subCategoryOptions.value = res.data.map((s) => ({ label: s.name, value: s.id }))
      lastFetchedCategoryId.value = Number(newVal)
    }
  } finally {
    isLoadingSubCategories.value = false
  }
  if (form.subCategoryId && !subCategoryOptions.value.some((s) => s.value === form.subCategoryId)) {
    form.subCategoryId = undefined as unknown as number
  }
})

// ── Schema & Form ───────────────────────────────────────────────────────────
const schema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  subCategoryId: z.number().int().positive('Sub category is required'),
  brand: z.string().optional().nullable().or(z.literal('')),
  model: z.string().optional().nullable().or(z.literal('')),
  price: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number().int().nullable().optional()
  ),
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

watch(() => form.code, (newCode) => validateCode(newCode))

const purchaseDateVal = computed({
  get: () => {
    if (!form.purchaseDate) return undefined
    try { return parseDate(form.purchaseDate) } catch { return undefined }
  },
  set: (val) => { form.purchaseDate = val ? val.toString() : '' }
})

const priceDisplay = computed({
  get: () => formatIndonesianNumber(form.price),
  set: (val) => { form.price = parseIndonesianNumber(val) as any }
})

// ── Data Fetching ───────────────────────────────────────────────────────────
const fetchCategories = async () => {
  const res = await categoryService.getAll(1, 999)
  if (res.success) {
    categoryOptions.value = res.data.map((c) => ({ label: c.name, value: c.id }))
  }
}

const fetchAssetDetails = async () => {
  isLoadingAsset.value = true
  try {
    const response = await assetService.getById(assetId)
    if (response.success && response.data) {
      const asset = response.data
      form.code = asset.code
      originalCode.value = asset.code
      form.name = asset.name
      form.description = asset.description ?? undefined
      form.price = asset.price ?? undefined
      form.purchaseDate = asset.purchaseDate ?? undefined
      form.brand = asset.brand ?? undefined
      form.model = asset.model ?? undefined
      form.image = asset.image

      const catId = asset.subCategory?.category?.id ?? undefined
      if (catId) {
        isLoadingSubCategories.value = true
        try {
          const res = await subCategoryService.getByCategoryId(catId)
          if (res.success) {
            subCategoryOptions.value = res.data.map((s) => ({ label: s.name, value: s.id }))
            lastFetchedCategoryId.value = catId
            selectedCategoryId.value = catId
          }
        } finally {
          isLoadingSubCategories.value = false
        }
      }

      form.subCategoryId = asset.subCategory?.id as number
      previewUrl.value = asset.image
      labels.value = (asset.labels || []).map(l => ({ key: l.key, value: l.value }))
    } else {
      toast.add({ title: 'Failed to load asset details', color: 'error', icon: 'i-lucide-circle-alert' })
      navigateTo('/asset')
    }
  } catch {
    toast.add({ title: 'Failed to load asset details', color: 'error', icon: 'i-lucide-circle-alert' })
    navigateTo('/asset')
  } finally {
    isLoadingAsset.value = false
  }
}

// ── Image Upload ────────────────────────────────────────────────────────────
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
      toast.add({ title: 'Image uploaded successfully!', color: 'success', icon: 'i-lucide-circle-check' })
    }
  } finally {
    isUploading.value = false
  }
}

const removeImage = () => {
  form.image = null
  previewUrl.value = null
}

// ── Submit ──────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      ...form,
      labels: labels.value.filter(l => l.key.trim() && l.value.trim()).map(l => ({ key: l.key.trim(), value: l.value.trim() })),
    }
    const response = await assetService.update(assetId, payload)
    if (response.success) {
      toast.add({ title: 'Asset updated successfully!', color: 'success', icon: 'i-lucide-circle-check' })
      navigateTo('/asset')
    }
  } finally {
    isSubmitting.value = false
  }
}

// ── Category Events ─────────────────────────────────────────────────────────
const onCategoryCreated = async () => {
  await fetchCategories()
  const last = categoryOptions.value[categoryOptions.value.length - 1]
  if (last) selectedCategoryId.value = last.value
}

const onSubCategoryCreated = async () => {
  if (!selectedCategoryId.value) return
  const res = await subCategoryService.getByCategoryId(Number(selectedCategoryId.value))
  if (res.success) {
    subCategoryOptions.value = res.data.map((s) => ({ label: s.name, value: s.id }))
    const last = subCategoryOptions.value[subCategoryOptions.value.length - 1]
    if (last) form.subCategoryId = last.value
  }
}

onMounted(async () => {
  await fetchCategories()
  await fetchAssetDetails()
})
</script>
