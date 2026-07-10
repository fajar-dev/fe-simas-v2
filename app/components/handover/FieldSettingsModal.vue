<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.handover.fieldSettings.title')"
    :description="$t('pages.handover.fieldSettings.description')"
    :ui="{ content: 'sm:max-w-md', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <UTabs v-model="activeTab" :items="tabItems" class="w-full" />

      <div class="mt-4 space-y-3">
        <div
          v-for="(field, index) in currentFields"
          :key="index"
          class="rounded-lg border border-neutral-200 p-3 space-y-3"
        >
          <div class="flex items-start gap-2">
            <div class="space-y-2 flex-1 min-w-0">
              <UFormField :label="$t('pages.handover.fieldSettings.label')" :error="errors[activeTab][index]?.label">
                <UInput v-model="field.label" :placeholder="$t('pages.handover.fieldSettings.labelPlaceholder')" class="w-full" @update:model-value="() => clearError(index)" />
              </UFormField>
              <UFormField :label="$t('pages.handover.fieldSettings.type')">
                <USelect v-model="field.type" :items="typeOptions" class="w-full" @update:model-value="() => { onTypeChange(field); clearError(index) }" />
              </UFormField>
            </div>
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              square
              class="mt-6 shrink-0"
              @click="removeField(index)"
            />
          </div>

          <!-- Options editor for select / radio -->
          <div v-if="field.type === 'select' || field.type === 'radio'" class="pl-1 space-y-2">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{{ $t('pages.handover.fieldSettings.options') }}</span>
            <div v-for="(_, oi) in field.options" :key="oi" class="flex items-center gap-2">
              <UInput v-model="field.options[oi]" :placeholder="$t('pages.handover.fieldSettings.optionPlaceholder')" class="flex-1" @update:model-value="() => clearError(index)" />
              <UButton color="neutral" variant="ghost" icon="i-lucide-x" square size="sm" @click="() => { field.options.splice(oi, 1) }" />
            </div>
            <UButton color="neutral" variant="soft" icon="i-lucide-plus" size="xs" @click="() => { field.options.push('') }">
              {{ $t('pages.handover.fieldSettings.addOption') }}
            </UButton>
            <p v-if="errors[activeTab][index]?.options" class="text-xs text-error">{{ errors[activeTab][index]?.options }}</p>
          </div>

          <label class="flex items-center gap-2 cursor-pointer">
            <USwitch v-model="field.required" />
            <span class="text-sm text-neutral-700">{{ $t('pages.handover.fieldSettings.required') }}</span>
          </label>
        </div>

        <div v-if="currentFields.length === 0" class="text-center text-sm text-neutral-400 py-6 border-2 border-dashed border-neutral-200 rounded-lg">
          {{ $t('pages.handover.fieldSettings.empty') }}
        </div>

        <UButton color="primary" variant="soft" icon="i-lucide-plus" block @click="addField">
          {{ $t('pages.handover.fieldSettings.addField') }}
        </UButton>
      </div>
    </template>

    <template #footer>
      <UButton :label="$t('common.cancel')" color="neutral" variant="outline" :disabled="saving" @click="() => { open = false }" />
      <UButton :label="$t('common.save')" color="primary" :loading="saving" @click="save" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { handoverFieldService } from '~/services/handover-field-service'
import type { HandoverFieldType } from '~/types/handover-field'

const { t } = useI18n()
const toast = useToast()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [] }>()

interface FieldRow {
  label: string
  type: HandoverFieldType
  options: string[]
  required: boolean
}

const activeTab = ref<'assign' | 'return'>('assign')
const tabItems = computed(() => [
  { label: t('pages.handover.types.assign'), value: 'assign' },
  { label: t('pages.handover.types.return'), value: 'return' }
])
const typeOptions = [
  { label: t('pages.handover.fieldSettings.typeText'), value: 'text' },
  { label: t('pages.handover.fieldSettings.typeNumber'), value: 'number' },
  { label: t('pages.handover.fieldSettings.typeDate'), value: 'date' },
  { label: t('pages.handover.fieldSettings.typeDatetime'), value: 'datetime' },
  { label: t('pages.handover.fieldSettings.typeSelect'), value: 'select' },
  { label: t('pages.handover.fieldSettings.typeRadio'), value: 'radio' }
]

const forms = reactive<{ assign: FieldRow[]; return: FieldRow[] }>({ assign: [], return: [] })
const currentFields = computed(() => forms[activeTab.value])
const saving = ref(false)

// Per-row validation errors, keyed by row index within each tab.
const errors = reactive<Record<'assign' | 'return', Record<number, { label?: string, options?: string }>>>({ assign: {}, return: {} })
const clearError = (index: number) => {
  delete errors[activeTab.value][index]
}

const fieldSchema = z.object({
  label: z.string().trim().min(1, t('pages.handover.fieldSettings.labelRequired')),
  type: z.enum(['text', 'number', 'select', 'radio', 'date', 'datetime']),
  options: z.array(z.string()),
  required: z.boolean()
}).refine(
  f => !(f.type === 'select' || f.type === 'radio') || f.options.some(o => o.trim()),
  { message: t('pages.handover.fieldSettings.optionsRequired'), path: ['options'] }
)

/** Validate both tabs; returns the first tab with an error (or null). */
const validate = (): 'assign' | 'return' | null => {
  errors.assign = {}
  errors.return = {}
  let firstBad: 'assign' | 'return' | null = null
  for (const type of ['assign', 'return'] as const) {
    forms[type].forEach((field, i) => {
      const result = fieldSchema.safeParse(field)
      if (!result.success) {
        const rowError: { label?: string, options?: string } = {}
        for (const issue of result.error.issues) {
          if (issue.path[0] === 'label') rowError.label = issue.message
          if (issue.path[0] === 'options') rowError.options = issue.message
        }
        errors[type][i] = rowError
        if (!firstBad) firstBad = type
      }
    })
  }
  return firstBad
}

const fetchType = async (type: 'assign' | 'return') => {
  const res = await handoverFieldService.getByType(type)
  if (res.success && res.data) {
    forms[type] = res.data.map(f => ({
      label: f.label,
      type: f.type,
      options: [...(f.options || [])],
      required: f.required
    }))
  }
}

const addField = () => {
  forms[activeTab.value].push({ label: '', type: 'text', options: [], required: false })
}
const removeField = (index: number) => {
  forms[activeTab.value].splice(index, 1)
}
const onTypeChange = (field: FieldRow) => {
  if (field.type === 'select' || field.type === 'radio') {
    if (field.options.length === 0) field.options.push('')
  } else {
    field.options = []
  }
}

const save = async () => {
  const badTab = validate()
  if (badTab) {
    activeTab.value = badTab
    return
  }

  saving.value = true
  try {
    for (const type of ['assign', 'return'] as const) {
      const fields = forms[type]
        .map(f => ({
          label: f.label.trim(),
          type: f.type,
          options: (f.type === 'select' || f.type === 'radio') ? f.options.map(o => o.trim()).filter(Boolean) : null,
          required: f.required
        }))
      const res = await handoverFieldService.replace(type, fields)
      if (!res.success) {
        toast.add({ title: res.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
        return
      }
    }
    toast.add({ title: t('pages.handover.fieldSettings.saveSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
    emit('saved')
    open.value = false
  } finally {
    saving.value = false
  }
}

watch(open, (val) => {
  if (val) {
    activeTab.value = 'assign'
    errors.assign = {}
    errors.return = {}
    fetchType('assign')
    fetchType('return')
  }
})
</script>
