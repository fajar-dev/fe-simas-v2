<template>
  <div v-if="fields.length" class="space-y-4">
    <UFormField
      v-for="field in fields"
      :key="field.id"
      :label="field.label"
      :required="field.required"
    >
      <UInput
        v-if="field.type === 'text'"
        :model-value="(model[field.key] as string) ?? ''"
        class="w-full"
        @update:model-value="(v: string | number) => set(field.key, String(v))"
      />
      <UInput
        v-else-if="field.type === 'number'"
        type="number"
        :model-value="(model[field.key] as string) ?? ''"
        class="w-full"
        @update:model-value="(v: string | number) => set(field.key, String(v))"
      />
      <UInput
        v-else-if="field.type === 'date'"
        type="date"
        :model-value="(model[field.key] as string) ?? ''"
        class="w-full"
        @update:model-value="(v: string | number) => set(field.key, String(v))"
      />
      <UInput
        v-else-if="field.type === 'datetime'"
        type="datetime-local"
        :model-value="(model[field.key] as string) ?? ''"
        class="w-full"
        @update:model-value="(v: string | number) => set(field.key, String(v))"
      />
      <USelect
        v-else-if="field.type === 'select'"
        :model-value="(model[field.key] as string) ?? ''"
        :items="field.options || []"
        class="w-full"
        @update:model-value="(v: string) => set(field.key, v)"
      />
      <URadioGroup
        v-else-if="field.type === 'radio'"
        :model-value="(model[field.key] as string) ?? ''"
        :items="field.options || []"
        @update:model-value="(v: string | number | boolean) => set(field.key, String(v))"
      />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import type { HandoverField } from '~/types/handover-field'

defineProps<{
  fields: HandoverField[]
}>()

// Values keyed by field key.
const model = defineModel<Record<string, string | null>>({ default: () => ({}) })

const set = (key: string, value: string) => {
  model.value = { ...model.value, [key]: value === '' ? null : value }
}
</script>
