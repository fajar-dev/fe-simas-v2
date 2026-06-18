<template>
  <div class="flex min-h-screen w-full select-none">
    <!-- Left Panel: Original gradient background -->
    <div class="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-[#e6f7ec]">
      <!-- Glowing brand-themed background gradient SVG -->
      <div class="absolute inset-0 z-0 bg-[url('/gradient.svg')] bg-cover bg-center opacity-100 pointer-events-none" />
      
      <!-- Low-opacity grid overlay -->
      <div class="absolute inset-0 z-0 bg-[url('/grid.svg')] bg-cover bg-center opacity-[0.8] pointer-events-none" />
    </div>

    <!-- Right Panel: Form Content -->
    <div class="flex flex-1 lg:w-2/5 lg:flex-none items-center justify-center bg-white px-6 py-12">
      <slot />
    </div>
  </div>
</template>
