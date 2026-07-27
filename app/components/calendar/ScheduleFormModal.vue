<template>
  <UModal
    v-model:open="open"
    :title="isEdit ? $t('pages.calendar.form.editTitle') : $t('pages.calendar.form.addTitle')"
    :description="isEdit ? $t('pages.calendar.form.editDescription') : $t('pages.calendar.form.addDescription')"
    :ui="{ content: 'sm:max-w-lg', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <UForm id="schedule-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-4">
        <!-- Assets (multiple) -->
        <UFormField :label="$t('pages.calendar.form.assets')" name="assetIds" required>
          <USelectMenu
            v-model="selectedAssets"
            v-model:search-term="assetSearchTerm"
            :items="assetOptions"
            multiple
            searchable
            ignore-filter
            :searchable-placeholder="$t('common.search')"
            :placeholder="$t('pages.calendar.form.selectAssets')"
            :loading="isLoadingAssets"
            class="w-full"
          />
        </UFormField>

        <!-- Title -->
        <UFormField :label="$t('pages.calendar.form.titleLabel')" name="title" required>
          <UInput v-model="form.title" :placeholder="$t('pages.calendar.form.titlePlaceholder')" class="w-full" />
        </UFormField>

        <!-- Description -->
        <UFormField :label="$t('common.description')" name="description">
          <UTextarea v-model="form.description" :placeholder="$t('pages.calendar.form.descriptionPlaceholder')" class="w-full" :rows="3" />
        </UFormField>

        <!-- Start date -->
        <UFormField :label="$t('pages.calendar.form.startDate')" name="startDate" required>
          <UInputDate v-model="startDateVal" class="w-full">
            <template #trailing>
              <UPopover>
                <UButton icon="i-lucide-calendar" color="neutral" variant="ghost" size="sm" square />
                <template #content>
                  <UCalendar v-model="startDateVal" />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>

        <!-- Attachments -->
        <AttachmentManager v-model="uploadedAttachments" @change="onAttachmentsChanged" />

        <!-- Recurrence (below attachments) -->
        <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-3">
          <UFormField :label="$t('pages.calendar.recurrence.label')" name="recurrence">
            <USelectMenu v-model="selectedRecurrence" :items="recurrenceOptions" class="w-full" />
          </UFormField>

          <!-- weekly: weekday toggles -->
          <UFormField v-if="form.recurrence === 'weekly'" :label="$t('pages.calendar.form.repeatOn')" name="daysOfWeek">
            <div class="flex flex-wrap gap-1.5">
              <UButton
                v-for="d in weekdayButtons"
                :key="d.value"
                :color="form.daysOfWeek?.includes(d.value) ? 'primary' : 'neutral'"
                :variant="form.daysOfWeek?.includes(d.value) ? 'solid' : 'outline'"
                size="sm"
                class="w-10 justify-center"
                @click="toggleWeekday(d.value)"
              >
                {{ d.label }}
              </UButton>
            </div>
          </UFormField>

          <!-- monthly: day-of-month -->
          <UFormField v-if="form.recurrence === 'monthly'" :label="$t('pages.calendar.form.dayOfMonth')" name="dayOfMonth">
            <USelectMenu v-model="selectedDayOfMonth" :items="dayOptions" class="w-full sm:w-40" />
          </UFormField>

          <!-- yearly: month + day-of-month -->
          <div v-if="form.recurrence === 'yearly'" class="grid grid-cols-2 gap-3">
            <UFormField :label="$t('pages.calendar.form.month')" name="month">
              <USelectMenu v-model="selectedMonth" :items="monthOptions" class="w-full" />
            </UFormField>
            <UFormField :label="$t('pages.calendar.form.dayOfMonth')" name="dayOfMonth">
              <USelectMenu v-model="selectedDayOfMonth" :items="dayOptions" class="w-full" />
            </UFormField>
          </div>

          <!-- repeat until -->
          <UFormField
            v-if="form.recurrence !== 'none'"
            :label="$t('pages.calendar.form.recurrenceEndDate')"
            name="recurrenceEndDate"
            :help="$t('pages.calendar.form.recurrenceEndHint')"
          >
            <UInputDate v-model="recurrenceEndVal" class="w-full">
              <template #trailing>
                <UPopover>
                  <UButton icon="i-lucide-calendar" color="neutral" variant="ghost" size="sm" square />
                  <template #content>
                    <UCalendar v-model="recurrenceEndVal" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton :label="$t('common.cancel')" color="neutral" variant="outline" @click="() => { open = false }" />
        <UButton :label="$t('common.save')" type="submit" form="schedule-form" color="primary" :loading="isSubmitting" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { parseDate } from '@internationalized/date'
import { assetScheduleService } from '~/services/asset-schedule-service'
import { assetService } from '~/services/asset-service'
import type { AssetSchedule, AssetSchedulePayload, ScheduleRecurrence } from '~/types/asset-schedule'
import type { Attachment } from '~/types/attachment'

const { t } = useI18n()
const toast = useToast()

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  schedule?: AssetSchedule | null
  defaultDate?: string | null
}>()

const emit = defineEmits<{ saved: [] }>()

const isEdit = computed(() => !!props.schedule)

// State
const isSubmitting = ref(false)
const isLoadingAssets = ref(false)
const assetOptions = ref<{ label: string; value: number }[]>([])
const selectedAssets = ref<{ label: string; value: number }[]>([])
const assetSearchTerm = ref('')
const uploadedAttachments = ref<Attachment[]>([])

type RecOption = { label: string; value: ScheduleRecurrence }
const recurrenceOptions = computed<RecOption[]>(() => [
  { label: t('pages.calendar.recurrence.none'), value: 'none' },
  { label: t('pages.calendar.recurrence.weekly'), value: 'weekly' },
  { label: t('pages.calendar.recurrence.monthly'), value: 'monthly' },
  { label: t('pages.calendar.recurrence.yearly'), value: 'yearly' },
])
const selectedRecurrence = ref<RecOption>(recurrenceOptions.value[0]!)

const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const weekdayButtons = computed(() => weekdayKeys.map((k, i) => ({ value: i, label: t(`pages.calendar.weekdays.${k}`) })))

const dayOptions = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))
const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const monthOptions = computed(() => monthKeys.map((k, i) => ({ label: t(`pages.calendar.months.${k}`), value: i + 1 })))

const selectedDayOfMonth = ref<{ label: string; value: number }>(dayOptions[0]!)
const selectedMonth = ref<{ label: string; value: number }>(monthOptions.value[0]!)

const schema = z.object({
  assetIds: z.array(z.number()).min(1, t('pages.calendar.form.assetRequired')),
  title: z.string().min(1, t('pages.calendar.form.titleRequired')),
  startDate: z.string().min(1, t('pages.calendar.form.startDateRequired')),
})

const form = reactive<AssetSchedulePayload>({
  assetIds: [],
  title: '',
  description: '',
  startDate: '',
  recurrence: 'none',
  daysOfWeek: [],
  dayOfMonth: null,
  month: null,
  recurrenceEndDate: null,
  attachmentIds: [],
})

// Date <-> CalendarDate bridges
const toCalendar = (val: string | null | undefined) => {
  if (!val) return undefined
  try { return parseDate(val) } catch { return undefined }
}
const startDateVal = computed({
  get: () => toCalendar(form.startDate),
  set: (val) => { form.startDate = val ? val.toString() : '' },
})
const recurrenceEndVal = computed({
  get: () => toCalendar(form.recurrenceEndDate),
  set: (val) => { form.recurrenceEndDate = val ? val.toString() : null },
})

const toggleWeekday = (day: number) => {
  const set = new Set(form.daysOfWeek ?? [])
  if (set.has(day)) set.delete(day)
  else set.add(day)
  form.daysOfWeek = Array.from(set).sort((a, b) => a - b)
}

watch(selectedAssets, (val) => { form.assetIds = (val || []).map(a => a.value) })
watch(selectedRecurrence, (val) => { form.recurrence = val.value })
watch(selectedDayOfMonth, (val) => { if (val) form.dayOfMonth = val.value })
watch(selectedMonth, (val) => { if (val) form.month = val.value })

const onAttachmentsChanged = (ids: number[]) => { form.attachmentIds = ids }

const toAssetOption = (a: { id: number; code: string; name: string }) => ({ label: `${a.code} - ${a.name}`, value: a.id })

// Asset select is search-as-you-type against the lightweight /asset/options endpoint
// (not the full paginated list, which doesn't scale to very large asset tables).
const searchAssets = async (q = '') => {
  isLoadingAssets.value = true
  try {
    const res = await assetService.searchOptions(q, 20)
    if (res.success && res.data) {
      const results = res.data.map(toAssetOption)
      // Keep already-selected assets visible even if the current search no longer returns them.
      const pinned = selectedAssets.value.filter(a => !results.some(r => r.value === a.value))
      assetOptions.value = [...pinned, ...results]
    }
  } finally {
    isLoadingAssets.value = false
  }
}

let assetSearchTimeout: ReturnType<typeof setTimeout>
watch(assetSearchTerm, (term) => {
  clearTimeout(assetSearchTimeout)
  assetSearchTimeout = setTimeout(() => { searchAssets(term) }, 300)
})

const resetForm = () => {
  form.assetIds = []
  form.title = ''
  form.description = ''
  form.startDate = props.defaultDate || new Date().toISOString().split('T')[0] || ''
  form.recurrence = 'none'
  form.daysOfWeek = []
  form.dayOfMonth = null
  form.month = null
  form.recurrenceEndDate = null
  form.attachmentIds = []
  selectedAssets.value = []
  assetSearchTerm.value = ''
  selectedRecurrence.value = recurrenceOptions.value[0]!
  selectedDayOfMonth.value = dayOptions[0]!
  selectedMonth.value = monthOptions.value[0]!
  uploadedAttachments.value = []
}

const hydrateFromSchedule = (s: AssetSchedule) => {
  form.assetIds = s.assets.map(a => a.id)
  form.title = s.title
  form.description = s.description || ''
  form.startDate = s.startDate
  form.recurrence = s.recurrence
  form.daysOfWeek = s.daysOfWeek ? [...s.daysOfWeek] : []
  form.dayOfMonth = s.dayOfMonth
  form.month = s.month
  form.recurrenceEndDate = s.recurrenceEndDate
  form.attachmentIds = s.attachments.map(a => a.id)
  selectedAssets.value = s.assets.map(toAssetOption)
  assetOptions.value = [...selectedAssets.value]
  selectedRecurrence.value = recurrenceOptions.value.find(o => o.value === s.recurrence) || recurrenceOptions.value[0]!
  selectedDayOfMonth.value = dayOptions.find(o => o.value === s.dayOfMonth) || dayOptions[0]!
  selectedMonth.value = monthOptions.value.find(o => o.value === s.month) || monthOptions.value[0]!
  uploadedAttachments.value = [...s.attachments]
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const r = form.recurrence
    const payload: AssetSchedulePayload = {
      assetIds: form.assetIds,
      title: form.title,
      description: form.description || null,
      startDate: form.startDate,
      recurrence: r,
      daysOfWeek: r === 'weekly' ? (form.daysOfWeek || []) : null,
      dayOfMonth: r === 'monthly' || r === 'yearly' ? form.dayOfMonth : null,
      month: r === 'yearly' ? form.month : null,
      recurrenceEndDate: r === 'none' ? null : (form.recurrenceEndDate || null),
      attachmentIds: form.attachmentIds || [],
    }

    const res = props.schedule
      ? await assetScheduleService.update(props.schedule.id, payload)
      : await assetScheduleService.create(payload)

    if (res.success) {
      toast.add({
        title: props.schedule ? t('pages.calendar.form.updateSuccess') : t('pages.calendar.form.createSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check',
      })
      emit('saved')
      open.value = false
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (val) => {
  if (!val) return
  if (props.schedule) hydrateFromSchedule(props.schedule)
  else resetForm()
  searchAssets()
})
</script>
