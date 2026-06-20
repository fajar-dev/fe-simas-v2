<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { assetService } from '~/services/asset-service'
import type { Asset } from '~/types/asset'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const router = useRouter()
const assetId = computed(() => Number(route.params.id))

const asset = ref<Asset | null>(null)
const isLoading = ref(true)

// Fetch asset details once at the parent level
const loadData = async () => {
  isLoading.value = true
  try {
    const response = await assetService.getById(assetId.value)
    if (response.success) {
      asset.value = response.data
    }
  } catch (error) {
    router.push('/asset')
  } finally {
    isLoading.value = false
  }
}

// Provide state to child page components and wrappers
provide('assetState', {
  asset,
  isLoading
})

provide('assetActions', {
  fetchAsset: loadData
})

onMounted(() => {
  loadData()
})

// Reload only if the actual asset ID changes
watch(assetId, (newId) => {
  if (newId) {
    loadData()
  }
})

if (route.path === `/asset/${assetId.value}` || route.path === `/asset/${assetId.value}/`) {
  navigateTo(`/asset/${assetId.value}/location`, { replace: true })
}
</script>
