<template>
  <AssetDetailWrapper>
    <div class="space-y-4">
      <DataTable
        v-model:search="search"
        v-model:page="page"
        v-model:perPage="perPage"
        :data="data"
        :columns="columns"
        :loading="isLoadingSchedules"
        :from="meta.from"
        :to="meta.to"
        :total="meta.total"
        table-class="min-w-[700px]"
      >
        <template #actions>
          <UButton
            v-if="hasPermission('asset-schedule:create')"
            class="w-full lg:w-auto justify-center"
            color="primary"
            variant="solid"
            icon="i-lucide-plus"
            @click="() => { editingSchedule = null; showFormModal = true }"
          >
            {{ $t('pages.calendar.addSchedule') }}
          </UButton>
        </template>
      </DataTable>

      <!-- Add/Edit Modal -->
      <CalendarScheduleFormModal
        v-model="showFormModal"
        :schedule="editingSchedule"
        :default-asset-id="assetId"
        @saved="fetchSchedules"
      />

      <!-- Delete Modal -->
      <DeleteModal
        v-model="showDeleteModal"
        :title="$t('pages.calendar.delete.title')"
        :item-name="scheduleToDelete?.title"
        :loading="isDeleting"
        @confirm="handleDelete"
      />
    </div>
  </AssetDetailWrapper>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { assetScheduleService } from '~/services/asset-schedule-service'
import type { AssetSchedule } from '~/types/asset-schedule'

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const assetId = Number(route.params.id)
const { hasPermission } = useAuth()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')

// State
const data = ref<AssetSchedule[]>([])
const isLoadingSchedules = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchSchedules(), { defaultSortBy: 'startDate', defaultOrder: 'DESC' })

const editingSchedule = ref<AssetSchedule | null>(null)
const scheduleToDelete = ref<AssetSchedule | null>(null)
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)

// Pagination meta
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

// Fetch schedules that include this asset
const fetchSchedules = async () => {
  isLoadingSchedules.value = true
  try {
    const response = await assetScheduleService.getAll(
      page.value,
      perPage.value,
      search.value,
      sortBy.value,
      order.value,
      { assetId }
    )
    if (response.success && response.data) {
      data.value = response.data
      if (response.meta) {
        meta.total = response.meta.total
        meta.from = response.meta.from
        meta.to = response.meta.to
      }
    }
  } finally {
    isLoadingSchedules.value = false
  }
}

// Human-readable recurrence subtitle, e.g. "Every Mon, Wed" / "Day 15 of every month" / "Every 10 Aug".
const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const recurrenceSubtitle = (schedule: AssetSchedule): string => {
  if (schedule.recurrence === 'weekly') {
    const days = (schedule.daysOfWeek || []).map(d => t(`pages.calendar.weekdays.${weekdayKeys[d]}`)).join(', ')
    return days ? t('pages.calendar.detail.everyWeekdays', { days }) : ''
  }
  if (schedule.recurrence === 'monthly') {
    return schedule.dayOfMonth ? t('pages.calendar.detail.everyDayOfMonth', { day: schedule.dayOfMonth }) : ''
  }
  if (schedule.recurrence === 'yearly' && schedule.month && schedule.dayOfMonth) {
    return t('pages.calendar.detail.everyYearOn', { day: schedule.dayOfMonth, month: t(`pages.calendar.months.${monthKeys[schedule.month - 1]}`) })
  }
  return ''
}

// Table columns
const columns = computed(() => {
  const list: TableColumn<AssetSchedule>[] = [
    {
      accessorKey: 'title',
      header: sortHeader(t('pages.calendar.form.titleLabel'), 'title'),
      cell: ({ row }) => h('span', { class: 'text-neutral-900 font-medium' }, row.original.title)
    },
    {
      accessorKey: 'startDate',
      header: sortHeader(t('pages.calendar.form.startDate'), 'startDate'),
      cell: ({ row }) => h('span', { class: 'text-neutral-700' }, row.original.startDate)
    },
    {
      accessorKey: 'recurrence',
      header: sortHeader(t('pages.calendar.recurrence.label'), 'recurrence'),
      cell: ({ row }) => {
        const schedule = row.original
        const subtitle = recurrenceSubtitle(schedule)
        return h('div', { class: 'flex flex-col gap-0.5' }, [
          h(UBadge, {
            color: schedule.recurrence === 'none' ? 'neutral' : 'primary',
            variant: 'subtle',
            class: 'w-fit'
          }, () => [
            schedule.recurrence !== 'none' ? h(UIcon, { name: 'i-lucide-repeat', class: 'w-3 h-3 mr-1' }) : null,
            schedule.recurrence === 'none' ? t('pages.calendar.detail.oneTime') : t(`pages.calendar.recurrence.${schedule.recurrence}`)
          ]),
          subtitle ? h('span', { class: 'text-xs text-neutral-500' }, subtitle) : null
        ])
      }
    },
    {
      id: 'assets',
      header: t('pages.asset.schedule.columnAssets'),
      cell: ({ row }) => {
        const assets = row.original.assets || []
        const others = assets.filter(a => a.id !== assetId)
        if (others.length === 0) return h('span', { class: 'text-neutral-400 text-xs' }, '-')
        return h('span', { class: 'text-xs text-neutral-500' }, `+${others.length}`)
      }
    }
  ]

  if (hasPermission('asset-schedule:update', 'asset-schedule:delete')) {
    list.push({
      id: 'actions',
      header: t('pages.asset.schedule.columnAction'),
      meta: {
        class: {
          td: 'text-right',
          th: 'text-right'
        }
      },
      cell: ({ row }) => {
        return h(
          UDropdownMenu,
          {
            content: { align: 'end' },
            items: getRowItems(row),
            'aria-label': 'Actions dropdown'
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              'aria-label': 'Actions dropdown'
            })
        )
      }
    })
  }

  return list
})

function getRowItems(row: Row<AssetSchedule>) {
  const actions = []
  if (hasPermission('asset-schedule:update')) {
    actions.push({
      label: t('pages.asset.schedule.editRecord'),
      icon: 'i-lucide-edit',
      onSelect() {
        editingSchedule.value = row.original
        showFormModal.value = true
      }
    })
  }
  if (hasPermission('asset-schedule:delete')) {
    actions.push({
      label: t('pages.asset.schedule.deleteRecord'),
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        scheduleToDelete.value = row.original
        showDeleteModal.value = true
      }
    })
  }
  return actions
}

const toast = useToast()
const handleDelete = async () => {
  if (!scheduleToDelete.value) return
  isDeleting.value = true
  try {
    const response = await assetScheduleService.delete(scheduleToDelete.value.id)
    if (response.success) {
      toast.add({
        title: t('pages.calendar.delete.success'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchSchedules()
  } finally {
    isDeleting.value = false
  }
}
</script>
