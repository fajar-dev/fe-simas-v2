<template>
  <USlideover
    v-model:open="open"
    :title="$t('component.inventory.filterDrawer.title')"
    :description="$t('component.inventory.filterDrawer.description')"
    :ui="{ overlay: 'bg-black/40' }"
  >
    <template #body>
      <div class="space-y-5">

        <!-- Category -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('common.category') }}</label>
            <UButton v-if="filters.categoryIds?.length" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('categoryIds')">{{ $t('component.inventory.filterDrawer.clear') }}</UButton>
          </div>
          <USelectMenu
            v-model="filters.categoryIds"
            :items="categoryOptions"
            :placeholder="$t('component.inventory.filterDrawer.allCategories')"
            value-key="value"
            multiple
            class="w-full"
            @update:model-value="onCategoryChange"
          />
        </div>

        <!-- Sub Category -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('common.subCategory') }}</label>
            <UButton v-if="filters.subCategoryIds?.length" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('subCategoryIds')">{{ $t('component.inventory.filterDrawer.clear') }}</UButton>
          </div>
          <USelectMenu
            v-model="filters.subCategoryIds"
            :items="subCategoryOptions"
            :placeholder="$t('component.inventory.filterDrawer.allSubCategories')"
            value-key="value"
            multiple
            :disabled="!filters.categoryIds?.length"
            class="w-full"
          />
        </div>

        <!-- Unit -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('pages.inventory.unit.label') }}</label>
            <UButton v-if="filters.units?.length" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('units')">{{ $t('component.inventory.filterDrawer.clear') }}</UButton>
          </div>
          <USelectMenu
            v-model="filters.units"
            :items="unitOptions"
            :placeholder="$t('component.inventory.filterDrawer.allUnits')"
            value-key="value"
            multiple
            class="w-full"
          />
        </div>

        <USeparator />

        <!-- Status -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('component.inventory.filterDrawer.status') }}</label>
            <UButton v-if="filters.isActive" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('isActive')">{{ $t('component.inventory.filterDrawer.clear') }}</UButton>
          </div>
          <URadioGroup
            v-model="filters.isActive"
            :items="statusOptions"
            orientation="horizontal"
          />
        </div>

        <!-- Variant Status -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('component.inventory.filterDrawer.variantStatus') }}</label>
            <UButton v-if="filters.variantStatus" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('variantStatus')">{{ $t('component.inventory.filterDrawer.clear') }}</UButton>
          </div>
          <URadioGroup
            v-model="filters.variantStatus"
            :items="variantStatusOptions"
            orientation="horizontal"
          />
        </div>

        <USeparator />

        <!-- New Stock Range -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('component.inventory.filterDrawer.newStockRange') }}</label>
            <UButton v-if="filters.newStockMin || filters.newStockMax" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('newStockMin'); clearField('newStockMax')">{{ $t('component.inventory.filterDrawer.clear') }}</UButton>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <UInput v-model.number="filters.newStockMin" type="number" min="0" :placeholder="$t('component.inventory.filterDrawer.min')" class="w-full sm:flex-1" />
            <span class="text-neutral-400 text-sm hidden sm:inline">—</span>
            <UInput v-model.number="filters.newStockMax" type="number" min="0" :placeholder="$t('component.inventory.filterDrawer.max')" class="w-full sm:flex-1" />
          </div>
        </div>

        <!-- Used Stock Range -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('component.inventory.filterDrawer.usedStockRange') }}</label>
            <UButton v-if="filters.usedStockMin || filters.usedStockMax" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('usedStockMin'); clearField('usedStockMax')">{{ $t('component.inventory.filterDrawer.clear') }}</UButton>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <UInput v-model.number="filters.usedStockMin" type="number" min="0" :placeholder="$t('component.inventory.filterDrawer.min')" class="w-full sm:flex-1" />
            <span class="text-neutral-400 text-sm hidden sm:inline">—</span>
            <UInput v-model.number="filters.usedStockMax" type="number" min="0" :placeholder="$t('component.inventory.filterDrawer.max')" class="w-full sm:flex-1" />
          </div>
        </div>

        <USeparator />

        <!-- Data Quality -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('component.inventory.filterDrawer.dataQuality') }}</label>
            <UButton v-if="filters.missingFields?.length" icon="i-lucide-x" size="xs" color="error" variant="ghost" @click="clearField('missingFields')">{{ $t('component.inventory.filterDrawer.clear') }}</UButton>
          </div>
          <USelectMenu
            v-model="filters.missingFields"
            :items="missingFieldOptions"
            :placeholder="$t('component.inventory.filterDrawer.allComplete')"
            value-key="value"
            multiple
            class="w-full"
          />
        </div>

        <USeparator />

        <!-- Labels -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('component.inventory.filterDrawer.labels') }}</label>
            <UButton icon="i-lucide-plus" size="xs" color="primary" variant="soft" @click="addLabelFilter">{{ $t('common.add') }}</UButton>
          </div>
          <div v-if="!labelFilters.length" class="text-sm text-neutral-400 py-3 text-center border border-dashed border-neutral-200 rounded-lg">
            {{ $t('component.inventory.filterDrawer.noLabels') }}
          </div>
          <div v-else class="space-y-2">
            <div v-for="(lf, index) in labelFilters" :key="index" class="flex items-center gap-2">
              <UInputMenu
                v-model="lf.key"
                :items="availableLabelKeys"
                :placeholder="$t('component.inventory.filterDrawer.key')"
                class="w-full"
              />
              <UInput v-model="lf.value" :placeholder="$t('component.inventory.filterDrawer.value')" class="w-full" />
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
          {{ $t('common.clearAll') }}
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-check"
          @click="applyFilters"
        >
          {{ $t('component.inventory.filterDrawer.applyFilters') }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { categoryService } from '~/services/category-service'
import { subCategoryService } from '~/services/sub-category-service'
import { inventoryService } from '~/services/inventory-service'

const { t } = useI18n()

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
  units: [],
  isActive: undefined,
  variantStatus: undefined,
  newStockMin: undefined,
  newStockMax: undefined,
  usedStockMin: undefined,
  usedStockMax: undefined,
  missingFields: [],
})

// Label filters (separate from main filters, merged on apply)
const labelFilters = ref<{ key: string; value: string }[]>([])
const addLabelFilter = () => { labelFilters.value.push({ key: '', value: '' }) }
const removeLabelFilter = (index: number) => { labelFilters.value.splice(index, 1) }

// Options
const categoryOptions = ref<{ label: string; value: number }[]>([])
const subCategoryOptions = ref<{ label: string; value: number }[]>([])
const availableLabelKeys = ref<string[]>([])
const unitOptions = INVENTORY_UNITS.map(u => ({ label: u as string, value: u as string }))

const statusOptions = computed(() => [
  { label: t('common.active'), value: 'true' },
  { label: t('common.inactive'), value: 'false' },
])

const variantStatusOptions = computed(() => [
  { label: t('component.inventory.filterDrawer.hasVariants'), value: 'has_variants' },
  { label: t('component.inventory.filterDrawer.noVariants'), value: 'no_variants' },
])

const missingFieldOptions = computed(() => [
  { label: t('component.inventory.filterDrawer.withoutImage'), value: 'image' },
  { label: t('component.inventory.filterDrawer.withoutDescription'), value: 'description' },
  { label: t('component.inventory.filterDrawer.withoutSubCategory'), value: 'subCategory' },
])

// Cascading: category → sub category (fetch for all selected categories)
const fetchSubCategoriesFor = async (categoryIds: number[]) => {
  subCategoryOptions.value = []
  if (categoryIds?.length) {
    const allSubs: { label: string; value: number }[] = []
    for (const catId of categoryIds) {
      const res = await subCategoryService.getByCategoryId(catId)
      if (res.success) {
        allSubs.push(...res.data.map(s => ({ label: s.name, value: s.id })))
      }
    }
    subCategoryOptions.value = allSubs
  }
}

// User-driven category change: reset the now-possibly-invalid sub-category selection.
const onCategoryChange = async () => {
  filters.subCategoryIds = []
  await fetchSubCategoriesFor(filters.categoryIds)
}

// Clear single field
const clearField = (field: string) => {
  if (['categoryIds', 'subCategoryIds', 'units', 'missingFields'].includes(field)) {
    filters[field] = []
  } else {
    filters[field] = undefined
  }
  if (field === 'categoryIds') {
    filters.subCategoryIds = []
    subCategoryOptions.value = []
  }
}

// Reset all
const resetAll = () => {
  filters.categoryIds = []
  filters.subCategoryIds = []
  filters.units = []
  filters.isActive = undefined
  filters.variantStatus = undefined
  filters.newStockMin = undefined
  filters.newStockMax = undefined
  filters.usedStockMin = undefined
  filters.usedStockMax = undefined
  filters.missingFields = []
  labelFilters.value = []
  subCategoryOptions.value = []
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
  const res = await categoryService.getList()
  if (res.success) {
    categoryOptions.value = res.data.map(c => ({ label: c.name, value: c.id }))
  }
}

const fetchLabelKeys = async () => {
  const res = await inventoryService.getLabelKeys()
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
    filters.units = init.units || []
    filters.isActive = init.isActive ?? undefined
    filters.variantStatus = init.variantStatus ?? undefined
    filters.newStockMin = init.newStockMin ?? undefined
    filters.newStockMax = init.newStockMax ?? undefined
    filters.usedStockMin = init.usedStockMin ?? undefined
    filters.usedStockMax = init.usedStockMax ?? undefined
    filters.missingFields = init.missingFields || []
    labelFilters.value = init.labels ? init.labels.map((l: any) => ({ ...l })) : []

    fetchCategories()
    fetchLabelKeys()
    // Refetch sub-category options (without clearing the restored selection)
    if (filters.categoryIds?.length) fetchSubCategoriesFor(filters.categoryIds)
  }
})
</script>
