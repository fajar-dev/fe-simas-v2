<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white shadow-sm shrink-0">
      <UIcon name="i-lucide-box" class="w-5 h-5 text-white" />
    </div>
    <div v-if="!isCollapsed" class="min-w-0">
      <h1 class="text-sm font-medium text-neutral-900 truncate">
        SIMAS
      </h1>
      <p class="text-xs text-neutral-600">
        Asset Management System
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    isCollapsed?: boolean
  }>(),
  {
    isCollapsed: false
  }
)
</script>
