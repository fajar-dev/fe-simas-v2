<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 cursor-zoom-out"
        @click.self="closeLightbox"
      >
        <img 
          :src="lightboxImage" 
          alt="Full Screenshot" 
          class="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain cursor-default"
        />
        <button
          class="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          @click="closeLightbox"
          aria-label="Close Preview"
        >
          <UIcon name="i-lucide-x" class="w-5 h-5" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { lightboxOpen, lightboxImage, closeLightbox } = useLightbox()
</script>
