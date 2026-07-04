<template>
  <div class="space-y-6">
    <Header :title="$t('pages.asset.create.title')" :description="$t('pages.asset.create.description')" />

    <UCard class="w-full">
      <div class="w-full mb-4">
        <UButton :label="$t('common.back')" to="/asset" color="neutral" icon="i-lucide-arrow-left" variant="link" />
      </div>
      <UForm id="create-asset-form" :schema="schema" :state="form" @submit="handleSubmit">
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
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-sm font-medium text-neutral-700">{{ $t('pages.asset.create.codeLabel') }} <span class="text-red-500">*</span></label>
                <div class="flex items-center gap-1">
                  <UButton icon="i-lucide-scan" color="neutral" variant="soft" size="xs" @click="openCodeScanner(-1)">{{ $t('pages.asset.create.scan') }}</UButton>
                  <UButton icon="i-lucide-plus" color="primary" variant="soft" size="xs" @click="addCode">{{ $t('pages.asset.create.addCode') }}</UButton>
                </div>
              </div>
              <div class="space-y-3">
                <div v-for="(entry, index) in codes" :key="index" class="p-3 border border-neutral-200 rounded-lg space-y-2">
                  <div class="flex items-center gap-2">
                    <div class="relative w-full">
                      <UInput v-model="entry.code" :placeholder="$t('pages.asset.create.codePlaceholder')" class="w-full" />
                      <div v-if="codeStatuses[index] || isDuplicateCode(index)" class="absolute right-2 top-1/2 -translate-y-1/2">
                        <UIcon v-if="isDuplicateCode(index)" name="i-lucide-circle-x" class="w-4 h-4 text-red-500" />
                        <UIcon v-else-if="codeStatuses[index] === 'checking'" name="i-lucide-loader-2" class="w-4 h-4 text-neutral-400 animate-spin" />
                        <UIcon v-else-if="codeStatuses[index] === 'available'" name="i-lucide-circle-check" class="w-4 h-4 text-green-500" />
                        <UIcon v-else-if="codeStatuses[index] === 'exists'" name="i-lucide-circle-x" class="w-4 h-4 text-red-500" />
                      </div>
                    </div>
                    <UButton v-if="codes.length > 1" icon="i-lucide-trash" color="error" variant="soft" size="sm" square @click="removeCode(index)" />
                    <UButton icon="i-lucide-scan" color="neutral" variant="soft" size="sm" square @click="openCodeScanner(index)" title="Scan barcode" />
                  </div>
                  <p v-if="isDuplicateCode(index)" class="text-xs text-red-500">{{ $t('pages.asset.create.duplicateCode') }}</p>
                  <p v-else-if="codeStatuses[index] === 'exists'" class="text-xs text-red-500">{{ $t('pages.asset.create.codeExists', { code: entry.code }) }}</p>
                  <p v-else-if="codeStatuses[index] === 'available'" class="text-xs text-green-500">{{ $t('pages.asset.create.codeAvailable') }}</p>
                  <UInput :model-value="entry.bleTagMac" placeholder="AA:BB:CC:DD:EE:FF" class="w-full" maxlength="17" @update:model-value="(v: string) => entry.bleTagMac = formatMacAddress(v)">
                    <template #leading>
                      <UIcon name="i-lucide-bluetooth" class="w-4 h-4" />
                    </template>
                  </UInput>
                </div>
              </div>
              <AssetScannerModal v-model="showCodeScanner" :auto-close="scanAutoClose" @scanned="onCodeScanned" />
            </div>
  
            <UFormField :label="$t('pages.asset.create.nameLabel')" name="name" required>
              <UInput v-model="form.name" :placeholder="$t('pages.asset.create.namePlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="$t('pages.asset.create.categoryLabel')" name="categoryId" required>
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



            <UFormField :label="$t('pages.asset.create.statusLabel')" name="status" required>
              <USelect
                v-model="form.status"
                :items="statusOptions"
                :placeholder="$t('pages.asset.create.selectStatus')"
                class="w-full"
              />
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

        <!-- Optional Initial Assignment & Location -->
        <div v-if="form.hasHolder || form.hasLocation" class="mt-8 pt-6 border-t border-neutral-100 col-span-full">
          <h3 class="text-md font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-settings-2" class="w-5 h-5 text-primary-500" />
            {{ $t('pages.asset.create.initialSection') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Assignment Section -->
            <div v-if="form.hasHolder" class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 space-y-4">
              <div class="font-medium text-sm text-neutral-850 flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                <UIcon name="i-lucide-user-plus" class="w-4 h-4 text-primary-500" />
                {{ $t('pages.asset.create.assignToEmployee') }}
              </div>
              <UFormField :label="$t('common.employee')" name="employeeId">
                <USelectMenu
                  v-model="selectedEmployee"
                  :items="employeeOptions"
                  :avatar="selectedEmployee?.avatar"
                  searchable
                  :searchable-placeholder="$t('pages.asset.create.searchEmployees')"
                  :placeholder="$t('pages.asset.create.selectEmployee')"
                  :loading="isLoadingEmployees"
                  class="w-full"
                />
              </UFormField>
              <UFormField v-if="form.employeeId" :label="$t('pages.asset.create.assignmentDate')" name="assignedDate">
                <UInput type="datetime-local" v-model="form.assignedDate" class="w-full" />
              </UFormField>
              <UFormField v-if="form.employeeId" :label="$t('pages.asset.create.assignmentNotes')" name="assignNote">
                <UTextarea v-model="form.assignNote" :placeholder="$t('pages.asset.create.assignNotesPlaceholder')" class="w-full" :rows="2" />
              </UFormField>
              <AttachmentManager
                v-if="form.employeeId"
                v-model="uploadedAssignAttachments"
                @change="onAssignAttachmentsChanged"
              />
            </div>

            <!-- Location Section -->
            <div v-if="form.hasLocation" class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 space-y-4">
              <div class="font-medium text-sm text-neutral-850 flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-primary-500" />
                {{ $t('pages.asset.create.setInitialLocation') }}
              </div>
              <UFormField :label="$t('common.branch')" name="branchId">
                <USelectMenu
                  v-model="selectedBranch"
                  :items="branchOptions"
                  searchable
                  :searchable-placeholder="$t('pages.asset.create.searchBranches')"
                  :placeholder="$t('pages.asset.create.selectBranch')"
                  :loading="isLoadingBranches"
                  class="w-full"
                />
              </UFormField>
              <UFormField :label="$t('common.location')" name="locationId">
                <div class="flex items-center gap-2">
                  <USelectMenu
                    v-model="selectedLocation"
                    :items="filteredLocationOptions"
                    searchable
                    :searchable-placeholder="$t('pages.asset.create.searchLocations')"
                    :placeholder="selectedBranch ? $t('pages.asset.create.selectLocation') : $t('pages.asset.create.selectBranchFirst')"
                    :disabled="!selectedBranch"
                    :loading="isLoadingLocations"
                    class="w-full"
                  />
                  <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" square :disabled="!selectedBranch" @click="() => { showAddLocation = true }" />
                </div>
              </UFormField>
              <UFormField v-if="form.locationId" :label="$t('pages.asset.create.relocationDate')" name="locationDate">
                <UInput type="datetime-local" v-model="form.locationDate" class="w-full" />
              </UFormField>
              <UFormField v-if="form.locationId" :label="$t('pages.asset.create.relocationNotes')" name="locationNote">
                <UTextarea v-model="form.locationNote" :placeholder="$t('pages.asset.create.relocationNotesPlaceholder')" class="w-full" :rows="2" />
              </UFormField>
              <AttachmentManager
                v-if="form.locationId"
                v-model="uploadedLocationAttachments"
                @change="onLocationAttachmentsChanged"
              />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-2 pt-4 mt-6 border-t border-neutral-100">
          <UButton color="primary" variant="outline" :loading="isSubmitting && submitMode === 'another'" :disabled="isUploading || isSubmitting || hasInvalidCodes || hasDuplicateLabelKeys" @click="() => { submitMode = 'another'; submitForm() }">
            {{ $t('pages.asset.create.saveAndCreateAnother') }}
          </UButton>
          <UButton type="submit" color="primary" :loading="isSubmitting && submitMode === 'save'" :disabled="isUploading || isSubmitting || hasInvalidCodes || hasDuplicateLabelKeys" @click="() => { submitMode = 'save' }">
            {{ $t('pages.asset.create.submit') }}
          </UButton>
        </div>
      </UForm>
    </UCard>

    <CategoryAddModal v-model="showAddCategory" @created="onCategoryCreated" />
    <SubCategoryAddModal v-model="showAddSubCategory" @created="() => onSubCategoryCreated(form)" />
    <LocationAddModal v-model="showAddLocation" :default-branch-id="form.branchId || undefined" @created="onLocationCreated" />
  </div>
</template>

<script setup lang="ts">
import { assetService } from '~/services/asset-service'
import { assetSchema } from '~/composables/useAssetForm'
import type { AssetPayload } from '~/types/asset'
import { employeeService } from '~/services/employee-service'
import { branchService } from '~/services/branch-service'
import { locationService } from '~/services/location-service'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()

definePageMeta({ layout: 'dashboard' })

const UInputMenu = resolveComponent('UInputMenu')

const showCamera = ref(false)
const showCodeScanner = ref(false)
const scanTargetIndex = ref(-1)

const scanAutoClose = ref(true)

function openCodeScanner(index: number) {
  scanTargetIndex.value = index
  scanAutoClose.value = index >= 0
  showCodeScanner.value = true
}

function onCodeScanned(code: string) {
  if (scanTargetIndex.value >= 0 && scanTargetIndex.value < codes.value.length) {
    const entry = codes.value[scanTargetIndex.value]
    if (entry) entry.code = code
  } else {
    // Scan from header button: fill first empty code, or add new
    const emptyIdx = codes.value.findIndex(c => !c.code.trim())
    if (emptyIdx >= 0) {
      const emptyEntry = codes.value[emptyIdx]
      if (emptyEntry) emptyEntry.code = code
    } else {
      codes.value.push({ code, bleTagMac: '' })
    }
  }
}

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Idle', value: 'idle' },
  { label: 'Under Repair', value: 'under_repair' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Lost', value: 'lost' },
  { label: 'Sold', value: 'sold' },
  { label: 'Disposed', value: 'disposed' },
]

const {
  toast, isUploading, previewUrl,
  labels, addLabel, removeLabel, getFilteredLabels,
  isDuplicateLabelKey, hasDuplicateLabelKeys,
  availableLabelKeys, fetchLabelKeys,
  selectedCategoryId, categoryOptions, subCategoryOptions, isLoadingSubCategories,
  showAddCategory, showAddSubCategory,
  fetchCategories, fetchSubCategories, onCategoryCreated, onSubCategoryCreated,
  fileInput, triggerFileInput, onFileChange, handleUploadImageFile, removeImage,
  makePurchaseDateComputed, makePriceDisplayComputed, formatMacAddress,
} = useAssetForm()

// ── State ───────────────────────────────────────────────────────────────────
const isSubmitting = ref(false)
const submitMode = ref<'save' | 'another'>('save')
const uploadedAssignAttachments = ref<Attachment[]>([])
const uploadedLocationAttachments = ref<Attachment[]>([])
const uploadedAssetAttachments = ref<Attachment[]>([])

// ── Schema & Form ───────────────────────────────────────────────────────────
const schema = assetSchema.pick({ categoryId: true, name: true, subCategoryId: true, brand: true, model: true, price: true, purchaseDate: true, description: true })

const getLocalDatetimeString = () => {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const form = reactive<Omit<AssetPayload, 'code' | 'bleTagMac'> & { categoryId: number } & {
  employeeId?: number | null
  assignedDate?: string
  assignNote?: string
  assignAttachmentIds?: number[] | null
  branchId?: number | null
  locationId?: number | null
  locationDate?: string
  locationNote?: string
  locationAttachmentIds?: number[] | null
  attachmentIds?: number[] | null
  hasHolder: boolean
  hasMaintenance: boolean
  hasLocation: boolean
  status?: string
  statusNote?: string
}>({
  categoryId: undefined as unknown as number,
  name: '',
  description: '',
  price: undefined,
  purchaseDate: '',
  brand: '',
  model: '',

  image: null,
  subCategoryId: undefined as unknown as number,
  employeeId: null,
  assignedDate: getLocalDatetimeString(),
  assignNote: '',
  assignAttachmentIds: [],
  branchId: null,
  locationId: null,
  locationDate: getLocalDatetimeString(),
  locationNote: '',
  locationAttachmentIds: [],
  attachmentIds: [],
  hasHolder: true,
  hasMaintenance: true,
  hasLocation: true,
  status: 'active',
  statusNote: undefined,
})

const onAssignAttachmentsChanged = (ids: number[]) => {
  form.assignAttachmentIds = ids
}
const onAssetAttachmentsChanged = (ids: number[]) => {
  form.attachmentIds = ids
}
const onLocationAttachmentsChanged = (ids: number[]) => {
  form.locationAttachmentIds = ids
}

const purchaseDateVal = makePurchaseDateComputed(form)
const priceDisplay = makePriceDisplayComputed(form)

// ── Category Select ─────────────────────────────────────────────────────────
const selectedCategory = computed({
  get: () => categoryOptions.value.find((c) => c.value === selectedCategoryId.value),
  set: (val) => {
    selectedCategoryId.value = val?.value
    form.categoryId = val?.value as unknown as number
  }
})

const selectedSubCategory = computed({
  get: () => subCategoryOptions.value.find((s) => s.value === form.subCategoryId),
  set: (val) => { form.subCategoryId = val?.value as unknown as number }
})

watch(selectedCategoryId, async (newVal) => {
  if (!newVal) {
    subCategoryOptions.value = []
    form.subCategoryId = undefined as unknown as number
    return
  }
  await fetchSubCategories(Number(newVal))
  if (form.subCategoryId && !subCategoryOptions.value.some((s) => s.value === form.subCategoryId)) {
    form.subCategoryId = undefined as unknown as number
  }
})

// ── Codes & Validation ──────────────────────────────────────────────────────
type CodeStatus = 'checking' | 'available' | 'exists' | null
interface CodeEntry { code: string; bleTagMac: string }
const codes = ref<CodeEntry[]>([{ code: '', bleTagMac: '' }])
const codeStatuses = ref<Record<number, CodeStatus>>({})
const codeTimers: Record<number, ReturnType<typeof setTimeout>> = {}
const prevCodes = ref<string[]>([''])

const addCode = () => { codes.value.push({ code: '', bleTagMac: '' }) }

const removeCode = (index: number) => {
  if (codeTimers[index]) clearTimeout(codeTimers[index])
  codes.value.splice(index, 1)
  const newStatuses: Record<number, CodeStatus> = {}
  codes.value.forEach((_, i) => {
    const oldIndex = i >= index ? i + 1 : i
    newStatuses[i] = codeStatuses.value[oldIndex] ?? null
  })
  codeStatuses.value = newStatuses
  prevCodes.value = codes.value.map(c => c.code)
}

const validateCode = (index: number, code: string) => {
  if (codeTimers[index]) clearTimeout(codeTimers[index])
  const trimmed = code?.trim()
  if (!trimmed) { codeStatuses.value[index] = null; return  }
  codeStatuses.value[index] = 'checking'
  codeTimers[index] = setTimeout(async () => {
    const res = await assetService.checkCode(trimmed)
    if (codes.value[index]?.code?.trim() === trimmed && res.success) {
      codeStatuses.value[index] = res.data.exists ? 'exists' : 'available'
    }
  }, 500)
}

watch(codes, (newCodes) => {
  newCodes.forEach((entry, index) => {
    if (entry.code !== prevCodes.value[index]) validateCode(index, entry.code)
  })
  prevCodes.value = newCodes.map(c => c.code)
}, { deep: true })

const isDuplicateCode = (index: number) => {
  const code = codes.value[index]?.code?.trim()
  if (!code) return false
  return codes.value.some((c, i) => i !== index && c.code.trim() === code)
}

const hasInvalidCodes = computed(() => {
  const trimmed = codes.value.map(c => c.code.trim()).filter(c => c.length > 0)
  return new Set(trimmed).size !== trimmed.length || Object.values(codeStatuses.value).some(s => s === 'exists')
})

// ── Assignment & Location Selects ───────────────────────────────────────────
const isLoadingEmployees = ref(false)
const isLoadingBranches = ref(false)
const isLoadingLocations = ref(false)
const employeeOptions = ref<{
  label: string
  value: number
  avatar?: { src: string; alt: string; loading?: 'lazy' | 'eager' }
  photo?: { src: string; alt: string; loading?: 'lazy' | 'eager' }
}[]>([])
const branchOptions = ref<{ label: string; value: number }[]>([])
const filteredLocationOptions = ref<{ label: string; value: number }[]>([])

const selectedEmployee = ref<{ label: string; value: number; avatar?: any; photo?: any } | undefined>(undefined)
const selectedBranch = ref<{ label: string; value: number } | undefined>(undefined)
const selectedLocation = ref<{ label: string; value: number } | undefined>(undefined)
const showAddLocation = ref(false)

watch(selectedEmployee, (val) => {
  form.employeeId = val?.value ?? null
})

const loadEmployees = async () => {
  isLoadingEmployees.value = true
  try {
    const res = await employeeService.getList()
    if (res.success && res.data) {
      employeeOptions.value = res.data.map(e => ({
        label: `${e.name} (${e.employeeId})`,
        value: e.id,
        photo: e.photo ? {
          src: e.photo,
          alt: e.name,
          loading: 'lazy' as const
        } : undefined,
        avatar: e.photo ? {
          src: e.photo,
          alt: e.name,
          loading: 'lazy' as const
        } : undefined
      }))
    }
  } finally {
    isLoadingEmployees.value = false
  }
}

const loadBranches = async () => {
  isLoadingBranches.value = true
  try {
    const res = await branchService.getList()
    if (res.success && res.data) {
      branchOptions.value = res.data.map(b => ({
        label: b.name,
        value: b.id
      }))
    }
  } finally {
    isLoadingBranches.value = false
  }
}

const loadLocationsForBranch = async (branchId: number) => {
  isLoadingLocations.value = true
  try {
    const res = await locationService.getByBranchId(branchId)
    if (res.success && res.data) {
      filteredLocationOptions.value = res.data.map(l => ({
        label: l.name,
        value: l.id
      }))
    }
  } finally {
    isLoadingLocations.value = false
  }
}

watch(selectedBranch, async (val) => {
  if (val) {
    form.branchId = val.value
    await loadLocationsForBranch(val.value)
  } else {
    form.branchId = null
    filteredLocationOptions.value = []
  }
  selectedLocation.value = undefined
  form.locationId = null
})

watch(selectedLocation, (val) => {
  form.locationId = val?.value ?? null
})

const onLocationCreated = async () => {
  if (!form.branchId) return
  await loadLocationsForBranch(Number(form.branchId))
  const last = filteredLocationOptions.value[filteredLocationOptions.value.length - 1]
  if (last) {
    selectedLocation.value = last
    form.locationId = last.value
  }
}

// ── Reset ───────────────────────────────────────────────────────────────────
const resetForm = () => {
  codes.value = [{ code: '', bleTagMac: '' }]
  codeStatuses.value = {}
  prevCodes.value = ['']
  Object.assign(form, {
    categoryId: undefined, name: '', description: '', price: undefined,
    purchaseDate: '', brand: '', model: '', image: null, subCategoryId: undefined,
    employeeId: null, assignedDate: getLocalDatetimeString(), assignNote: '',
    assignAttachmentIds: [],
    branchId: null, locationId: null, locationDate: getLocalDatetimeString(), locationNote: '',
    locationAttachmentIds: [],
    attachmentIds: [],
    hasHolder: true,
    hasMaintenance: true,
    hasLocation: true,
    status: 'active',
    statusNote: undefined,
  })
  selectedCategoryId.value = undefined
  selectedEmployee.value = undefined
  selectedBranch.value = undefined
  selectedLocation.value = undefined
  previewUrl.value = null
  labels.value = []
  uploadedAssignAttachments.value = []
  uploadedLocationAttachments.value = []
  uploadedAssetAttachments.value = []
}

// ── Submit ──────────────────────────────────────────────────────────────────
const submitForm = () => {
  (document.getElementById('create-asset-form') as HTMLFormElement)?.requestSubmit()
}

const handleSubmit = async () => {
  const validEntries = codes.value.filter(c => c.code.trim().length > 0)
  if (validEntries.length === 0) {
    toast.add({ title: t('pages.asset.create.codeRequired'), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  const codeValues = validEntries.map(c => c.code.trim())
  if (new Set(codeValues).size !== codeValues.length) {
    toast.add({ title: t('pages.asset.create.duplicateCodesError'), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }

  isSubmitting.value = true
  let successCount = 0
  const failedCodes: string[] = []
  const filteredLabels = getFilteredLabels()

  try {
    for (const entry of validEntries) {
      const payload: AssetPayload = {
        code: entry.code.trim(),
        name: form.name, description: form.description, price: form.price,
        purchaseDate: form.purchaseDate, brand: form.brand, model: form.model,
        image: form.image, subCategoryId: form.subCategoryId, labels: filteredLabels,
        bleTagMac: entry.bleTagMac?.trim() || null,
        hasHolder: form.hasHolder,
        hasMaintenance: form.hasMaintenance,
        hasLocation: form.hasLocation,
        employeeId: form.hasHolder ? (form.employeeId || null) : null,
        assignedDate: form.hasHolder && form.employeeId ? form.assignedDate : null,
        assignNote: form.hasHolder && form.employeeId ? form.assignNote : null,
        assignAttachmentIds: form.hasHolder && form.employeeId ? form.assignAttachmentIds : null,
        locationId: form.hasLocation ? (form.locationId || null) : null,
        locationDate: form.hasLocation && form.locationId ? form.locationDate : null,
        locationNote: form.hasLocation && form.locationId ? form.locationNote : null,
        locationAttachmentIds: form.hasLocation && form.locationId ? form.locationAttachmentIds : null,
        attachmentIds: form.attachmentIds || null,
        status: form.status || null,
        statusNote: form.statusNote || null,
      }
      const response = await assetService.create(payload)
      response.success ? successCount++ : failedCodes.push(entry.code.trim())
    }
    if (successCount > 0) {
      toast.add({ title: t('pages.asset.create.successCount', { count: successCount }), color: 'success', icon: 'i-lucide-circle-check' })
    }
    if (failedCodes.length > 0) {
      toast.add({ title: t('pages.asset.create.failedCreate', { codes: failedCodes.join(', ') }), description: t('pages.asset.create.codeExistsHint'), color: 'error', icon: 'i-lucide-circle-alert' })
    }
    if (failedCodes.length === 0) {
      submitMode.value === 'another' ? resetForm() : navigateTo('/asset')
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchCategories()
  loadEmployees()
  loadBranches()
  fetchLabelKeys()
})
</script>
