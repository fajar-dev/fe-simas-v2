<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <Header
      title="Dashboard"
      description="Overview of your asset management system"
    />

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.key"
        class="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:border-neutral-300 hover:-translate-y-0.5"
      >
        <!-- Icon -->
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
          :class="stat.bgClass"
        >
          <UIcon :name="stat.icon" class="w-5 h-5" :class="stat.iconClass" />
        </div>

        <!-- Label -->
        <p class="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">{{ stat.label }}</p>

        <!-- Value -->
        <p v-if="!isLoading" class="text-xl font-bold text-neutral-900 tabular-nums">
          {{ stat.format ? stat.format(stat.value) : stat.value.toLocaleString('id-ID') }}
        </p>
        <div v-else class="h-7 w-24 bg-neutral-100 rounded-md animate-pulse" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { statisticService } from '~/services/statistic-service'
import type { StatisticSummary } from '~/services/statistic-service'

definePageMeta({
  layout: 'dashboard'
})

const isLoading = ref(true)
const summary = ref<StatisticSummary>({
  totalAssets: 0,
  totalPrice: 0,
  totalCategories: 0,
  totalSubCategories: 0,
  totalLocations: 0,
  totalBranches: 0,
})

const stats = computed(() => [
  {
    key: 'assets',
    label: 'Assets',
    icon: 'i-lucide-box',
    bgClass: 'bg-blue-50',
    iconClass: 'text-blue-600',
    value: summary.value.totalAssets,
  },
  {
    key: 'price',
    label: 'Total Value',
    icon: 'i-lucide-banknote',
    bgClass: 'bg-emerald-50',
    iconClass: 'text-emerald-600',
    value: summary.value.totalPrice,
    format: (v: number) => `Rp ${v.toLocaleString('id-ID')}`,
  },
  {
    key: 'categories',
    label: 'Categories',
    icon: 'i-lucide-layers',
    bgClass: 'bg-violet-50',
    iconClass: 'text-violet-600',
    value: summary.value.totalCategories,
  },
  {
    key: 'subCategories',
    label: 'Sub Categories',
    icon: 'i-lucide-list-tree',
    bgClass: 'bg-amber-50',
    iconClass: 'text-amber-600',
    value: summary.value.totalSubCategories,
  },
  {
    key: 'locations',
    label: 'Locations',
    icon: 'i-lucide-map-pin',
    bgClass: 'bg-rose-50',
    iconClass: 'text-rose-600',
    value: summary.value.totalLocations,
  },
])

const fetchSummary = async () => {
  isLoading.value = true
  try {
    const res = await statisticService.getSummary()
    if (res.success) {
      summary.value = res.data
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchSummary()
})
</script>