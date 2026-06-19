<template>
  <NuxtPage />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const assetId = Number(route.params.id)

if (route.path === `/asset/${assetId}` || route.path === `/asset/${assetId}/`) {
  navigateTo(`/asset/${assetId}/location`, { replace: true })
}
</script>
