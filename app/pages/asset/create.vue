<template>
  <div class="space-y-6">
    <Header title="Add New Asset" description="Create a new asset record" />

    <UCard class="w-full">
      <div class="w-full mb-4">
        <UButton label="Back" to="/asset" color="neutral" icon="i-lucide-arrow-left" variant="link" />
      </div>
      <UForm id="create-asset-form" :schema="schema" :state="form" @submit="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

          <!-- ═══ Column 1: Identity ═══ -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-neutral-700 mb-1.5 block">Asset Image</label>
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
            </div>

          </div>
          
          <!-- ═══ Column 2: Details ═══ -->
          <div class="space-y-4">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-sm font-medium text-neutral-700">Code <span class="text-red-500">*</span></label>
                <UButton icon="i-lucide-plus" color="primary" variant="soft" size="xs" @click="addCode">Add Code</UButton>
              </div>
              <div class="space-y-2">
                <div v-for="(_, index) in codes" :key="index">
                  <div class="flex items-center gap-2">
                    <div class="relative w-full">
                      <UInput v-model="codes[index]" placeholder="e.g. AST-001" class="w-full" />
                      <div v-if="codeStatuses[index] || isDuplicateCode(index)" class="absolute right-2 top-1/2 -translate-y-1/2">
                        <UIcon v-if="isDuplicateCode(index)" name="i-lucide-circle-x" class="w-4 h-4 text-red-500" />
                        <UIcon v-else-if="codeStatuses[index] === 'checking'" name="i-lucide-loader-2" class="w-4 h-4 text-neutral-400 animate-spin" />
                        <UIcon v-else-if="codeStatuses[index] === 'available'" name="i-lucide-circle-check" class="w-4 h-4 text-green-500" />
                        <UIcon v-else-if="codeStatuses[index] === 'exists'" name="i-lucide-circle-x" class="w-4 h-4 text-red-500" />
                      </div>
                    </div>
                    <UButton v-if="codes.length > 1" icon="i-lucide-trash" color="error" variant="ghost" size="sm" square @click="removeCode(index)" />
                  </div>
                  <p v-if="isDuplicateCode(index)" class="text-xs text-red-500 mt-1">Duplicate code in the list</p>
                  <p v-else-if="codeStatuses[index] === 'exists'" class="text-xs text-red-500 mt-1">Code "{{ codes[index] }}" already exists</p>
                  <p v-else-if="codeStatuses[index] === 'available'" class="text-xs text-green-500 mt-1">Code available</p>
                </div>
              </div>
            </div>
  
            <UFormField label="Name" name="name" required>
              <UInput v-model="form.name" placeholder="Asset name" class="w-full" />
            </UFormField>

            <UFormField label="Category" name="categoryId" required>
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
                <div v-for="(label, index) in labels" :key="index" class="flex items-center gap-2">
                  <UInput v-model="label.key" placeholder="Key" class="w-full" />
                  <UInput v-model="label.value" placeholder="Value" class="w-full" />
                  <UButton icon="i-lucide-trash" color="error" variant="ghost" size="sm" square @click="removeLabel(index)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Immediate Assignment and Location Options (Only on Create) -->
        <div class="border-t border-neutral-100 pt-6 mt-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Assignment Section -->
            <div class="space-y-4 border border-neutral-100 rounded-xl p-4 bg-neutral-50/50">
              <div class="flex items-center gap-2">
                <UCheckbox v-model="shouldAssign" label="Assign Asset Immediately" />
              </div>
              <div v-if="shouldAssign" class="space-y-4 pt-2">
                <UFormField label="Employee" name="employeeId" required>
                  <USelectMenu
                    v-model="selectedEmployee"
                    :items="employeeOptions"
                    searchable
                    searchable-placeholder="Search employees by name or ID..."
                    placeholder="Select employee"
                    :loading="isLoadingEmployees"
                    class="w-full bg-white"
                  />
                </UFormField>

                <UFormField label="Assignment Date" name="assignedDate" required>
                  <UInput type="datetime-local" v-model="form.assignedDate" class="w-full bg-white" />
                </UFormField>

                <UFormField label="Assignment Notes" name="assignNote">
                  <UTextarea v-model="form.assignNote" placeholder="Enter assignment details or notes (optional)" class="w-full bg-white" :rows="2" />
                </UFormField>
              </div>
            </div>

            <!-- Relocation Section -->
            <div class="space-y-4 border border-neutral-100 rounded-xl p-4 bg-neutral-50/50">
              <div class="flex items-center gap-2">
                <UCheckbox v-model="shouldRelocate" label="Set Location Immediately" />
              </div>
              <div v-if="shouldRelocate" class="space-y-4 pt-2">
                <UFormField label="Branch" name="branchId" required>
                  <USelectMenu
                    v-model="selectedBranch"
                    :items="branchOptions"
                    searchable
                    searchable-placeholder="Search branches..."
                    placeholder="Select branch"
                    :loading="isLoadingBranches"
                    class="w-full bg-white"
                  />
                </UFormField>

                <UFormField label="New Location" name="locationId" required>
                  <USelectMenu
                    v-model="selectedLocation"
                    :items="filteredLocationOptions"
                    searchable
                    searchable-placeholder="Search locations..."
                    :placeholder="selectedBranch ? 'Select location' : 'Select branch first'"
                    :disabled="!selectedBranch"
                    :loading="isLoadingLocations"
                    class="w-full bg-white"
                  />
                </UFormField>

                <UFormField label="Relocation Date" name="locationDate" required>
                  <UInput type="datetime-local" v-model="form.locationDate" class="w-full bg-white" />
                </UFormField>

                <UFormField label="Relocation Notes" name="locationNote">
                  <UTextarea v-model="form.locationNote" placeholder="Enter relocation reasons or details (optional)" class="w-full bg-white" :rows="2" />
                </UFormField>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-2 pt-4 mt-6 border-t border-neutral-100">
          <UButton color="primary" variant="outline" :loading="isSubmitting && submitMode === 'another'" :disabled="isUploading || isSubmitting || hasInvalidCodes" @click="submitMode = 'another'; submitForm()">
            Save &amp; Create Another
          </UButton>
          <UButton type="submit" color="primary" :loading="isSubmitting && submitMode === 'save'" :disabled="isUploading || isSubmitting || hasInvalidCodes" @click="submitMode = 'save'">
            Save Asset
          </UButton>
        </div>
      </UForm>
    </UCard>

    <CategoryAddModal v-model="showAddCategory" @created="onCategoryCreated" />
    <SubCategoryAddModal v-model="showAddSubCategory" @created="() => onSubCategoryCreated(form)" />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { assetService } from '~/services/asset-service'
import { assetSchema } from '~/composables/useAssetForm'
import { employeeService } from '~/services/employee-service'
import { branchService } from '~/services/branch-service'
import { locationService } from '~/services/location-service'
import type { AssetPayload } from '~/types/asset'

definePageMeta({ layout: 'dashboard' })

const {
  toast, isUploading, previewUrl,
  labels, addLabel, removeLabel, getFilteredLabels,
  selectedCategoryId, categoryOptions, subCategoryOptions, isLoadingSubCategories,
  showAddCategory, showAddSubCategory,
  fetchCategories, fetchSubCategories, onCategoryCreated, onSubCategoryCreated,
  fileInput, triggerFileInput, onFileChange, removeImage,
  makePurchaseDateComputed, makePriceDisplayComputed,
} = useAssetForm()

// ── State ───────────────────────────────────────────────────────────────────
const isSubmitting = ref(false)
const submitMode = ref<'save' | 'another'>('save')

// ── Schema & Form ───────────────────────────────────────────────────────────
const shouldAssign = ref(false)
const shouldRelocate = ref(false)

const baseSchema = assetSchema.pick({ categoryId: true, name: true, subCategoryId: true, brand: true, model: true, price: true, purchaseDate: true, description: true })

const schema = computed(() => {
  const extension: Record<string, any> = {}
  if (shouldAssign.value) {
    extension.employeeId = z.number().int().positive('Employee is required')
    extension.assignedDate = z.string().min(1, 'Assignment date is required')
    extension.assignNote = z.string().optional().or(z.literal(''))
  }
  if (shouldRelocate.value) {
    extension.branchId = z.number().int().positive('Branch is required')
    extension.locationId = z.number().int().positive('Location is required')
    extension.locationDate = z.string().min(1, 'Relocation date is required')
    extension.locationNote = z.string().optional().or(z.literal(''))
  }
  return baseSchema.extend(extension)
})

const form = reactive<Omit<AssetPayload, 'code'> & { categoryId: number; branchId?: number }>({
  categoryId: undefined as unknown as number,
  name: '',
  description: '',
  price: undefined,
  purchaseDate: '',
  brand: '',
  model: '',
  image: null,
  subCategoryId: undefined as unknown as number,
  
  // Assignment fields
  employeeId: undefined as unknown as number,
  assignedDate: '',
  assignNote: '',
  
  // Relocation fields
  branchId: undefined as unknown as number,
  locationId: undefined as unknown as number,
  locationDate: '',
  locationNote: '',
})

// ── Immediate Assign & Location Loaders ──────────────────────────────────────
const isLoadingEmployees = ref(false)
const isLoadingBranches = ref(false)
const isLoadingLocations = ref(false)

const employeeOptions = ref<{ label: string; value: number }[]>([])
const branchOptions = ref<{ label: string; value: number }[]>([])
const filteredLocationOptions = ref<{ label: string; value: number }[]>([])

const selectedEmployee = ref<{ label: string; value: number } | undefined>(undefined)
const selectedBranch = ref<{ label: string; value: number } | undefined>(undefined)
const selectedLocation = ref<{ label: string; value: number } | undefined>(undefined)

const getLocalDatetimeString = () => {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const loadEmployees = async () => {
  if (employeeOptions.value.length > 0) return
  isLoadingEmployees.value = true
  try {
    const res = await employeeService.getAll(1, 500)
    if (res.success && res.data) {
      employeeOptions.value = res.data.map(e => ({
        label: `${e.name} (${e.employeeId})`,
        value: e.id
      }))
    }
  } finally {
    isLoadingEmployees.value = false
  }
}

const loadBranches = async () => {
  if (branchOptions.value.length > 0) return
  isLoadingBranches.value = true
  try {
    const res = await branchService.getAll(1, 200)
    if (res.success && res.data) {
      branchOptions.value = res.data.map(b => ({
        label: `${b.code} - ${b.name}`,
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

watch(selectedEmployee, (val) => {
  if (val) form.employeeId = val.value
})

watch(selectedBranch, async (val) => {
  if (val) {
    form.branchId = val.value
    await loadLocationsForBranch(val.value)
  } else {
    form.branchId = undefined
    filteredLocationOptions.value = []
  }
  selectedLocation.value = undefined
  form.locationId = undefined as unknown as number
})

watch(selectedLocation, (val) => {
  if (val) form.locationId = val.value
})

watch(shouldAssign, (val) => {
  if (val) {
    form.assignedDate = getLocalDatetimeString()
    loadEmployees()
  } else {
    form.employeeId = undefined as unknown as number
    form.assignedDate = ''
    form.assignNote = ''
    selectedEmployee.value = undefined
  }
})

watch(shouldRelocate, (val) => {
  if (val) {
    form.locationDate = getLocalDatetimeString()
    loadBranches()
  } else {
    form.branchId = undefined
    form.locationId = undefined as unknown as number
    form.locationDate = ''
    form.locationNote = ''
    selectedBranch.value = undefined
    selectedLocation.value = undefined
    filteredLocationOptions.value = []
  }
})

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
const codes = ref<string[]>([''])
const codeStatuses = ref<Record<number, CodeStatus>>({})
const codeTimers: Record<number, ReturnType<typeof setTimeout>> = {}
const prevCodes = ref<string[]>([''])

const addCode = () => { codes.value.push('') }

const removeCode = (index: number) => {
  if (codeTimers[index]) clearTimeout(codeTimers[index])
  codes.value.splice(index, 1)
  const newStatuses: Record<number, CodeStatus> = {}
  codes.value.forEach((_, i) => {
    const oldIndex = i >= index ? i + 1 : i
    newStatuses[i] = codeStatuses.value[oldIndex] ?? null
  })
  codeStatuses.value = newStatuses
  prevCodes.value = [...codes.value]
}

const validateCode = (index: number, code: string) => {
  if (codeTimers[index]) clearTimeout(codeTimers[index])
  const trimmed = code?.trim()
  if (!trimmed) { codeStatuses.value[index] = null; return }
  codeStatuses.value[index] = 'checking'
  codeTimers[index] = setTimeout(async () => {
    const res = await assetService.checkCode(trimmed)
    if (codes.value[index]?.trim() === trimmed && res.success) {
      codeStatuses.value[index] = res.data.exists ? 'exists' : 'available'
    }
  }, 500)
}

watch(codes, (newCodes) => {
  newCodes.forEach((code, index) => {
    if (code !== prevCodes.value[index]) validateCode(index, code)
  })
  prevCodes.value = [...newCodes]
}, { deep: true })

const isDuplicateCode = (index: number) => {
  const code = codes.value[index]?.trim()
  if (!code) return false
  return codes.value.some((c, i) => i !== index && c.trim() === code)
}

const hasInvalidCodes = computed(() => {
  const trimmed = codes.value.map(c => c.trim()).filter(c => c.length > 0)
  return new Set(trimmed).size !== trimmed.length || Object.values(codeStatuses.value).some(s => s === 'exists')
})

// ── Reset ───────────────────────────────────────────────────────────────────
const resetForm = () => {
  codes.value = ['']
  codeStatuses.value = {}
  prevCodes.value = ['']
  Object.assign(form, {
    categoryId: undefined, name: '', description: '', price: undefined,
    purchaseDate: '', brand: '', model: '', image: null, subCategoryId: undefined,
    employeeId: undefined, assignedDate: '', assignNote: '',
    branchId: undefined, locationId: undefined, locationDate: '', locationNote: '',
  })
  selectedCategoryId.value = undefined
  previewUrl.value = null
  labels.value = []
  shouldAssign.value = false
  shouldRelocate.value = false
  selectedEmployee.value = undefined
  selectedBranch.value = undefined
  selectedLocation.value = undefined
  filteredLocationOptions.value = []
}

// ── Submit ──────────────────────────────────────────────────────────────────
const submitForm = () => {
  (document.getElementById('create-asset-form') as HTMLFormElement)?.requestSubmit()
}

const handleSubmit = async () => {
  const validCodes = codes.value.map(c => c.trim()).filter(c => c.length > 0)
  if (validCodes.length === 0) {
    toast.add({ title: 'At least one code is required', color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  if (new Set(validCodes).size !== validCodes.length) {
    toast.add({ title: 'Duplicate codes are not allowed', color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }

  isSubmitting.value = true
  let successCount = 0
  const failedCodes: string[] = []
  const filteredLabels = getFilteredLabels()

  try {
    for (const code of validCodes) {
      const payload: AssetPayload = {
        code,
        name: form.name, description: form.description, price: form.price,
        purchaseDate: form.purchaseDate, brand: form.brand, model: form.model,
        image: form.image, subCategoryId: form.subCategoryId, labels: filteredLabels,
      }

      if (shouldAssign.value) {
        payload.employeeId = form.employeeId
        payload.assignedDate = form.assignedDate
        payload.assignNote = form.assignNote || undefined
      }

      if (shouldRelocate.value) {
        payload.locationId = form.locationId
        payload.locationDate = form.locationDate
        payload.locationNote = form.locationNote || undefined
      }

      const response = await assetService.create(payload)
      response.success ? successCount++ : failedCodes.push(code)
    }
    if (successCount > 0) {
      toast.add({ title: `${successCount} asset${successCount > 1 ? 's' : ''} created successfully!`, color: 'success', icon: 'i-lucide-circle-check' })
    }
    if (failedCodes.length > 0) {
      toast.add({ title: `Failed to create: ${failedCodes.join(', ')}`, description: 'Code may already exist', color: 'error', icon: 'i-lucide-circle-alert' })
    }
    if (failedCodes.length === 0) {
      submitMode.value === 'another' ? resetForm() : navigateTo('/asset')
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => fetchCategories())
</script>
