<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.calendar.detail.title')"
    :description="$t('pages.calendar.detail.description')"
    :ui="{ content: 'sm:max-w-lg', overlay: 'bg-black/40', footer: 'justify-between' }"
  >
    <template #body>
      <div v-if="schedule" class="space-y-4">
        <!-- Title + recurrence -->
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ schedule.title }}</h3>
          <UBadge
            :color="schedule.recurrence === 'none' ? 'neutral' : 'primary'"
            variant="subtle"
            class="shrink-0"
          >
            <UIcon v-if="schedule.recurrence !== 'none'" name="i-lucide-repeat" class="w-3 h-3 mr-1" />
            {{ schedule.recurrence === 'none' ? $t('pages.calendar.detail.oneTime') : $t(`pages.calendar.recurrence.${schedule.recurrence}`) }}
          </UBadge>
        </div>

        <!-- Recurrence detail -->
        <p v-if="recurrenceText" class="text-xs text-neutral-500 -mt-2">{{ recurrenceText }}</p>

        <!-- Assets -->
        <div class="space-y-2">
          <p class="text-xs font-medium text-neutral-500">{{ $t('pages.calendar.form.assets') }} ({{ schedule.assets.length }})</p>
          <div class="space-y-2 max-h-44 overflow-y-auto">
            <div
              v-for="asset in schedule.assets"
              :key="asset.id"
              class="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 p-2.5"
            >
              <img v-if="asset.image" :src="asset.image" :alt="asset.name" class="w-9 h-9 rounded object-cover shrink-0">
              <div v-else class="w-9 h-9 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-box" class="w-4 h-4 text-neutral-400" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{{ asset.name }}</p>
                <p class="text-xs text-neutral-500">{{ asset.code }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Date & time -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-700 dark:text-neutral-300">
          <span class="inline-flex items-center gap-1.5">
            <UIcon name="i-lucide-calendar" class="w-4 h-4 text-neutral-400" />
            {{ dateLabel }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <UIcon name="i-lucide-clock" class="w-4 h-4 text-neutral-400" />
            {{ timeLabel }}
          </span>
        </div>

        <!-- Description -->
        <p v-if="schedule.description" class="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
          {{ schedule.description }}
        </p>

        <!-- Attachments -->
        <div>
          <p class="text-xs font-medium text-neutral-500 mb-1.5">{{ $t('pages.calendar.detail.attachments') }}</p>
          <div v-if="schedule.attachments.length === 0" class="text-sm text-neutral-400">
            {{ $t('pages.calendar.detail.noAttachments') }}
          </div>
          <ul v-else class="space-y-1.5">
            <li v-for="att in schedule.attachments" :key="att.id">
              <a :href="att.url" target="_blank" rel="noopener" class="flex items-center gap-2 text-sm text-primary hover:underline">
                <UIcon name="i-lucide-paperclip" class="w-4 h-4 shrink-0" />
                <span class="truncate">{{ att.originalName }}</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Created by -->
        <p v-if="schedule.createdBy" class="text-xs text-neutral-400">
          {{ $t('pages.calendar.detail.createdBy') }}: {{ schedule.createdBy.name }}
        </p>
      </div>
    </template>

    <template #footer>
      <UButton
        v-if="canDelete"
        :label="$t('common.delete')"
        color="error"
        variant="ghost"
        icon="i-lucide-trash-2"
        @click="$emit('delete', schedule!)"
      />
      <div class="flex items-center gap-2 ml-auto">
        <UButton :label="$t('common.close')" color="neutral" variant="outline" @click="() => { open = false }" />
        <UButton
          v-if="canEdit"
          :label="$t('common.edit')"
          color="primary"
          icon="i-lucide-pencil"
          @click="$emit('edit', schedule!)"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { AssetSchedule, ScheduleOccurrence } from '~/types/asset-schedule'
import { fromISODate } from '~/utils/calendar-date'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  schedule?: (AssetSchedule & { date?: string }) | ScheduleOccurrence | null
  canEdit?: boolean
  canDelete?: boolean
}>()

defineEmits<{
  edit: [schedule: AssetSchedule]
  delete: [schedule: AssetSchedule]
}>()

const { t, locale } = useI18n()

const isId = computed(() => locale.value === 'id')
const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const dateLabel = computed(() => {
  const s = props.schedule
  if (!s) return ''
  const iso = (s as ScheduleOccurrence).date || s.startDate
  return fromISODate(iso).toLocaleDateString(isId.value ? 'id-ID' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

const timeLabel = computed(() => {
  const s = props.schedule
  if (!s) return ''
  if (!s.startTime) return t('pages.calendar.detail.allDay')
  return s.endTime ? `${s.startTime} - ${s.endTime}` : s.startTime
})

// Human-readable recurrence specifics ("Every Mon, Wed" / "Day 15 of each month" / "Every 10 Aug").
const recurrenceText = computed(() => {
  const s = props.schedule
  if (!s || s.recurrence === 'none') return ''
  if (s.recurrence === 'weekly') {
    const days = (s.daysOfWeek || []).map(d => t(`pages.calendar.weekdays.${weekdayKeys[d]}`)).join(', ')
    return days ? t('pages.calendar.detail.everyWeekdays', { days }) : ''
  }
  if (s.recurrence === 'monthly') {
    return s.dayOfMonth ? t('pages.calendar.detail.everyDayOfMonth', { day: s.dayOfMonth }) : ''
  }
  if (s.recurrence === 'yearly' && s.month && s.dayOfMonth) {
    const monthName = t(`pages.calendar.months.${monthKeys[s.month - 1]}`)
    return t('pages.calendar.detail.everyYearOn', { day: s.dayOfMonth, month: monthName })
  }
  return ''
})
</script>
