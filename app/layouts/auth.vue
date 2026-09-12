<template>
  <div class="flex min-h-screen w-full select-none relative">
    <!-- Top Right Color Mode Switch -->
    <div class="absolute top-4 right-4 z-20">
      <UColorModeSwitch />
    </div>

    <!-- Left Panel: Vibrant brand green gradient background -->
    <div class="hidden lg:flex lg:w-2/5 relative overflow-hidden bg-gradient-to-br from-[#34d399] via-[#10b981] to-[#047857]">
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

      <!-- Low-opacity grid overlay -->
      <div class="absolute inset-0 z-0 bg-[url('/grid.svg')] bg-cover bg-center opacity-[0.35] pointer-events-none" />

      <!-- Brand content -->
      <div class="relative z-10 flex flex-col justify-between w-full h-full px-14 py-14">
        <div>
          <img src="/logo_text_light.png" alt="SIMAS" class="w-32">
        </div>

        <div class="max-w-md">
          <h1 class="text-4xl font-bold leading-tight text-white min-h-[2.5em]">
            {{ typedTitle }}<span class="inline-block w-[3px] h-9 -mb-1.5 bg-white ml-0.5 align-middle animate-pulse" />
          </h1>
          <p class="mt-4 text-white/80">
            {{ $t('pages.auth.leftPanel.subtitle') }}
          </p>

          <div class="mt-10 space-y-6">
            <div v-for="feature in features" :key="feature.title" class="flex items-start gap-4">
              <div class="flex items-center justify-center rounded-xl w-11 h-11 shrink-0 bg-white/10 backdrop-blur-sm">
                <UIcon :name="feature.icon" class="text-white size-5" />
              </div>
              <div>
                <p class="font-semibold text-white">
                  {{ feature.title }}
                </p>
                <p class="text-sm text-white/70">
                  {{ feature.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p class="text-sm text-white/60">
          © {{ currentYear }} SIMAS. {{ $t('pages.auth.leftPanel.footer') }}
        </p>
      </div>
    </div>

    <!-- Right Panel: Form Content -->
    <div class="flex flex-1 lg:w-3/5 lg:flex-none items-center justify-center bg-default px-6 py-12 relative z-10 shadow-4xl">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const currentYear = new Date().getFullYear()

const features = computed(() => [
  {
    icon: 'i-lucide-package',
    title: t('pages.auth.leftPanel.feature1Title'),
    description: t('pages.auth.leftPanel.feature1Description')
  },
  {
    icon: 'i-lucide-bar-chart-3',
    title: t('pages.auth.leftPanel.feature2Title'),
    description: t('pages.auth.leftPanel.feature2Description')
  },
  {
    icon: 'i-lucide-calendar-clock',
    title: t('pages.auth.leftPanel.feature3Title'),
    description: t('pages.auth.leftPanel.feature3Description')
  }
])

// Simple typewriter effect for the headline — purely decorative.
const typedTitle = ref('')
let typewriterTimer: ReturnType<typeof setTimeout> | undefined

const runTypewriter = () => {
  const fullTitle = t('pages.auth.leftPanel.title')
  typedTitle.value = ''
  let i = 0

  const step = () => {
    if (i >= fullTitle.length) return
    typedTitle.value += fullTitle[i]
    i++
    typewriterTimer = setTimeout(step, 45)
  }
  step()
}

onMounted(runTypewriter)
onUnmounted(() => clearTimeout(typewriterTimer))
</script>
