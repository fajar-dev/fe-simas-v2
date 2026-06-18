<template>
  <div class="space-y-4 shrink-0 select-none">
    <!-- Top Mobile Navigation Bar (Visible on mobile viewports only) -->
    <header class="flex items-center justify-between px-4 py-3 lg:hidden bg-white border-b border-neutral-200 shrink-0 -mx-4 -mt-4 mb-4">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          @click="isMobileMenuOpen = true"
          aria-label="Open menu"
        />
        <BrandLogo />
      </div>
      
      <!-- Profile Avatar Popover -->
      <UserPopover />
    </header>

    <!-- Top Row: Page Title & Description -->
    <div class="flex flex-col gap-1">
      <h2 class="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
        {{ title }}
      </h2>
      <p v-if="description" class="text-sm md:text-sm text-neutral-500">
        {{ description }}
      </p>
    </div>

    <!-- Middle Row: Tab links -->
    <div v-if="$slots.tabs" class="border-b border-neutral-200 mt-7">
      <nav class="flex gap-6 -mb-px">
        <slot name="tabs" />
      </nav>
    </div>

    <!-- Bottom Row: Actions selectors placed BELOW the tabs, right-aligned -->
    <div v-if="$slots.actions" class="flex justify-end items-center gap-3 pt-1">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()

// Share mobile sidebar menu open state globally across layout and headers
const isMobileMenuOpen = useState('isMobileMenuOpen', () => false)
</script>
