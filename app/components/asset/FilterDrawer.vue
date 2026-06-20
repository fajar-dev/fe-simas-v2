<template>
  <USlideover
    v-model:open="open"
    title="Advance Filter"
    description="Narrow down your asset list"
    :ui="{ overlay: 'bg-black/40' }"
  >
    <template #body>
      <div class="space-y-5">

        <!-- Category -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Category</label>
            <UButton v-if="filters.categoryId" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('categoryId')">Clear</UButton>
          </div>
          <USelectMenu
            v-model="filters.categoryId"
            :items="categoryOptions"
            placeholder="All Categories"
            value-key="value"
            class="w-full"
            @update:model-value="onCategoryChange"
          />
        </div>

        <!-- Sub Category -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Sub Category</label>
            <UButton v-if="filters.subCategoryId" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('subCategoryId')">Clear</UButton>
          </div>
          <USelectMenu
            v-model="filters.subCategoryId"
            :items="subCategoryOptions"
            placeholder="All Sub Categories"
            value-key="value"
            :disabled="!filters.categoryId"
            class="w-full"
          />
        </div>

        <USeparator />

        <!-- Branch -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Branch</label>
            <UButton v-if="filters.branchId" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('branchId')">Clear</UButton>
          </div>
          <USelectMenu
            v-model="filters.branchId"
            :items="branchOptions"
            placeholder="All Branches"
            value-key="value"
            class="w-full"
            @update:model-value="onBranchChange"
          />
        </div>

        <!-- Location -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Location</label>
            <UButton v-if="filters.locationId" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('locationId')">Clear</UButton>
          </div>
          <USelectMenu
            v-model="filters.locationId"
            :items="locationOptions"
            placeholder="All Locations"
            value-key="value"
            :disabled="!filters.branchId"
            class="w-full"
          />
        </div>

        <USeparator />

        <!-- Holder Status -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Holder Status</label>
            <UButton v-if="filters.holderStatus" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('holderStatus')">Clear</UButton>
          </div>
          <URadioGroup
            v-model="filters.holderStatus"
            :items="holderStatusOptions"
            orientation="horizontal"
          />
        </div>

        <!-- Active Holder (only if has_holder) -->
        <div v-if="filters.holderStatus === 'has_holder'">
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Active Holder</label>
            <UButton v-if="filters.holderId" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('holderId')">Clear</UButton>
          </div>
          <USelectMenu
            v-model="filters.holderId"
            :items="employeeOptions"
            placeholder="All Employees"
            value-key="value"
            class="w-full"
          />
        </div>

        <USeparator />

        <!-- Price Range -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Price Range</label>
            <UButton v-if="filters.priceMin || filters.priceMax" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('priceMin'); clearField('priceMax')">Clear</UButton>
          </div>
          <div class="flex items-center gap-2">
            <UInput
              v-model="filters.priceMin"
              type="number"
              placeholder="Min"
              class="flex-1"
            />
            <span class="text-neutral-400 text-sm">—</span>
            <UInput
              v-model="filters.priceMax"
              type="number"
              placeholder="Max"
              class="flex-1"
            />
          </div>
        </div>

        <USeparator />

        <!-- Purchase Date -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Purchase Date</label>
            <UButton v-if="filters.purchaseDateFrom || filters.purchaseDateTo" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('purchaseDateFrom'); clearField('purchaseDateTo')">Clear</UButton>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <UInput
              v-model="filters.purchaseDateFrom"
              type="date"
              class="flex-1"
            />
            <span class="text-neutral-400 text-sm">—</span>
            <UInput
              v-model="filters.purchaseDateTo"
              type="date"
              class="flex-1"
            />
          </div>
          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="preset in datePresets"
              :key="preset.label"
              size="sm"
              :color="isDatePresetActive(preset) ? 'primary' : 'neutral'"
              :variant="isDatePresetActive(preset) ? 'solid' : 'outline'"
              @click="applyDatePreset(preset)"
            >
              {{ preset.label }}
            </UButton>
          </div>
        </div>

      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-rotate-ccw"
          @click="resetAll"
        >
          Clear All
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-check"
          @click="applyFilters"
        >
          Apply Filters
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { categoryService } from '~/services/category-service'
import { subCategoryService } from '~/services/sub-category-service'
import { branchService } from '~/services/branch-service'
import { locationService } from '~/services/location-service'
import { employeeService } from '~/services/employee-service'

const props = defineProps<{
  initialFilters?: Record<string, any>
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  apply: [filters: Record<string, any>]
}>()

// Filter state
const filters = reactive<Record<string, any>>({
  categoryId: undefined,
  subCategoryId: undefined,
  branchId: undefined,
  locationId: undefined,
  holderStatus: undefined,
  holderId: undefined,
  priceMin: undefined,
  priceMax: undefined,
  purchaseDateFrom: undefined,
  purchaseDateTo: undefined,
})

// Options
const categoryOptions = ref<{ label: string; value: number }[]>([])
const subCategoryOptions = ref<{ label: string; value: number }[]>([])
const branchOptions = ref<{ label: string; value: number }[]>([])
const locationOptions = ref<{ label: string; value: number }[]>([])
const employeeOptions = ref<{ label: string; value: number }[]>([])

const holderStatusOptions = [
  { label: 'Has Holder', value: 'has_holder' },
  { label: 'No Holder', value: 'no_holder' },
]

// Date presets
const datePresets = [
  { label: '> 1 Year', years: 1 },
  { label: '> 2 Years', years: 2 },
  { label: '> 3 Years', years: 3 },
  { label: '> 4 Years', years: 4 },
]

const isDatePresetActive = (preset: { years: number }) => {
  if (!filters.purchaseDateTo) return false
  const target = new Date()
  target.setFullYear(target.getFullYear() - preset.years)
  const targetStr = target.toISOString().split('T')[0]
  return !filters.purchaseDateFrom && filters.purchaseDateTo === targetStr
}

const applyDatePreset = (preset: { years: number }) => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - preset.years)
  filters.purchaseDateFrom = undefined
  filters.purchaseDateTo = date.toISOString().split('T')[0]
}

// Cascading: category → sub category
const onCategoryChange = () => {
  filters.subCategoryId = undefined
  if (filters.categoryId) {
    fetchSubCategories(filters.categoryId)
  } else {
    subCategoryOptions.value = []
  }
}

// Cascading: branch → location
const onBranchChange = () => {
  filters.locationId = undefined
  if (filters.branchId) {
    fetchLocations(filters.branchId)
  } else {
    locationOptions.value = []
  }
}

// Clear single field
const clearField = (field: string) => {
  filters[field] = undefined
  if (field === 'categoryId') {
    filters.subCategoryId = undefined
    subCategoryOptions.value = []
  }
  if (field === 'branchId') {
    filters.locationId = undefined
    locationOptions.value = []
  }
  if (field === 'holderStatus') {
    filters.holderId = undefined
  }
}

// Reset all
const resetAll = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = undefined
  })
  subCategoryOptions.value = []
  locationOptions.value = []
  applyFilters()
}

// Apply
const applyFilters = () => {
  const cleanFilters: Record<string, any> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanFilters[key] = value
    }
  }
  emit('apply', cleanFilters)
  open.value = false
}

// Fetch options
const fetchCategories = async () => {
  const res = await categoryService.getAll(1, 100, '')
  if (res.success) {
    categoryOptions.value = res.data.map(c => ({ label: c.name, value: c.id }))
  }
}

const fetchSubCategories = async (categoryId: number) => {
  const res = await subCategoryService.getByCategoryId(categoryId)
  if (res.success) {
    subCategoryOptions.value = res.data.map(s => ({ label: s.name, value: s.id }))
  }
}

const fetchBranches = async () => {
  const res = await branchService.getAll(1, 100, '')
  if (res.success) {
    branchOptions.value = res.data.map(b => ({ label: b.name, value: b.id }))
  }
}

const fetchLocations = async (branchId: number) => {
  const res = await locationService.getByBranchId(branchId)
  if (res.success) {
    locationOptions.value = res.data.map(l => ({ label: l.name, value: l.id }))
  }
}

const fetchEmployees = async () => {
  const res = await employeeService.getAll(1, 100, '')
  if (res.success) {
    employeeOptions.value = res.data.map(e => ({ label: `${e.name} (${e.employeeId})`, value: e.id }))
  }
}

// Fetch data when drawer opens
watch(open, (isOpen) => {
  if (isOpen) {
    // Sync local filters with parent's activeFilters
    Object.keys(filters).forEach(key => {
      filters[key] = props.initialFilters?.[key] ?? undefined
    })

    fetchCategories()
    fetchBranches()
    fetchEmployees()
    // Refetch sub-categories/locations if parent is already selected
    if (filters.categoryId) fetchSubCategories(filters.categoryId)
    if (filters.branchId) fetchLocations(filters.branchId)
  }
})
</script>
