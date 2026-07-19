<template>
  <!-- Edit is a standalone full page; the detail wrapper (header + tabs) is only for the tab views. -->
  <NuxtPage v-if="isEdit" />
  <InventoryDetailWrapper v-else>
    <NuxtPage />
  </InventoryDetailWrapper>
</template>

<script setup lang="ts">
import { inventoryService } from '~/services/inventory-service'
import type { Inventory } from '~/types/inventory'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const inventoryId = computed(() => Number(route.params.id))
const isEdit = computed(() => route.path.endsWith('/edit'))

const item = ref<Inventory | null>(null)
const isLoading = ref(true)

const loadData = async () => {
  isLoading.value = true
  try {
    const res = await inventoryService.getById(inventoryId.value)
    if (res.success) {
      item.value = res.data
    } else {
      router.push('/inventory')
    }
  } catch {
    router.push('/inventory')
  } finally {
    isLoading.value = false
  }
}

provide('inventoryState', { item, isLoading })
provide('inventoryActions', { fetchItem: loadData })

onMounted(() => { if (!isEdit.value) loadData() })

watch(inventoryId, (id) => { if (id && !isEdit.value) loadData() })

if (!isEdit.value && (route.path === `/inventory/${inventoryId.value}` || route.path === `/inventory/${inventoryId.value}/`)) {
  navigateTo(`/inventory/${inventoryId.value}/stock-in`, { replace: true })
}
</script>
