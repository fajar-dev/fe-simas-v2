<template>
  <AssetDetailWrapper v-slot="{ asset, isLoading }">
    <UCard class="w-full">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user" class="w-5 h-5 text-neutral-500" />
          <h3 class="text-sm font-semibold text-neutral-900">Holder History</h3>
        </div>
      </template>
      <div class="text-sm text-neutral-500 py-8 flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/30">
        <UIcon name="i-lucide-user-minus" class="w-8 h-8 text-neutral-400 mb-2" />
        <span>No holder history available for this asset.</span>
      </div>
    </UCard>
  </AssetDetailWrapper>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
</script>
