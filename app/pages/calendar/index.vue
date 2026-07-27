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

      <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 min-w-[180px]">
        {{ monthLabel }}
      </h2>

      <div class="flex-1" />

      <USelectMenu
        v-model="selectedAssetFilter"
        :items="assetFilterOptions"
        searchable
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

    <!-- Calendar -->
    <div class="relative">
      <div v-if="isLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-neutral-900/60 rounded-xl">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary" />
      </div>
      <CalendarMonthGrid
        :month-date="monthDate"
        :occurrences="occurrences"
        @day-click="onDayClick"
        @event-click="onEventClick"
      />
    </div>

    <!-- Modals -->
    <CalendarScheduleFormModal
      v-model="showForm"
      :schedule="editingSchedule"
      :default-date="defaultDate"
      @saved="fetchOccurrences"
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
import { monthGrid, toISODate } from '~/utils/calendar-date'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useI18n()
const { hasPermission } = useAuth()
const toast = useToast()

// Displayed month (anchored to the 1st).
const monthDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

const occurrences = ref<ScheduleOccurrence[]>([])
const isLoading = ref(false)

// Asset filter
type AssetFilterOption = { label: string; value: number | null }
const assetFilterOptions = ref<AssetFilterOption[]>([{ label: t('pages.calendar.allAssets'), value: null }])
const selectedAssetFilter = ref<AssetFilterOption>(assetFilterOptions.value[0]!)
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

const loadAssetFilter = async () => {
  isLoadingAssets.value = true
  try {
    const res = await assetService.getAll(1, 200)
    if (res.success && res.data) {
      assetFilterOptions.value = [
        { label: t('pages.calendar.allAssets'), value: null },
        ...res.data.map(a => ({ label: `${a.code} - ${a.name}`, value: a.id })),
      ]
    }
  } finally {
    isLoadingAssets.value = false
  }
}

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
      await fetchOccurrences()
    }
  } finally {
    isDeleting.value = false
  }
}

watch(monthDate, fetchOccurrences)
watch(selectedAssetFilter, fetchOccurrences)

onMounted(() => {
  loadAssetFilter()
  fetchOccurrences()
})
</script>
