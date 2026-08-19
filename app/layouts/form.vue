<template>
  <div class="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#cbf5db] via-[#a2f2c2] to-[#6ed896] overflow-hidden font-sans select-none">
    <!-- Top Right Color Mode Switch -->
    <div class="absolute top-4 right-4 z-20">
      <UColorModeSwitch />
    </div>

    <!-- Glowing brand-themed background radial gradient with pure CSS -->
    <div
      class="absolute inset-0 z-0 pointer-events-none"
      style="background: 
        radial-gradient(circle at 50% 0%, rgba(0, 152, 56, 0.4) 0%, transparent 70%),
        radial-gradient(circle at 0% 100%, rgba(0, 128, 47, 0.35) 0%, transparent 60%),
        radial-gradient(circle at 100% 100%, rgba(0, 152, 56, 0.35) 0%, transparent 60%);"
    />

    <!-- Glowing ambient blur accents -->
    <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#009838]/20 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-24 -left-24 w-[450px] h-[450px] bg-[#00802f]/25 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-24 -right-24 w-[450px] h-[450px] bg-[#009838]/20 rounded-full blur-3xl pointer-events-none" />

    <!-- Dark black overlay cover -->
    <div class="absolute inset-0 z-0 bg-black/20 pointer-events-none" />

    <!-- Low-opacity grid overlay blending into the glowing backgrounds -->
    <div class="absolute inset-0 z-0 bg-[url('/grid.svg')] bg-cover bg-center opacity-[0.35] pointer-events-none" />

    <!-- Layout child slot viewport content container -->
    <div class="relative z-10 w-full flex items-center justify-center">
      <slot />
    </div>
  </div>
</template>