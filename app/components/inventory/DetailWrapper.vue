<template>
  <div class="space-y-6">
    <Header :title="product?.name || ''" :description="product?.code || ''" />

    <UCard v-if="isLoading" class="w-full">
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-6">
        <div v-for="i in 6" :key="i" class="col-span-12 sm:col-span-4 space-y-2">
          <USkeleton class="h-3 w-1/4" />
          <USkeleton class="h-5 w-3/4" />
        </div>
      </div>
    </UCard>

    <UCard v-else-if="product" class="w-full">
      <div class="w-full mb-4 flex items-center justify-between">
        <UButton :label="$t('common.back')" color="neutral" icon="i-lucide-arrow-left" variant="link" @click="() => { navigateTo('/inventory') }" />
        <div class="flex items-center gap-2">
          <UButton
            v-if="hasPermission('inventory-variant:read')"
            color="neutral"
            variant="outline"
            icon="i-lucide-layers"
            @click="() => { showVariantModal = true }"
          >
            <span class="hidden sm:inline">{{ $t('pages.inventory.variant.manageTitle') }}</span>
          </UButton>
          <UButton
            v-if="hasPermission('inventory:update')"
            color="primary"
            icon="i-lucide-edit"
            @click="() => { navigateTo(`/inventory/${product!.id}/edit`) }"
          >
            <span class="hidden sm:inline">{{ $t('pages.inventory.item.editTitle') }}</span>
          </UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start">
        <!-- Photo -->
        <div v-if="product.image" class="w-full aspect-[8/7] overflow-hidden rounded-lg border border-neutral-200 sm:col-span-4">
          <NuxtImg :src="product.image" :alt="product.name" class="w-full h-full object-cover" />
        </div>
        <div v-else class="w-full aspect-[8/7] flex flex-col items-center justify-center bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-400 sm:col-span-4">
          <UIcon name="i-lucide-package" class="w-8 h-8 mb-1" />
        </div>

        <!-- Info -->
        <div class="min-w-0 w-full sm:col-span-8">
          <div class="grid grid-cols-12 gap-x-8 gap-y-6">
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.code') }}</span>
              <div class="text-sm text-neutral-900 font-medium truncate">{{ product.code || '-' }}</div>
            </div>
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.inventory.unit.label') }}</span>
              <div class="text-sm text-neutral-900 font-medium">{{ product.unit || '-' }}</div>
            </div>
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.status') }}</span>
              <UBadge :color="product.isActive ? 'success' : 'neutral'" variant="subtle">
                {{ product.isActive ? $t('common.active') : $t('common.inactive') }}
              </UBadge>
            </div>
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.category') }}</span>
              <div class="text-sm text-neutral-900 font-medium truncate">{{ product.category?.name || '-' }}</div>
            </div>
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.subCategory') }}</span>
              <div class="text-sm text-neutral-900 font-medium truncate">{{ product.subCategory?.name || '-' }}</div>
            </div>

            <!-- Labels -->
            <div v-for="label in product.labels" :key="label.id || label.key" class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1 truncate">{{ label.key }}</span>
              <div class="text-sm text-neutral-900 font-medium truncate">{{ label.value }}</div>
            </div>

            <div class="col-span-12 pt-4 border-t border-neutral-100">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.description') }}</span>
              <div class="text-sm text-neutral-700">{{ product.description || '-' }}</div>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <UTabs v-model="activeTab" :items="items" variant="link" class="gap-4" />

    <div class="w-full mt-4">
      <slot />
    </div>

    <InventoryVariantManagerModal v-model="showVariantModal" :product="product" @changed="onProductSaved" />
  </div>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { Inventory } from '~/types/inventory'

const { t } = useI18n()
const route = useRoute()
const { hasPermission } = useAuth()
const inventoryId = Number(route.params.id)

const { product, isLoading } = inject('inventoryState') as { product: Ref<Inventory | null>; isLoading: Ref<boolean> }
const { fetchProduct } = inject('inventoryActions') as { fetchProduct: () => Promise<void> }

const showVariantModal = ref(false)

const onProductSaved = async () => { await fetchProduct() }

const items = computed(() => {
  const tabs: TabsItem[] = []
  if (hasPermission('inventory-stock:read')) {
    tabs.push({ value: 'balance', label: t('pages.inventory.tabs.balance'), icon: 'i-lucide-layers', to: `/inventory/${inventoryId}/balance` })
  }
  if (hasPermission('inventory-stock:transfer')) {
    tabs.push({ value: 'transfer', label: t('pages.inventory.tabs.transfer'), icon: 'i-lucide-arrow-left-right', to: `/inventory/${inventoryId}/transfer` })
  }
  if (hasPermission('inventory-stock:read')) {
    tabs.push({ value: 'holder', label: t('pages.inventory.tabs.holder'), icon: 'i-lucide-users', to: `/inventory/${inventoryId}/holder` })
    tabs.push({ value: 'movement', label: t('pages.inventory.tabs.movement'), icon: 'i-lucide-history', to: `/inventory/${inventoryId}/movement` })
  }
  return tabs
})

const activeTab = computed({
  get() {
    let current = 'balance'
    if (route.path.endsWith('/transfer')) current = 'transfer'
    else if (route.path.endsWith('/holder')) current = 'holder'
    else if (route.path.endsWith('/movement')) current = 'movement'
    return current
  },
  set(val) {
    const target = items.value.find(i => i.value === val)?.to
    if (typeof target === 'string' && route.path !== target) navigateTo(target)
  }
})
</script>
