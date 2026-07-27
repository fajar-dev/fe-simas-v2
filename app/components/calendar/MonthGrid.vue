<template>
  <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
    <!-- Weekday header -->
    <div class="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
      <div
        v-for="key in weekdayKeys"
        :key="key"
        class="px-2 py-2 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 select-none"
      >
        {{ $t(`pages.calendar.weekdays.${key}`) }}
      </div>
    </div>

    <!-- Weeks -->
    <div class="grid grid-cols-7 grid-rows-6">
      <div
        v-for="cell in cells"
        :key="cell.iso"
        class="min-h-[92px] lg:min-h-[116px] border-b border-r border-neutral-100 dark:border-neutral-800 p-1.5 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-950/20"
        :class="[
          !cell.inMonth && 'bg-neutral-50/60 dark:bg-neutral-900/40',
          (cell.index % 7 === 6) && 'border-r-0'
        ]"
        @click="$emit('day-click', cell.iso)"
      >
        <div class="flex items-center justify-between">
          <span
            class="inline-flex items-center justify-center w-6 h-6 text-xs rounded-full"
            :class="[
              cell.isToday ? 'bg-primary text-white font-semibold' : cell.inMonth ? 'text-neutral-700 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-600'
            ]"
          >
            {{ cell.day }}
          </span>
        </div>

        <!-- Event chips -->
        <div class="flex flex-col gap-1 min-w-0">
          <button
            v-for="occ in cell.visible"
            :key="`${occ.id}-${occ.date}`"
            type="button"
            class="text-left w-full truncate rounded px-1.5 py-0.5 text-[11px] leading-tight bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-900/70 transition-colors flex items-center gap-1"
            @click.stop="$emit('event-click', occ)"
          >
            <UIcon
              v-if="occ.isRecurring"
              name="i-lucide-repeat"
              class="w-2.5 h-2.5 shrink-0 opacity-70"
            />
            <span v-if="occ.startTime" class="font-medium shrink-0">{{ occ.startTime }}</span>
            <span class="truncate">{{ occ.title }}</span>
          </button>

          <button
            v-if="cell.hidden > 0"
            type="button"
            class="text-left text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-primary px-1.5"
            @click.stop="$emit('day-click', cell.iso)"
          >
            {{ $t('pages.calendar.moreEvents', { count: cell.hidden }) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ScheduleOccurrence } from '~/types/asset-schedule'
import { monthGrid, toISODate } from '~/utils/calendar-date'

const props = defineProps<{
  monthDate: Date
  occurrences: ScheduleOccurrence[]
  maxPerDay?: number
}>()

defineEmits<{
  'day-click': [iso: string]
  'event-click': [occ: ScheduleOccurrence]
}>()

const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const byDate = computed(() => {
  const map = new Map<string, ScheduleOccurrence[]>()
  for (const occ of props.occurrences) {
    const arr = map.get(occ.date) || []
    arr.push(occ)
    map.set(occ.date, arr)
  }
  return map
})

const todayIso = toISODate(new Date())
const limit = computed(() => props.maxPerDay ?? 3)

const cells = computed(() => {
  const { cells: grid } = monthGrid(props.monthDate)
  const currentMonth = props.monthDate.getMonth()

  return grid.map((d, index) => {
    const iso = toISODate(d)
    const events = byDate.value.get(iso) || []
    return {
      iso,
      index,
      day: d.getDate(),
      inMonth: d.getMonth() === currentMonth,
      isToday: iso === todayIso,
      visible: events.slice(0, limit.value),
      hidden: Math.max(0, events.length - limit.value),
    }
  })
})
</script>
