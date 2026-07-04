<template>
  <div class="relative min-h-screen w-full flex items-center justify-center bg-[#e6f7ec] overflow-hidden font-sans select-none">
    
    <!-- Glowing brand-themed background gradient SVG -->
    <div class="absolute inset-0 z-0 bg-[url('/gradient.svg')] bg-cover bg-center opacity-100 pointer-events-none"></div>
    
    <!-- Low-opacity grid overlay blending into the glowing backgrounds -->
    <div class="absolute inset-0 z-0 bg-[url('/grid.svg')] bg-cover bg-center opacity-[0.8] pointer-events-none"></div>

    <!-- Layout child slot viewport content container -->
    <slot />
  </div>
</template>