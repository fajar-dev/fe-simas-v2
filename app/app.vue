<template>
  <UApp :toaster="{ position: 'top-right', progress: false }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
  ],
  htmlAttrs: {
    lang: 'id'
  }
})

const title = 'SIMAS'
const description = 'SIMAS — Asset Management System'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>
