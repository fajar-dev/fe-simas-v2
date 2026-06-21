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
            <UButton v-if="filters.categoryIds?.length" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('categoryIds')">Clear</UButton>
          </div>
          <USelectMenu
            v-model="filters.categoryIds"
            :items="categoryOptions"
            placeholder="All Categories"
            value-key="value"
            multiple
            class="w-full"
            @update:model-value="onCategoryChange"
          />
        </div>

        <!-- Sub Category -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Sub Category</label>
            <UButton v-if="filters.subCategoryIds?.length" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('subCategoryIds')">Clear</UButton>
          </div>
          <USelectMenu
            v-model="filters.subCategoryIds"
            :items="subCategoryOptions"
            placeholder="All Sub Categories"
            value-key="value"
            multiple
            :disabled="!filters.categoryIds?.length"
            class="w-full"
          />
        </div>

        <USeparator />

        <!-- Branch -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Branch</label>
            <UButton v-if="filters.branchIds?.length" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('branchIds')">Clear</UButton>
          </div>
          <USelectMenu
            v-model="filters.branchIds"
            :items="branchOptions"
            placeholder="All Branches"
            value-key="value"
            multiple
            class="w-full"
            @update:model-value="onBranchChange"
          />
        </div>

        <!-- Location -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Location</label>
            <UButton v-if="filters.locationIds?.length" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('locationIds')">Clear</UButton>
          </div>
          <USelectMenu
            v-model="filters.locationIds"
            :items="locationOptions"
            placeholder="All Locations"
            value-key="value"
            multiple
            :disabled="!filters.branchIds?.length"
            class="w-full"
          />
        </div>

        <USeparator />

        <!-- Status -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Status</label>
            <UButton v-if="filters.status?.length" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('status')">Clear</UButton>
          </div>
          <USelectMenu
            v-model="filters.status"
            :items="statusOptions"
            placeholder="All Statuses"
            value-key="value"
            multiple
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
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <UInput
              v-model="priceMinDisplay"
              placeholder="Min"
              class="w-full sm:flex-1"
            >
              <template #leading>
                <span class="text-neutral-500 text-sm">Rp</span>
              </template>
            </UInput>
            <span class="text-neutral-400 text-sm hidden sm:inline">—</span>
            <UInput
              v-model="priceMaxDisplay"
              placeholder="Max"
              class="w-full sm:flex-1"
            >
              <template #leading>
                <span class="text-neutral-500 text-sm">Rp</span>
              </template>
            </UInput>
          </div>
        </div>

        <USeparator />

        <!-- Purchase Date -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Purchase Date</label>
            <UButton v-if="filters.purchaseDateFrom || filters.purchaseDateTo" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('purchaseDateFrom'); clearField('purchaseDateTo')">Clear</UButton>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <UInputDate v-model="purchaseDateFromVal" class="w-full sm:flex-1">
              <template #trailing>
                <UPopover>
                  <UButton icon="i-lucide-calendar" color="neutral" variant="ghost" size="sm" square />
                  <template #content>
                    <UCalendar v-model="purchaseDateFromVal" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
            <span class="text-neutral-400 text-sm hidden sm:inline">—</span>
            <UInputDate v-model="purchaseDateToVal" class="w-full sm:flex-1">
              <template #trailing>
                <UPopover>
                  <UButton icon="i-lucide-calendar" color="neutral" variant="ghost" size="sm" square />
                  <template #content>
                    <UCalendar v-model="purchaseDateToVal" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
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

        <USeparator />

        <!-- Labels -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">Labels</label>
            <UButton icon="i-lucide-plus" size="xs" color="primary" variant="soft" @click="addLabelFilter">Add</UButton>
          </div>
          <div v-if="!labelFilters.length" class="text-sm text-neutral-400 py-3 text-center border border-dashed border-neutral-200 rounded-lg">
            No label filters added
          </div>
          <div v-else class="space-y-2">
            <div v-for="(lf, index) in labelFilters" :key="index" class="flex items-center gap-2">
              <UInputMenu
                v-model="lf.key"
                :items="availableLabelKeys"
                placeholder="Key"
                class="w-full"
              />
              <UInput v-model="lf.value" placeholder="Value" class="w-full" />
              <UButton icon="i-lucide-trash" color="error" variant="ghost" size="sm" square @click="removeLabelFilter(index)" />
            </div>
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
import { parseDate } from '@internationalized/date'
import { categoryService } from '~/services/category-service'
import { subCategoryService } from '~/services/sub-category-service'
import { branchService } from '~/services/branch-service'
import { locationService } from '~/services/location-service'
import { employeeService } from '~/services/employee-service'
import { assetService } from '~/services/asset-service'

const props = defineProps<{
  initialFilters?: Record<string, any>
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  apply: [filters: Record<string, any>]
}>()

// Filter state
const filters = reactive<Record<string, any>>({
  categoryIds: [],
  subCategoryIds: [],
  branchIds: [],
  locationIds: [],
  status: [],
  holderStatus: undefined,
  holderId: undefined,
  priceMin: undefined,
  priceMax: undefined,
  purchaseDateFrom: undefined,
  purchaseDateTo: undefined,
})

const purchaseDateFromVal = computed({
  get: () => {
    if (!filters.purchaseDateFrom) return undefined
    try { return parseDate(filters.purchaseDateFrom) } catch { return undefined }
  },
  set: (val) => { filters.purchaseDateFrom = val ? val.toString() : undefined }
})

const purchaseDateToVal = computed({
  get: () => {
    if (!filters.purchaseDateTo) return undefined
    try { return parseDate(filters.purchaseDateTo) } catch { return undefined }
  },
  set: (val) => { filters.purchaseDateTo = val ? val.toString() : undefined }
})

const priceMinDisplay = computed({
  get: () => formatIndonesianNumber(filters.priceMin),
  set: (val) => { filters.priceMin = parseIndonesianNumber(val) }
})

const priceMaxDisplay = computed({
  get: () => formatIndonesianNumber(filters.priceMax),
  set: (val) => { filters.priceMax = parseIndonesianNumber(val) }
})

// Label filters (separate from main filters, merged on apply)
const labelFilters = ref<{ key: string; value: string }[]>([])
const addLabelFilter = () => { labelFilters.value.push({ key: '', value: '' }) }
const removeLabelFilter = (index: number) => { labelFilters.value.splice(index, 1) }

// Options
const categoryOptions = ref<{ label: string; value: number }[]>([])
const subCategoryOptions = ref<{ label: string; value: number }[]>([])
const branchOptions = ref<{ label: string; value: number }[]>([])
const locationOptions = ref<{ label: string; value: number }[]>([])
const employeeOptions = ref<{ label: string; value: number }[]>([])
const availableLabelKeys = ref<string[]>([])

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Idle', value: 'idle' },
  { label: 'Under Repair', value: 'under_repair' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Lost', value: 'lost' },
  { label: 'Sold', value: 'sold' },
  { label: 'Disposed', value: 'disposed' },
]

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

// Cascading: category → sub category (fetch for all selected categories)
const onCategoryChange = async () => {
  filters.subCategoryIds = []
  subCategoryOptions.value = []
  if (filters.categoryIds?.length) {
    const allSubs: { label: string; value: number }[] = []
    for (const catId of filters.categoryIds) {
      const res = await subCategoryService.getByCategoryId(catId)
      if (res.success) {
        allSubs.push(...res.data.map(s => ({ label: s.name, value: s.id })))
      }
    }
    subCategoryOptions.value = allSubs
  }
}

// Cascading: branch → location (fetch for all selected branches)
const onBranchChange = async () => {
  filters.locationIds = []
  locationOptions.value = []
  if (filters.branchIds?.length) {
    const allLocs: { label: string; value: number }[] = []
    for (const branchId of filters.branchIds) {
      const res = await locationService.getByBranchId(branchId)
      if (res.success) {
        allLocs.push(...res.data.map(l => ({ label: l.name, value: l.id })))
      }
    }
    locationOptions.value = allLocs
  }
}

// Clear single field
const clearField = (field: string) => {
  if (['categoryIds', 'subCategoryIds', 'branchIds', 'locationIds', 'status'].includes(field)) {
    filters[field] = []
  } else {
    filters[field] = undefined
  }
  if (field === 'categoryIds') {
    filters.subCategoryIds = []
    subCategoryOptions.value = []
  }
  if (field === 'branchIds') {
    filters.locationIds = []
    locationOptions.value = []
  }
  if (field === 'holderStatus') {
    filters.holderId = undefined
  }
}

// Reset all
const resetAll = () => {
  filters.categoryIds = []
  filters.subCategoryIds = []
  filters.branchIds = []
  filters.locationIds = []
  filters.status = []
  filters.holderStatus = undefined
  filters.holderId = undefined
  filters.priceMin = undefined
  filters.priceMax = undefined
  filters.purchaseDateFrom = undefined
  filters.purchaseDateTo = undefined
  labelFilters.value = []
  subCategoryOptions.value = []
  locationOptions.value = []
  applyFilters()
}

// Apply
const applyFilters = () => {
  const cleanFilters: Record<string, any> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      if (value.length > 0) cleanFilters[key] = value
    } else if (value !== undefined && value !== null && value !== '') {
      cleanFilters[key] = value
    }
  }
  // Merge label filters
  const validLabels = labelFilters.value.filter(l => l.key.trim() && l.value.trim())
  if (validLabels.length) {
    cleanFilters.labels = validLabels.map(l => ({ key: l.key.trim(), value: l.value.trim() }))
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

const fetchBranches = async () => {
  const res = await branchService.getAll(1, 100, '')
  if (res.success) {
    branchOptions.value = res.data.map(b => ({ label: b.name, value: b.id }))
  }
}

const fetchEmployees = async () => {
  const res = await employeeService.getAll(1, 100, '')
  if (res.success) {
    employeeOptions.value = res.data.map(e => ({ label: `${e.name} (${e.employeeId})`, value: e.id }))
  }
}

const fetchLabelKeys = async () => {
  const res = await assetService.getLabelKeys()
  if (res.success) {
    availableLabelKeys.value = res.data
  }
}

// Fetch data when drawer opens
watch(open, (isOpen) => {
  if (isOpen) {
    // Sync local filters with parent's activeFilters
    const init = props.initialFilters || {}
    filters.categoryIds = init.categoryIds || []
    filters.subCategoryIds = init.subCategoryIds || []
    filters.branchIds = init.branchIds || []
    filters.locationIds = init.locationIds || []
    filters.status = init.status || []
    filters.holderStatus = init.holderStatus ?? undefined
    filters.holderId = init.holderId ?? undefined
    filters.priceMin = init.priceMin ?? undefined
    filters.priceMax = init.priceMax ?? undefined
    filters.purchaseDateFrom = init.purchaseDateFrom ?? undefined
    filters.purchaseDateTo = init.purchaseDateTo ?? undefined
    labelFilters.value = init.labels ? init.labels.map((l: any) => ({ ...l })) : []

    fetchCategories()
    fetchBranches()
    fetchEmployees()
    fetchLabelKeys()
    // Refetch sub-categories/locations if parent is already selected
    if (filters.categoryIds?.length) onCategoryChange()
    if (filters.branchIds?.length) onBranchChange()
  }
})
</script>
