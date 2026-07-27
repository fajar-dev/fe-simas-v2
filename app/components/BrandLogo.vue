<template>
  <div class="flex items-center gap-3">
    <NuxtLink to="/">
      <img v-if="!isCollapsed" src="/logo.png" alt="Logo" class="w-28">
      <img v-else src="/logo_no_text.png" alt="Logo" class="w-10">
    </NuxtLink>
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
