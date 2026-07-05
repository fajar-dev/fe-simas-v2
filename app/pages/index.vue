<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <Header
      :title="$t('pages.dashboard.title')"
      :description="$t('pages.dashboard.description')"
    >
      <template #actions>
        <USelectMenu
          v-model="selectedStatuses"
          :items="statusOptions"
          multiple
          value-key="value"
          :placeholder="$t('pages.dashboard.filterByStatus')"
          class="w-48"
        />
      </template>
    </Header>

    <!-- Stats Cards Row 1 -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <UCard
        v-for="stat in statsRow1"
        :key="stat.key"
        :ui="{ body: 'sm:p-5' }"
      >
        <UAvatar
          :icon="stat.icon"
          size="lg"
          :ui="{ icon: stat.iconClass }"
          :class="[stat.bgClass, 'mb-3']"
          loading="lazy"
        />
        <p class="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">{{ stat.label }}</p>
        <p v-if="!isLoading" class="text-xl font-semibold text-neutral-900 tabular-nums">
          {{ stat.value.toLocaleString('id-ID') }}
        </p>
        <USkeleton v-else class="h-7 w-24" />
      </UCard>
    </div>

    <!-- Stats Cards Row 2 (Monetary) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard
        v-for="stat in statsRow2"
        :key="stat.key"
        :ui="{ body: 'sm:p-5' }"
      >
        <UAvatar
          :icon="stat.icon"
          size="lg"
          :ui="{ icon: stat.iconClass }"
          :class="[stat.bgClass, 'mb-3']"
          loading="lazy"
        />
        <p class="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">{{ stat.label }}</p>
        <p v-if="!isLoading" class="text-xl font-semibold text-neutral-900 tabular-nums">
          {{ stat.format(stat.value) }}
        </p>
        <USkeleton v-else class="h-7 w-24" />
      </UCard>
    </div>

    <!-- Charts Row 1: Category -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      <!-- Asset by Category (Donut) -->
      <UCard class="md:col-span-4">
        <template #header>
          <div>
            <h3 class="text-base font-semibold text-neutral-900">{{ $t('pages.dashboard.assetByCategory') }}</h3>
            <p class="text-xs text-neutral-500 mt-0.5">{{ $t('pages.dashboard.assetByCategoryDesc') }}</p>
          </div>
        </template>

        <div v-if="isChartLoading" class="flex items-center justify-center h-64">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-neutral-400" />
        </div>
        <div v-else-if="categoryData.length">
          <DonutChart
            :data="categoryDonutValues"
            :categories="categoryDonutCategories"
            :height="200"
            :radius="4"
            :arc-width="40"
            hide-legend
          />
          <div class="mt-3 max-h-36 overflow-y-auto space-y-1.5 pr-1">
            <div v-for="(item, i) in categoryData" :key="item.name" class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: chartColors[i % chartColors.length] }" />
                <span class="text-neutral-700 truncate">{{ item.name }}</span>
              </div>
              <span class="font-medium text-neutral-900 tabular-nums shrink-0 ml-2">{{ item.count.toLocaleString('id-ID') }}</span>
            </div>
          </div>
        </div>
        <div v-else class="flex items-center justify-center h-64 text-sm text-neutral-400">
          {{ $t('pages.dashboard.noData') }}
        </div>
      </UCard>

      <!-- Value by Category (Bar) -->
      <UCard class="md:col-span-8">
        <template #header>
          <div>
            <h3 class="text-base font-semibold text-neutral-900">{{ $t('pages.dashboard.valueByCategory') }}</h3>
            <p class="text-xs text-neutral-500 mt-0.5">{{ $t('pages.dashboard.valueByCategoryDesc') }}</p>
          </div>
        </template>

        <div v-if="isChartLoading" class="flex items-center justify-center h-64">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-neutral-400" />
        </div>
        <div v-else-if="categoryData.length">
          <BarChart
            :data="categoryBarData"
            :categories="categoryBarCategories"
            :height="260"
            :y-axis="['totalPrice', 'totalBookValue']"
            x-axis="name"
            :orientation="Orientation.Horizontal"
            :x-formatter="formatPriceShort"
            :y-formatter="(i: number) => categoryBarData[i]?.name ?? ''"
            :padding="{ top: 0, right: 10, bottom: 0, left: 80 }"
            :radius="4"
          />
        </div>
        <div v-else class="flex items-center justify-center h-64 text-sm text-neutral-400">
          {{ $t('pages.dashboard.noData') }}
        </div>
      </UCard>
    </div>

    <!-- Charts Row 2: Location -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      <!-- Asset by Location (Donut) -->
      <UCard class="md:col-span-4">
        <template #header>
          <div>
            <h3 class="text-base font-semibold text-neutral-900">{{ $t('pages.dashboard.assetByLocation') }}</h3>
            <p class="text-xs text-neutral-500 mt-0.5">{{ $t('pages.dashboard.assetByLocationDesc') }}</p>
          </div>
        </template>

        <div v-if="isChartLoading" class="flex items-center justify-center h-64">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-neutral-400" />
        </div>
        <div v-else-if="locationData.length">
          <DonutChart
            :data="locationDonutValues"
            :categories="locationDonutCategories"
            :height="200"
            :radius="4"
            :arc-width="40"
            hide-legend
          />
          <div class="mt-3 max-h-36 overflow-y-auto space-y-1.5 pr-1">
            <div v-for="(item, i) in locationData" :key="item.name" class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: chartColors[i % chartColors.length] }" />
                <span class="text-neutral-700 truncate">{{ item.name }}</span>
              </div>
              <span class="font-medium text-neutral-900 tabular-nums shrink-0 ml-2">{{ item.count.toLocaleString('id-ID') }}</span>
            </div>
          </div>
        </div>
        <div v-else class="flex items-center justify-center h-64 text-sm text-neutral-400">
          {{ $t('pages.dashboard.noData') }}
        </div>
      </UCard>

      <!-- Value by Location (Bar) -->
      <UCard class="md:col-span-8">
        <template #header>
          <div>
            <h3 class="text-base font-semibold text-neutral-900">{{ $t('pages.dashboard.valueByLocation') }}</h3>
            <p class="text-xs text-neutral-500 mt-0.5">{{ $t('pages.dashboard.valueByLocationDesc') }}</p>
          </div>
        </template>

        <div v-if="isChartLoading" class="flex items-center justify-center h-64">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-neutral-400" />
        </div>
        <div v-else-if="locationData.length">
          <BarChart
            :data="locationBarData"
            :categories="locationBarCategories"
            :height="260"
            :y-axis="['totalPrice', 'totalBookValue']"
            x-axis="name"
            :orientation="Orientation.Horizontal"
            :x-formatter="formatPriceShort"
            :y-formatter="(i: number) => locationBarData[i]?.name ?? ''"
            :padding="{ top: 0, right: 10, bottom: 0, left: 80 }"
            :radius="4"
          />
        </div>
        <div v-else class="flex items-center justify-center h-64 text-sm text-neutral-400">
          {{ $t('pages.dashboard.noData') }}
        </div>
      </UCard>
    </div>

    <!-- Charts Row 3: Sub Category, Aging, Data Quality -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Sub Category (Donut) -->
      <UCard>
        <template #header>
          <div>
            <h3 class="text-base font-semibold text-neutral-900">{{ $t('pages.dashboard.subCategories') }}</h3>
            <p class="text-xs text-neutral-500 mt-0.5">{{ $t('pages.dashboard.assetBySubCategory') }}</p>
          </div>
        </template>

        <div v-if="isChartLoading" class="flex items-center justify-center h-72">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-neutral-400" />
        </div>
        <div v-else-if="subCategoryData.length">
          <DonutChart
            :data="subCategoryDonutValues"
            :categories="subCategoryDonutCategories"
            :height="200"
            :radius="4"
            :arc-width="40"
            hide-legend
          />
          <div class="mt-3 max-h-40 overflow-y-auto space-y-1.5 pr-1">
            <div v-for="(item, i) in subCategoryData" :key="item.name" class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: chartColors[i % chartColors.length] }" />
                <span class="text-neutral-700 truncate">{{ item.name }}</span>
              </div>
              <span class="font-medium text-neutral-900 tabular-nums shrink-0 ml-2">{{ item.count.toLocaleString('id-ID') }}</span>
            </div>
          </div>
        </div>
        <div v-else class="flex items-center justify-center h-72 text-sm text-neutral-400">
          {{ $t('pages.dashboard.noData') }}
        </div>
      </UCard>

      <!-- Asset Aging (Bar) -->
      <UCard>
        <template #header>
          <div>
            <h3 class="text-base font-semibold text-neutral-900">{{ $t('pages.dashboard.assetAging') }}</h3>
            <p class="text-xs text-neutral-500 mt-0.5">{{ $t('pages.dashboard.assetAgingDesc') }}</p>
          </div>
        </template>

        <div v-if="isChartLoading" class="flex items-center justify-center h-72">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-neutral-400" />
        </div>
        <div v-else-if="agingData.length">
          <BarChart
            :data="agingBarData"
            :categories="agingBarCategories"
            :height="300"
            :y-axis="['count']"
            x-axis="label"
            :x-formatter="(i: number) => agingBarData[i]?.label ?? ''"
            :x-num-ticks="agingBarData.length"
            :radius="4"
            hide-legend
          />
        </div>
        <div v-else class="flex items-center justify-center h-72 text-sm text-neutral-400">
          {{ $t('pages.dashboard.noData') }}
        </div>
      </UCard>

      <!-- Data Quality (Bar) -->
      <UCard>
        <template #header>
          <div>
            <h3 class="text-base font-semibold text-neutral-900">{{ $t('pages.dashboard.dataQuality') }}</h3>
            <p class="text-xs text-neutral-500 mt-0.5">{{ $t('pages.dashboard.dataQualityDesc') }}</p>
          </div>
        </template>

        <div v-if="isChartLoading" class="flex items-center justify-center h-72">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-neutral-400" />
        </div>
        <div v-else-if="qualityData.length">
          <BarChart
            :data="qualityBarData"
            :categories="qualityBarCategories"
            :height="300"
            :y-axis="['count']"
            x-axis="label"
            :x-formatter="(i: number) => qualityBarData[i]?.label ?? ''"
            :x-num-ticks="qualityBarData.length"
            :radius="4"
            hide-legend
          />
        </div>
        <div v-else class="flex items-center justify-center h-72 text-sm text-neutral-400">
          {{ $t('pages.dashboard.noData') }}
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { statisticService } from '~/services/statistic-service'
import type { StatisticSummary, ChartGroupItem, LabelCountItem } from '~/services/statistic-service'
import { getStatusOptions } from '~/utils/status'

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

// ── Color palette ────────────────────────────────────
const chartColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7', '#eab308', '#0ea5e9',
]

// ── Status filter ────────────────────────────────────
const statusOptions = getStatusOptions()
const selectedStatuses = ref<string[]>(['active'])

// ── Loading states ───────────────────────────────────
const isLoading = ref(true)
const isChartLoading = ref(true)

// ── Summary data ─────────────────────────────────────
const summary = ref<StatisticSummary>({
  totalAssets: 0, totalPrice: 0, totalBookValue: 0, totalDepreciation: 0,
  totalCategories: 0, totalSubCategories: 0, totalLocations: 0, totalBranches: 0, totalActiveEmployees: 0,
})

const statsRow1 = computed(() => [
  { key: 'assets', label: t('pages.dashboard.assets'), icon: 'i-lucide-box', bgClass: 'bg-blue-50', iconClass: 'text-blue-600', value: summary.value.totalAssets },
  { key: 'categories', label: t('pages.dashboard.categories'), icon: 'i-lucide-list', bgClass: 'bg-violet-50', iconClass: 'text-violet-600', value: summary.value.totalCategories },
  { key: 'subCategories', label: t('pages.dashboard.subCategories'), icon: 'i-lucide-list-tree', bgClass: 'bg-amber-50', iconClass: 'text-amber-600', value: summary.value.totalSubCategories },
  { key: 'branches', label: t('pages.dashboard.branches'), icon: 'i-lucide-building-2', bgClass: 'bg-teal-50', iconClass: 'text-teal-600', value: summary.value.totalBranches },
  { key: 'locations', label: t('pages.dashboard.locations'), icon: 'i-lucide-map-pin', bgClass: 'bg-rose-50', iconClass: 'text-rose-600', value: summary.value.totalLocations },
  { key: 'employees', label: t('pages.dashboard.activeEmployees'), icon: 'i-lucide-users', bgClass: 'bg-indigo-50', iconClass: 'text-indigo-600', value: summary.value.totalActiveEmployees },
])

const statsRow2 = computed(() => [
  { key: 'price', label: t('pages.dashboard.totalPrice'), icon: 'i-lucide-banknote', bgClass: 'bg-emerald-50', iconClass: 'text-emerald-600', value: summary.value.totalPrice, format: (v: number) => `Rp ${v.toLocaleString('id-ID')}` },
  { key: 'bookValue', label: t('pages.dashboard.totalBookValue'), icon: 'i-lucide-wallet', bgClass: 'bg-cyan-50', iconClass: 'text-cyan-600', value: summary.value.totalBookValue, format: (v: number) => `Rp ${v.toLocaleString('id-ID')}` },
  { key: 'depreciation', label: t('pages.dashboard.depreciationValue'), icon: 'i-lucide-trending-down', bgClass: 'bg-red-50', iconClass: 'text-red-600', value: summary.value.totalDepreciation, format: (v: number) => `Rp ${v.toLocaleString('id-ID')}` },
])

// ── Chart data ───────────────────────────────────────
const categoryData = ref<ChartGroupItem[]>([])
const locationData = ref<ChartGroupItem[]>([])
const subCategoryData = ref<ChartGroupItem[]>([])
const agingData = ref<LabelCountItem[]>([])
const qualityData = ref<LabelCountItem[]>([])

// Category Donut
const categoryDonutValues = computed(() => categoryData.value.map(c => c.count))
const categoryDonutCategories = computed(() => {
  const result: Record<string, { name: string; color: string }> = {}
  categoryData.value.forEach((c, i) => {
    result[i.toString()] = { name: `${c.name}  ${c.count}`, color: chartColors[i % chartColors.length] ?? '#3b82f6' }
  })
  return result
})

// Category Bar
const categoryBarData = computed(() => categoryData.value.map(c => ({ name: c.name, totalPrice: c.totalPrice, totalBookValue: c.totalBookValue ?? c.totalPrice })))
const categoryBarCategories = computed(() => ({
  totalPrice: { name: t('pages.dashboard.originalPrice'), color: '#3b82f6' },
  totalBookValue: { name: t('pages.dashboard.bookValue'), color: '#10b981' },
}))

// Location Donut
const locationDonutValues = computed(() => locationData.value.map(l => l.count))
const locationDonutCategories = computed(() => {
  const result: Record<string, { name: string; color: string }> = {}
  locationData.value.forEach((l, i) => {
    result[i.toString()] = { name: `${l.name}  ${l.count}`, color: chartColors[i % chartColors.length] ?? '#3b82f6' }
  })
  return result
})

// Location Bar
const locationBarData = computed(() => locationData.value.map(l => ({ name: l.name, totalPrice: l.totalPrice, totalBookValue: l.totalBookValue ?? l.totalPrice })))
const locationBarCategories = computed(() => ({
  totalPrice: { name: t('pages.dashboard.originalPrice'), color: '#10b981' },
  totalBookValue: { name: t('pages.dashboard.bookValue'), color: '#f59e0b' },
}))

// Sub Category Donut
const subCategoryDonutValues = computed(() => subCategoryData.value.map(s => s.count))
const subCategoryDonutCategories = computed(() => {
  const result: Record<string, { name: string; color: string }> = {}
  subCategoryData.value.forEach((s, i) => {
    result[i.toString()] = { name: `${s.name}  ${s.count}`, color: chartColors[i % chartColors.length] ?? '#3b82f6' }
  })
  return result
})

// Aging Bar
const agingColors = ['#f59e0b', '#10b981', '#3b82f6']
const agingBarData = computed(() => agingData.value.map(a => ({ label: a.label, count: a.count })))
const agingBarCategories = computed(() => ({
  count: { name: t('pages.dashboard.assets'), color: '#f59e0b' },
}))

// Quality Bar
const qualityBarData = computed(() => qualityData.value.map(q => ({ label: q.label, count: q.count })))
const qualityBarCategories = computed(() => ({
  count: { name: t('pages.dashboard.assets'), color: '#ef4444' },
}))

// ── Fetch ────────────────────────────────────────────
const fetchSummary = async () => {
  isLoading.value = true
  try {
    const statuses = selectedStatuses.value.length ? selectedStatuses.value : undefined
    const res = await statisticService.getSummary(statuses)
    if (res.success) summary.value = res.data
  } finally {
    isLoading.value = false
  }
}

const fetchCharts = async () => {
  isChartLoading.value = true
  try {
    const statuses = selectedStatuses.value.length ? selectedStatuses.value : undefined
    const [catRes, locRes, subCatRes, agingRes, qualityRes] = await Promise.all([
      statisticService.getAssetsByCategory(statuses),
      statisticService.getAssetsByLocation(statuses),
      statisticService.getAssetsBySubCategory(statuses),
      statisticService.getAssetAging(statuses),
      statisticService.getDataQuality(statuses),
    ])
    if (catRes.success) categoryData.value = catRes.data
    if (locRes.success) locationData.value = locRes.data
    if (subCatRes.success) subCategoryData.value = subCatRes.data
    if (agingRes.success) agingData.value = agingRes.data
    if (qualityRes.success) qualityData.value = qualityRes.data
  } finally {
    isChartLoading.value = false
  }
}

const fetchAll = () => {
  fetchSummary()
  fetchCharts()
}

watch(selectedStatuses, () => {
  fetchAll()
})

onMounted(() => {
  fetchAll()
})
</script>