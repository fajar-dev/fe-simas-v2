<template>
  <div class="flex items-center gap-2">
    <UBadge :color="getStatusColor(status)" variant="subtle">
      {{ getStatusLabel(status) }}
    </UBadge>
    <UTooltip
      :text="tooltipText"
      :content="{ side: 'right', sideOffset: 4 }"
    >
      <UIcon name="i-lucide-info" class="w-4 h-4 text-neutral-400 cursor-help" />
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: string
  note?: string | null
  createdAt?: string
  createdBy?: { id: number; name: string; photo: string | null } | null
}>()

const tooltipText = computed(() => {
  const parts: string[] = []
  if (props.note) parts.push(props.note)
  if (props.createdBy?.name) parts.push(`by ${props.createdBy.name}`)
  if (props.createdAt) parts.push(formatDate(props.createdAt))
  return parts.join(' — ') || props.status
})
</script>
