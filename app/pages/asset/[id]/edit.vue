<template>
  <div class="space-y-6">
    <Header :title="$t('pages.asset.edit.title')" :description="$t('pages.asset.edit.description')" />

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
        <UButton :label="$t('common.back')" color="neutral" icon="i-lucide-arrow-left" variant="link" @click="goBack" />
      </div>
      <UForm id="edit-asset-form" :schema="schema" :state="form" @submit="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

          <!-- ═══ Column 1: Identity ═══ -->
          <div class="space-y-4">
            <div>
              <div class="flex justify-between mb-1.5">
                <label class="text-sm font-medium text-neutral-700">{{ $t('pages.asset.create.assetImage') }}</label>
                <UButton icon="i-lucide-camera" color="primary" variant="soft" size="xs" @click="() => { showCamera = true }">{{ $t('pages.asset.create.takePhoto') }}</UButton>
              </div>
              <div v-if="previewUrl" class="relative inline-block w-full aspect-square">
                <NuxtImg :src="previewUrl" class="w-full h-full rounded-lg object-cover border border-neutral-200" />
                <UButton icon="i-lucide-x" color="error" variant="solid" size="xs" class="absolute top-1 right-1 rounded-full" @click="removeImage(form)" />
              </div>
              <div v-else class="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-neutral-200 rounded-lg cursor-pointer hover:border-primary transition-colors" @click="triggerFileInput">
                <UIcon name="i-lucide-upload" class="w-8 h-8 text-neutral-400 mb-2" />
                <span class="text-sm text-neutral-500">{{ $t('pages.asset.create.dropImage') }}</span>
                <span class="text-xs text-neutral-400 mt-1">{{ $t('pages.asset.create.imageHint') }}</span>
              </div>
              <div v-if="isUploading" class="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" /> {{ $t('pages.asset.create.uploading') }}
              </div>
              <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="onFileChange($event, form)" />
              <CameraModal v-model="showCamera" @captured="(file: File) => handleUploadImageFile(file, form)" />
            </div>

            <AttachmentManager
              v-model="uploadedAssetAttachments"
              @change="onAssetAttachmentsChanged"
            />
          </div>

          <!-- ═══ Column 2: Details ═══ -->
          <div class="space-y-4">
            <UFormField :label="$t('pages.asset.create.codeLabel')" name="code" required>
              <div class="flex items-center gap-2">
                <div class="relative w-full">
                  <UInput v-model="form.code" :placeholder="$t('pages.asset.create.codePlaceholder')" class="w-full" />
                  <div v-if="codeStatus" class="absolute right-2 top-1/2 -translate-y-1/2">
                    <UIcon v-if="codeStatus === 'checking'" name="i-lucide-loader-2" class="w-4 h-4 text-neutral-400 animate-spin" />
                    <UIcon v-else-if="codeStatus === 'available'" name="i-lucide-circle-check" class="w-4 h-4 text-green-500" />
                    <UIcon v-else-if="codeStatus === 'exists'" name="i-lucide-circle-x" class="w-4 h-4 text-red-500" />
                  </div>
                </div>
                <UButton icon="i-lucide-scan" color="neutral" variant="soft" size="sm" square @click="() => { showCodeScanner = true }" title="Scan barcode" />
              </div>
              <p v-if="codeStatus === 'exists'" class="text-xs text-red-500 mt-1">{{ $t('pages.asset.create.codeExists', { code: form.code }) }}</p>
              <p v-else-if="codeStatus === 'available'" class="text-xs text-green-500 mt-1">{{ $t('pages.asset.create.codeAvailable') }}</p>
            </UFormField>
            <AssetScannerModal v-model="showCodeScanner" @scanned="(code: string) => { form.code = code }" />

            <UFormField :label="$t('pages.asset.create.bleTagMacLabel')" name="bleTagMac">
              <UInput :model-value="form.bleTagMac ?? undefined" placeholder="AA:BB:CC:DD:EE:FF" class="w-full" maxlength="17" @update:model-value="(v: string) => form.bleTagMac = formatMacAddress(v)">
                <template #leading>
                  <UIcon name="i-lucide-bluetooth" class="w-4 h-4" />
                </template>
              </UInput>
            </UFormField>

            <UFormField :label="$t('pages.asset.create.nameLabel')" name="name" required>
              <UInput v-model="form.name" :placeholder="$t('pages.asset.create.namePlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="$t('pages.asset.create.categoryLabel')" required>
              <div class="flex items-center gap-2">
                <USelectMenu v-model="selectedCategory" :items="categoryOptions" searchable :searchable-placeholder="$t('pages.asset.create.searchCategory')" :placeholder="$t('pages.asset.create.selectCategory')" class="w-full" />
                <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" square @click="() => { showAddCategory = true }" />
              </div>
            </UFormField>

            <UFormField :label="$t('pages.asset.create.subCategoryLabel')" name="subCategoryId" required>
              <div class="flex items-center gap-2">
                <USelectMenu v-model="selectedSubCategory" :items="subCategoryOptions" searchable :searchable-placeholder="$t('pages.asset.create.searchSubCategory')" :placeholder="$t('pages.asset.create.selectSubCategory')" :disabled="!selectedCategoryId || isLoadingSubCategories" class="w-full" />
                <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" square @click="() => { showAddSubCategory = true }" />
              </div>
            </UFormField>

            <UFormField :label="$t('pages.asset.create.descriptionLabel')" name="description">
              <UTextarea v-model="form.description" :placeholder="$t('pages.asset.create.descriptionPlaceholder')" class="w-full" :rows="3" />
            </UFormField>
          </div>

          <!-- ═══ Column 3: Classification ═══ -->
          <div class="space-y-4">
            <UFormField :label="$t('pages.asset.create.priceLabel')" name="price">
              <UInput v-model="priceDisplay" placeholder="0" class="w-full">
                <template #leading>
                  <span class="text-neutral-500 text-sm">Rp</span>
                </template>
              </UInput>
            </UFormField>

            <UFormField :label="$t('pages.asset.create.purchaseDateLabel')" name="purchaseDate">
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

            <UFormField :label="$t('pages.asset.create.brandLabel')" name="brand">
              <UInput v-model="form.brand" :placeholder="$t('pages.asset.create.brandPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="$t('pages.asset.create.modelLabel')" name="model">
              <UInput v-model="form.model" :placeholder="$t('pages.asset.create.modelPlaceholder')" class="w-full" />
            </UFormField>


            <!-- Labels -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-sm font-medium text-neutral-700">{{ $t('pages.asset.create.labelsLabel') }}</label>
                <UButton icon="i-lucide-plus" color="primary" variant="soft" size="xs" @click="addLabel">{{ $t('common.add') }}</UButton>
              </div>
              <div v-if="labels.length === 0" class="text-sm text-neutral-400 py-3 text-center border border-dashed border-neutral-200 rounded-lg">
                {{ $t('pages.asset.create.noLabels') }}
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
                    <UButton icon="i-lucide-trash" color="error" variant="soft" size="sm" square @click="removeLabel(index)" />
                  </div>
                  <p v-if="isDuplicateLabelKey(index)" class="text-xs text-red-500 mt-1">{{ $t('pages.asset.create.duplicateKey', { key: label.key }) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature Settings -->
        <div class="mt-8 pt-6 border-t border-neutral-100 col-span-full">
          <h3 class="text-md font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-toggle-left" class="w-5 h-5 text-primary-500" />
            {{ $t('pages.asset.create.assetFeatures') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <span class="font-medium text-sm text-neutral-850 block">{{ $t('pages.asset.create.featureHolder') }}</span>
                <p class="text-xs text-neutral-500">{{ $t('pages.asset.create.featureHolderDesc') }}</p>
              </div>
              <USwitch v-model="form.hasHolder" />
            </div>

            <div class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <span class="font-medium text-sm text-neutral-850 block">{{ $t('pages.asset.create.featureLocation') }}</span>
                <p class="text-xs text-neutral-500">{{ $t('pages.asset.create.featureLocationDesc') }}</p>
              </div>
              <USwitch v-model="form.hasLocation" />
            </div>

            <div class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div>
                <span class="font-medium text-sm text-neutral-850 block">{{ $t('pages.asset.create.featureMaintenance') }}</span>
                <p class="text-xs text-neutral-500">{{ $t('pages.asset.create.featureMaintenanceDesc') }}</p>
              </div>
              <USwitch v-model="form.hasMaintenance" />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-2 pt-4 mt-6 border-t border-neutral-100">
          <UButton type="submit" color="primary" :loading="isSubmitting" :disabled="isUploading || codeStatus === 'exists' || hasDuplicateLabelKeys">
            {{ $t('common.saveChanges') }}
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
import { assetSchema } from '~/composables/useAssetForm'
import type { AssetPayload } from '~/types/asset'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()

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
const showCodeScanner = ref(false)

const {
  toast, isUploading, previewUrl,
  labels, addLabel, removeLabel, getFilteredLabels,
  isDuplicateLabelKey, hasDuplicateLabelKeys,
  availableLabelKeys, fetchLabelKeys,
  selectedCategoryId, categoryOptions, subCategoryOptions, isLoadingSubCategories,
  lastFetchedCategoryId, showAddCategory, showAddSubCategory,
  fetchCategories, fetchSubCategories, onCategoryCreated, onSubCategoryCreated,
  fileInput, triggerFileInput, onFileChange, handleUploadImageFile, removeImage,
  makePurchaseDateComputed, makePriceDisplayComputed, formatMacAddress,
} = useAssetForm()

// ── State ───────────────────────────────────────────────────────────────────
const isSubmitting = ref(false)
const isLoadingAsset = ref(true)
const uploadedAssetAttachments = ref<Attachment[]>([])

const onAssetAttachmentsChanged = (ids: number[]) => {
  form.attachmentIds = ids
}

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
  bleTagMac: null,
  image: null,
  subCategoryId: undefined as unknown as number,
  hasHolder: true,
  hasMaintenance: true,
  hasLocation: true,
  attachmentIds: [],
})

watch(() => form.code, (newCode) => validateCode(newCode))

const purchaseDateVal = makePurchaseDateComputed(form)
const priceDisplay = makePriceDisplayComputed(form)

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
      form.bleTagMac = asset.bleTagMac || null

      const catId = asset.subCategory?.category?.id
      if (catId) {
        await fetchSubCategories(catId)
        selectedCategoryId.value = catId
      }

      form.subCategoryId = asset.subCategory?.id as number
      previewUrl.value = asset.image
      labels.value = (asset.labels || []).map(l => ({ key: l.key, value: l.value }))

      // Load existing attachments
      if (asset.attachments && asset.attachments.length > 0) {
        uploadedAssetAttachments.value = asset.attachments.map(a => ({
          id: a.id,
          originalName: a.originalName,
          filename: '',
          mimeType: a.mimeType,
          size: a.size,
          url: a.url,
          createdAt: '',
          updatedAt: '',
        }))
        form.attachmentIds = asset.attachments.map(a => a.id)
      }
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
    const payload = { ...form, labels: getFilteredLabels(), attachmentIds: form.attachmentIds || null }
    const response = await assetService.update(assetId, payload)
    if (response.success) {
      toast.add({ title: t('pages.asset.edit.success'), color: 'success', icon: 'i-lucide-circle-check' })
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
