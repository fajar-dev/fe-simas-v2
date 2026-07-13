<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      :title="$t('pages.profile.title')"
      :description="$t('pages.profile.description')"
    >
    </Header>

    <div class="max-w-2xl bg-white border border-neutral-200 rounded-lg shadow-xs overflow-hidden">
      <!-- Tabs Header -->
      <div class="border-b border-neutral-200 px-6 pt-4 bg-neutral-50/50">
        <div class="flex gap-6">
          <NuxtLink 
            to="/profile/information"
            custom
            v-slot="{ href, navigate, isActive }"
          >
            <a
              :href="href"
              @click="navigate"
              class="pb-3 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer focus:outline-hidden"
              :class="isActive ? 'border-primary text-primary font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-900'"
            >
              {{ $t('pages.profile.information') }}
            </a>
          </NuxtLink>
          <!-- <NuxtLink 
            to="/profile/password"
            custom
            v-slot="{ href, navigate, isActive }"
          >
            <a
              :href="href"
              @click="navigate"
              class="pb-3 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer focus:outline-hidden"
              :class="isActive ? 'border-primary text-primary font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-900'"
            >
              {{ $t('pages.profile.password') }}
            </a>
          </NuxtLink> -->
        </div>
      </div>

      <!-- Nested Page Content -->
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})
</script>
