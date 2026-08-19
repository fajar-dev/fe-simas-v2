<template>
  <div class="flex items-center gap-3">
    <NuxtLink to="/">
      <template v-if="!isCollapsed">
        <img src="/logo_text_dark.png" alt="Logo" class="w-28 dark:hidden">
        <img src="/logo_text_light.png" alt="Logo" class="w-28 hidden dark:block">
      </template>
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
