<template>
  <div class="flex items-center gap-2">
    <UBadge :color="getStatusColor(status)" variant="subtle">
      {{ getStatusLabel(status) }}
    </UBadge>
    <UTooltip
      v-if="note"
      :text="`${note} — ${formatDate(createdAt)}`"
      :content="{ side: 'right', sideOffset: 4 }"
    >
      <UIcon name="i-lucide-info" class="w-4 h-4 text-neutral-400 cursor-help" />
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  status: string
  note?: string | null
  createdAt?: string
}>()
</script>
