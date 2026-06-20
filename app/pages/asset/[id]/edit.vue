<template>
  <div class="space-y-6">
    <Header title="Edit Asset" description="Update asset details below" />

    <UCard v-if="isLoadingAsset" class="w-full">
      <div class="w-full mb-4">
        <USkeleton class="h-8 w-20" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
        <!-- Column 1: Asset Image Skeleton -->
        <div class="space-y-4">
          <div class="space-y-2">
            <USkeleton class="h-4 w-1/4" />
            <USkeleton class="w-full aspect-square rounded-lg" />
          </div>
        </div>

        <!-- Column 2 & 3: Fields Skeleton -->
        <div v-for="i in 2" :key="i" class="space-y-4">
          <div v-for="j in 5" :key="j" class="space-y-2">
            <USkeleton class="h-4 w-1/4" />
            <USkeleton class="h-10 w-full" />
          </div>
        </div>
      </div>
    </UCard>

    <UCard v-else class="w-full">
      <div class="w-full mb-4">
        <UButton label="Back" color="neutral" icon="i-lucide-arrow-left" variant="link" @click="goBack" />
      </div>
      <UForm id="edit-asset-form" :schema="schema" :state="form" @submit="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

          <!-- ═══ Column 1: Identity ═══ -->
          <div class="space-y-4">
            <div>
              <div class="flex justify-between mb-1.5">
                <label class="text-sm font-medium text-neutral-700">Asset Image</label>
                <UButton icon="i-lucide-camera" color="primary" variant="soft" size="xs" @click="showCamera = true">Take Photo</UButton>
              </div>
              <div v-if="previewUrl" class="relative inline-block w-full aspect-square">
                <NuxtImg :src="previewUrl" class="w-full h-full rounded-lg object-cover border border-neutral-200" />
                <UButton icon="i-lucide-x" color="error" variant="solid" size="xs" class="absolute top-1 right-1 rounded-full" @click="removeImage(form)" />
              </div>
              <div v-else class="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-neutral-200 rounded-lg cursor-pointer hover:border-primary transition-colors" @click="triggerFileInput">
                <UIcon name="i-lucide-upload" class="w-8 h-8 text-neutral-400 mb-2" />
                <span class="text-sm text-neutral-500">Drop your image here</span>
                <span class="text-xs text-neutral-400 mt-1">PNG, JPG up to 2MB</span>
              </div>
              <div v-if="isUploading" class="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" /> Uploading...
              </div>
              <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="onFileChange($event, form)" />
              <CameraModal v-model="showCamera" @captured="(file: File) => handleUploadImageFile(file, form)" />
            </div>
          </div>

          <!-- ═══ Column 2: Details ═══ -->
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

            <UFormField label="Category" required>
              <div class="flex items-center gap-2">
                <USelectMenu v-model="selectedCategory" :items="categoryOptions" searchable searchable-placeholder="Search category..." placeholder="Select category" class="w-full" />
                <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" square @click="showAddCategory = true" />
              </div>
            </UFormField>

            <UFormField label="Sub Category" name="subCategoryId" required>
              <div class="flex items-center gap-2">
                <USelectMenu v-model="selectedSubCategory" :items="subCategoryOptions" searchable searchable-placeholder="Search sub category..." placeholder="Select sub category" :disabled="!selectedCategoryId || isLoadingSubCategories" class="w-full" />
                <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" square @click="showAddSubCategory = true" />
              </div>
            </UFormField>

            <UFormField label="Description" name="description">
              <UTextarea v-model="form.description" placeholder="Asset description (optional)" class="w-full" :rows="3" />
            </UFormField>
          </div>

          <!-- ═══ Column 3: Classification ═══ -->
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

            <UFormField label="Brand" name="brand">
              <UInput v-model="form.brand" placeholder="Brand (optional)" class="w-full" />
            </UFormField>

            <UFormField label="Model" name="model">
              <UInput v-model="form.model" placeholder="Model (optional)" class="w-full" />
            </UFormField>

            <!-- Labels -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-sm font-medium text-neutral-700">Labels</label>
                <UButton icon="i-lucide-plus" color="primary" variant="soft" size="xs" @click="addLabel">Add</UButton>
              </div>
              <div v-if="labels.length === 0" class="text-sm text-neutral-400 py-3 text-center border border-dashed border-neutral-200 rounded-lg">
                No labels added yet
              </div>
              <div v-else class="space-y-2">
                <div v-for="(label, index) in labels" :key="index">
                  <div class="flex items-center gap-2">
                    <UInputMenu
                      v-model="label.key"
                      :items="availableLabelKeys"
                      autocomplete
                      placeholder="Key"
                      class="w-full"
                    />
                    <UInput v-model="label.value" placeholder="Value" class="w-full" />
                    <UButton icon="i-lucide-trash" color="error" variant="ghost" size="sm" square @click="removeLabel(index)" />
                  </div>
                  <p v-if="isDuplicateLabelKey(index)" class="text-xs text-red-500 mt-1">Duplicate key "{{ label.key }}"</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Depreciation Settings -->
        <div class="mt-8 pt-6 border-t border-neutral-100 col-span-full">
          <h3 class="text-md font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-trending-down" class="w-5 h-5 text-primary-500" />
            Depreciation
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <UFormField label="Method" name="depreciationMethod">
              <USelect
                v-model="form.depreciationMethod"
                :items="depreciationMethodOptions"
                placeholder="Select method..."
                class="w-full"
              />
            </UFormField>

            <UFormField v-if="form.depreciationMethod && form.depreciationMethod !== 'none'" label="Useful Life (Months)" name="usefulLife" required>
              <UInput v-model.number="form.usefulLife" type="number" placeholder="e.g. 48" min="1" class="w-full" />
            </UFormField>

            <UFormField v-if="form.depreciationMethod && form.depreciationMethod !== 'none'" label="Residual Value" name="residualValue">
              <UInput v-model="residualValueDisplay" placeholder="0" class="w-full">
                <template #leading>
                  <span class="text-neutral-500 text-sm">Rp</span>
                </template>
              </UInput>
            </UFormField>

            <UFormField v-if="form.depreciationMethod && form.depreciationMethod !== 'none'" label="Start Date" name="depreciationStartDate">
              <UInputDate v-model="depreciationStartDateVal" class="w-full">
                <template #trailing>
                  <UPopover>
                    <UButton icon="i-lucide-calendar" color="neutral" variant="ghost" size="sm" square />
                    <template #content>
                      <UCalendar v-model="depreciationStartDateVal" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
              <p class="text-xs text-neutral-400 mt-1">Defaults to Purchase Date if empty</p>
            </UFormField>
          </div>
        </div>

        <!-- Feature Settings -->
        <div class="mt-8 pt-6 border-t border-neutral-100 col-span-full">
          <h3 class="text-md font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-toggle-left" class="w-5 h-5 text-primary-500" />
            Asset Features
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <span class="font-medium text-sm text-neutral-850 block">Asset Holder (Assignment)</span>
                <p class="text-xs text-neutral-500">Allow assigning this asset to employees.</p>
              </div>
              <USwitch v-model="form.hasHolder" />
            </div>

            <div class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <span class="font-medium text-sm text-neutral-850 block">Asset Location History</span>
                <p class="text-xs text-neutral-500">Track relocations and physical placement.</p>
              </div>
              <USwitch v-model="form.hasLocation" />
            </div>

            <div class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <span class="font-medium text-sm text-neutral-850 block">Asset Maintenance History</span>
                <p class="text-xs text-neutral-500">Log repair, calibration, and service history.</p>
              </div>
              <USwitch v-model="form.hasMaintenance" />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-2 pt-4 mt-6 border-t border-neutral-100">
          <UButton type="submit" color="primary" :loading="isSubmitting" :disabled="isUploading || codeStatus === 'exists' || hasDuplicateLabelKeys">
            Save Changes
          </UButton>
        </div>
      </UForm>
    </UCard>

    <CategoryAddModal v-model="showAddCategory" @created="onCategoryCreated" />
    <SubCategoryAddModal v-model="showAddSubCategory" @created="() => onSubCategoryCreated(form)" />
  </div>
</template>

<script setup lang="ts">
import { assetService } from '~/services/asset-service'
import { assetSchema, depreciationMethodOptions } from '~/composables/useAssetForm'
import type { AssetPayload } from '~/types/asset'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const assetId = Number(route.params.id)

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    navigateTo('/asset')
  }
}

const UInputMenu = resolveComponent('UInputMenu')

const showCamera = ref(false)

const {
  toast, isUploading, previewUrl,
  labels, addLabel, removeLabel, getFilteredLabels,
  isDuplicateLabelKey, hasDuplicateLabelKeys,
  availableLabelKeys, fetchLabelKeys,
  selectedCategoryId, categoryOptions, subCategoryOptions, isLoadingSubCategories,
  lastFetchedCategoryId, showAddCategory, showAddSubCategory,
  fetchCategories, fetchSubCategories, onCategoryCreated, onSubCategoryCreated,
  fileInput, triggerFileInput, onFileChange, handleUploadImageFile, removeImage,
  makePurchaseDateComputed, makePriceDisplayComputed,
  makeResidualValueDisplayComputed, makeDepreciationStartDateComputed,
} = useAssetForm()

// ── State ───────────────────────────────────────────────────────────────────
const isSubmitting = ref(false)
const isLoadingAsset = ref(true)

// ── Code Validation ─────────────────────────────────────────────────────────
type CodeStatus = 'checking' | 'available' | 'exists' | null
const codeStatus = ref<CodeStatus>(null)
const originalCode = ref('')
let codeTimer: ReturnType<typeof setTimeout> | null = null

const validateCode = (code: string) => {
  if (codeTimer) clearTimeout(codeTimer)
  const trimmed = code?.trim()
  if (!trimmed || trimmed === originalCode.value) { codeStatus.value = null; return }
  codeStatus.value = 'checking'
  codeTimer = setTimeout(async () => {
    const res = await assetService.checkCode(trimmed, assetId)
    if (form.code?.trim() === trimmed && res.success) {
      codeStatus.value = res.data.exists ? 'exists' : 'available'
    }
  }, 500)
}

// ── Schema & Form ───────────────────────────────────────────────────────────
const schema = assetSchema.pick({ code: true, name: true, subCategoryId: true, brand: true, model: true, price: true, purchaseDate: true, description: true })

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
  hasHolder: true,
  hasMaintenance: true,
  hasLocation: true,
  depreciationMethod: 'none',
  usefulLife: undefined as unknown as number,
  residualValue: undefined as unknown as number,
  depreciationStartDate: undefined as unknown as string,
})

watch(() => form.code, (newCode) => validateCode(newCode))

const purchaseDateVal = makePurchaseDateComputed(form)
const priceDisplay = makePriceDisplayComputed(form)
const residualValueDisplay = makeResidualValueDisplayComputed(form)
const depreciationStartDateVal = makeDepreciationStartDateComputed(form)

// ── Category Select ─────────────────────────────────────────────────────────
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
  await fetchSubCategories(Number(newVal))
  if (form.subCategoryId && !subCategoryOptions.value.some((s) => s.value === form.subCategoryId)) {
    form.subCategoryId = undefined as unknown as number
  }
})

// ── Data Fetching ───────────────────────────────────────────────────────────
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
      form.hasHolder = asset.hasHolder
      form.hasMaintenance = asset.hasMaintenance
      form.hasLocation = asset.hasLocation
      form.depreciationMethod = asset.depreciationMethod || 'none'
      form.usefulLife = asset.usefulLife ?? undefined
      form.residualValue = asset.residualValue ?? undefined
      form.depreciationStartDate = asset.depreciationStartDate ?? undefined

      const catId = asset.subCategory?.category?.id
      if (catId) {
        await fetchSubCategories(catId)
        selectedCategoryId.value = catId
      }

      form.subCategoryId = asset.subCategory?.id as number
      previewUrl.value = asset.image
      labels.value = (asset.labels || []).map(l => ({ key: l.key, value: l.value }))
    }
  } catch {
    navigateTo('/asset')
  } finally {
    isLoadingAsset.value = false
  }
}

// ── Submit ──────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const payload = { ...form, labels: getFilteredLabels() }
    const response = await assetService.update(assetId, payload)
    if (response.success) {
      toast.add({ title: 'Asset updated successfully!', color: 'success', icon: 'i-lucide-circle-check' })
      goBack()
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await fetchCategories()
  await fetchAssetDetails()
  await fetchLabelKeys()
})
</script>
