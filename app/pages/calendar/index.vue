<template>
  <div class="space-y-6">
    <Header :title="$t('pages.calendar.title')" :description="$t('pages.calendar.description')" />

    <!-- Toolbar -->
    <div class="flex flex-col lg:flex-row lg:items-center gap-3">
      <div class="flex items-center gap-1">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="outline" square @click="shiftMonth(-1)" />
        <UButton :label="$t('pages.calendar.today')" color="neutral" variant="outline" @click="goToday" />
        <UButton icon="i-lucide-chevron-right" color="neutral" variant="outline" square @click="shiftMonth(1)" />
      </div>

      <h2 class="text-lg font-semibold text-highlighted min-w-[180px]">
        {{ monthLabel }}
      </h2>

      <div class="flex-1" />

      <USelectMenu
        v-model="selectedAssetFilter"
        v-model:search-term="assetSearchTerm"
        :items="assetFilterOptions"
        searchable
        ignore-filter
        :searchable-placeholder="$t('common.search')"
        :loading="isLoadingAssets"
        class="w-full lg:w-56"
      />

      <UButton
        v-if="hasPermission('asset-schedule:create')"
        color="primary"
        icon="i-lucide-plus"
        class="w-full lg:w-auto justify-center"
        @click="openCreate()"
      >
        {{ $t('pages.calendar.addSchedule') }}
      </UButton>
    </div>

    <!-- Calendar + today's schedule -->
    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <div class="relative flex-1 min-w-0 w-full">
        <div v-if="isLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-default/60 rounded-lg">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary" />
        </div>
        <CalendarMonthGrid
          :month-date="monthDate"
          :occurrences="occurrences"
          @day-click="onDayClick"
          @event-click="onEventClick"
        />
      </div>

      <div class="w-full lg:w-80 shrink-0 rounded-lg border border-default bg-default overflow-hidden">
        <div class="px-4 py-3 border-b border-default">
          <h3 class="text-sm font-semibold text-highlighted">{{ $t('pages.calendar.todayScheduleTitle') }}</h3>
          <p class="text-xs text-muted">{{ todayLabel }}</p>
        </div>

        <div v-if="isLoadingToday" class="p-4 flex justify-center">
          <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary" />
        </div>
        <p v-else-if="todayOccurrences.length === 0" class="p-4 text-sm text-dimmed text-center">
          {{ $t('pages.calendar.todayScheduleEmpty') }}
        </p>
        <ul v-else class="divide-y divide-muted max-h-[560px] overflow-y-auto">
          <li v-for="occ in todayOccurrences" :key="occ.id">
            <button
              type="button"
              class="w-full text-left px-4 py-3 hover:bg-muted transition-colors"
              @click="onEventClick(occ)"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-medium text-highlighted truncate">{{ occ.title }}</p>
                <UIcon v-if="occ.isRecurring" name="i-lucide-repeat" class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              </div>
              <p class="text-xs text-muted truncate mt-0.5">{{ assetsSummary(occ) }}</p>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Modals -->
    <CalendarScheduleFormModal
      v-model="showForm"
      :schedule="editingSchedule"
      :default-date="defaultDate"
      @saved="refreshAll"
    />
    <CalendarScheduleDetailModal
      v-model="showDetail"
      :schedule="selectedSchedule"
      :can-edit="hasPermission('asset-schedule:update')"
      :can-delete="hasPermission('asset-schedule:delete')"
      @edit="onEdit"
      @delete="onDelete"
    />
    <DeleteModal
      v-model="showDelete"
      :title="$t('pages.calendar.delete.title')"
      :item-name="scheduleToDelete?.title"
      :loading="isDeleting"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { assetScheduleService } from '~/services/asset-schedule-service'
import { assetService } from '~/services/asset-service'
import type { AssetSchedule, ScheduleOccurrence } from '~/types/asset-schedule'
import { monthGrid, toISODate, fromISODate } from '~/utils/calendar-date'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useI18n()
const { hasPermission } = useAuth()
const toast = useToast()

// Displayed month (anchored to the 1st).
const monthDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

const occurrences = ref<ScheduleOccurrence[]>([])
const isLoading = ref(false)

// Today's schedule sidebar — fetched independently of the displayed month so it always
// reflects the real "today", regardless of which month the calendar grid is showing.
const todayIso = toISODate(new Date())
const todayOccurrences = ref<ScheduleOccurrence[]>([])
const isLoadingToday = ref(false)
const todayLabel = computed(() =>
  fromISODate(todayIso).toLocaleDateString(locale.value === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)
const assetsSummary = (occ: ScheduleOccurrence) => occ.assets.map(a => a.name).join(', ')

// Asset filter — search-as-you-type against /asset/options (not the full paginated list).
type AssetFilterOption = { label: string; value: number | null }
const allAssetsOption = computed<AssetFilterOption>(() => ({ label: t('pages.calendar.allAssets'), value: null }))
const assetFilterOptions = ref<AssetFilterOption[]>([allAssetsOption.value])
const selectedAssetFilter = ref<AssetFilterOption>(assetFilterOptions.value[0]!)
const assetSearchTerm = ref('')
const isLoadingAssets = ref(false)

// Modal state
const showForm = ref(false)
const showDetail = ref(false)
const showDelete = ref(false)
const editingSchedule = ref<AssetSchedule | null>(null)
const selectedSchedule = ref<(AssetSchedule & { date?: string }) | null>(null)
const scheduleToDelete = ref<AssetSchedule | null>(null)
const defaultDate = ref<string | null>(null)
const isDeleting = ref(false)

const monthLabel = computed(() =>
  monthDate.value.toLocaleDateString(locale.value === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' })
)

const fetchOccurrences = async () => {
  isLoading.value = true
  try {
    const { start, end } = monthGrid(monthDate.value)
    const assetId = selectedAssetFilter.value?.value ?? undefined
    const res = await assetScheduleService.getCalendar(toISODate(start), toISODate(end), assetId ? { assetId } : {})
    if (res.success && res.data) {
      occurrences.value = res.data
    }
  } finally {
    isLoading.value = false
  }
}

const fetchTodayOccurrences = async () => {
  isLoadingToday.value = true
  try {
    const assetId = selectedAssetFilter.value?.value ?? undefined
    const res = await assetScheduleService.getCalendar(todayIso, todayIso, assetId ? { assetId } : {})
    if (res.success && res.data) {
      todayOccurrences.value = res.data
    }
  } finally {
    isLoadingToday.value = false
  }
}

const refreshAll = () => Promise.all([fetchOccurrences(), fetchTodayOccurrences()])

const searchAssetFilter = async (q = '') => {
  isLoadingAssets.value = true
  try {
    const res = await assetService.searchOptions(q, 20)
    if (res.success && res.data) {
      const results = res.data.map(a => ({ label: `${a.code} - ${a.name}`, value: a.id as number | null }))
      // Keep the currently selected asset visible even if it falls outside the new search results.
      const current = selectedAssetFilter.value
      const pinned = current.value !== null && !results.some(r => r.value === current.value) ? [current] : []
      assetFilterOptions.value = [allAssetsOption.value, ...pinned, ...results]
    }
  } finally {
    isLoadingAssets.value = false
  }
}

let assetSearchTimeout: ReturnType<typeof setTimeout>
watch(assetSearchTerm, (term) => {
  clearTimeout(assetSearchTimeout)
  assetSearchTimeout = setTimeout(() => { searchAssetFilter(term) }, 300)
})

// Navigation
const shiftMonth = (delta: number) => {
  monthDate.value = new Date(monthDate.value.getFullYear(), monthDate.value.getMonth() + delta, 1)
}
const goToday = () => {
  const now = new Date()
  monthDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
}

// Interactions
const openCreate = (iso?: string) => {
  editingSchedule.value = null
  defaultDate.value = iso ?? null
  showForm.value = true
}
const onDayClick = (iso: string) => {
  if (!hasPermission('asset-schedule:create')) return
  openCreate(iso)
}
const onEventClick = async (occ: ScheduleOccurrence) => {
  // Occurrences omit attachments — fetch the full record for the detail view.
  const res = await assetScheduleService.getById(occ.id)
  if (res.success && res.data) {
    selectedSchedule.value = { ...res.data, date: occ.date }
    showDetail.value = true
  }
}
const onEdit = (schedule: AssetSchedule) => {
  showDetail.value = false
  editingSchedule.value = schedule
  defaultDate.value = null
  showForm.value = true
}
const onDelete = (schedule: AssetSchedule) => {
  showDetail.value = false
  scheduleToDelete.value = schedule
  showDelete.value = true
}
const handleDelete = async () => {
  if (!scheduleToDelete.value) return
  isDeleting.value = true
  try {
    const res = await assetScheduleService.delete(scheduleToDelete.value.id)
    if (res.success) {
      toast.add({ title: t('pages.calendar.delete.success'), color: 'success', icon: 'i-lucide-circle-check' })
      showDelete.value = false
      scheduleToDelete.value = null
      await refreshAll()
    }
  } finally {
    isDeleting.value = false
  }
}

watch(monthDate, fetchOccurrences)
watch(selectedAssetFilter, refreshAll)

onMounted(() => {
  searchAssetFilter()
  refreshAll()
})
</script>
