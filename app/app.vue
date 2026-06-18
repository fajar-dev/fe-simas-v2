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
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'id'
  }
})

const title = 'Nuxt Boilerplate - Admin Dashboard'
const description = 'Nuxt Boilerplate — Starter template admin dashboard'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>
