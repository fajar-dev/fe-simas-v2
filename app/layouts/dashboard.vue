<template>
  <div class="flex h-screen w-full font-sans text-neutral-900 overflow-hidden">
    
    <!-- 1. Sidebar Left (Desktop) -->
    <div class="hidden lg:block h-full">
      <Sidebar />
    </div>

    <!-- 2. Mobile Sidebar Overlay Drawer -->
    <div v-if="isMobileMenuOpen" class="fixed inset-0 z-40 lg:hidden">
      <!-- Backdrop with Fade Transition -->
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        appear
      >
        <div 
          class="fixed inset-0 bg-black/40"
          @click="isMobileMenuOpen = false"
        />
      </Transition>
      
      <!-- Drawer Sidebar Panel with Slide-in Transition -->
      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-300 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
        appear
      >
        <div class="fixed inset-y-0 left-0 w-68 z-50 bg-white h-full shadow-xl">
          <!-- Close overlay button inside sidebar header -->
          <div class="absolute top-4 right-2 z-50">
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              class="text-neutral-600 hover:text-neutral-800"
              @click="isMobileMenuOpen = false"
              aria-label="Close sidebar"
            />
          </div>
          <Sidebar class="h-full" />
        </div>
      </Transition>
    </div>

    <!-- 3. Main Dashboard Content (Right) -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">


      <!-- Scrollable content area -->
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const isMobileMenuOpen = useState('isMobileMenuOpen', () => false)

// Close mobile sidebar when switching pages
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})
</script>
