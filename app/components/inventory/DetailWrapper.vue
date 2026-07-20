<template>
  <div class="space-y-6">
    <Header :title="item?.name || ''" :description="item?.code || ''" />

  <UCard v-if="isLoading" class="w-full">
      <div class="w-full mb-4">
        <USkeleton class="h-8 w-20" />
      </div>
      <!-- Loading Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start">
        <USkeleton class="w-full aspect-[8/5] rounded-lg sm:col-span-4" />
        <div class="min-w-0 w-full grid grid-cols-12 gap-6 sm:col-span-8">
          <div v-for="i in 9" :key="i" class="col-span-12 sm:col-span-6 md:col-span-4 space-y-2">
            <USkeleton class="h-3 w-1/4" />
            <USkeleton class="h-5 w-3/4" />
          </div>
          <!-- Loading Description -->
          <div class="col-span-12 pt-4 border-t border-neutral-100 space-y-2">
            <USkeleton class="h-3 w-24" />
            <USkeleton class="h-12 w-full" />
          </div>
        </div>
      </div>
    </UCard>

    <UCard v-else-if="item" class="w-full">
      <div class="w-full mb-4 flex items-center justify-between">
        <UButton :label="$t('common.back')" color="neutral" icon="i-lucide-arrow-left" variant="link" @click="() => { navigateTo('/inventory') }" />
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-history"
            @click="() => { showLogDrawer = true }"
          >
            <span class="hidden sm:inline">{{ $t('component.inventory.detailWrapper.activityLog') }}</span>
          </UButton>
          <UButton
            v-if="hasPermission('inventory-variant:read')"
            color="primary"
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
            @click="() => { navigateTo(`/inventory/${item!.id}/edit`) }"
          >
            <span class="hidden sm:inline">{{ $t('pages.inventory.item.editTitle') }}</span>
          </UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start">
        <!-- Photo -->
        <div v-if="item.image" class="relative w-full aspect-[8/7] cursor-pointer overflow-hidden rounded-lg border border-neutral-200 group sm:col-span-4" @click="openLightbox(item.image)">
          <NuxtImg :src="item.image" :alt="item.name" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
        <div v-else class="w-full aspect-[8/7] flex flex-col items-center justify-center bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-400 sm:col-span-4">
          <UIcon name="i-lucide-package" class="w-8 h-8 text-neutral-400 mb-1" />
          <span class="text-xs text-neutral-500 font-medium">{{ $t('component.asset.detailWrapper.noImage') }}</span>
        </div>

        <!-- Info -->
        <div class="min-w-0 w-full sm:col-span-8">
          <div class="grid grid-cols-12 gap-x-8 gap-y-6">
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.code') }}</span>
              <div class="text-sm text-neutral-900 font-medium truncate">{{ item.code || '-' }}</div>
            </div>
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.inventory.unit.label') }}</span>
              <div class="text-sm text-neutral-900 font-medium">{{ item.unit || '-' }}</div>
            </div>
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.status') }}</span>
              <UBadge :color="item.isActive ? 'success' : 'neutral'" variant="subtle">
                {{ item.isActive ? $t('common.active') : $t('common.inactive') }}
              </UBadge>
            </div>
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.category') }}</span>
              <div class="text-sm text-neutral-900 font-medium truncate">{{ item.category?.name || '-' }}</div>
            </div>
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.subCategory') }}</span>
              <div class="text-sm text-neutral-900 font-medium truncate">{{ item.subCategory?.name || '-' }}</div>
            </div>

            <!-- Created by -->
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.createdBy') }}</span>
              <div v-if="item.createdBy" class="flex items-center gap-2 min-w-0">
                <UAvatar :src="item.createdBy.photo || undefined" :alt="item.createdBy.name" size="xs" class="bg-primary-50 text-primary-700 shrink-0" />
                <span class="text-sm text-neutral-900 font-medium truncate">{{ item.createdBy.name }}</span>
              </div>
              <span v-else class="text-sm text-neutral-500">-</span>
            </div>

            <!-- Labels -->
            <div v-for="label in item.labels" :key="label.id || label.key" class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1 truncate">{{ label.key }}</span>
              <div class="text-sm text-neutral-900 font-medium truncate">{{ label.value }}</div>
            </div>

            <div class="col-span-12 pt-4 border-t border-neutral-100">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('common.description') }}</span>
              <div class="text-sm text-neutral-700">{{ item.description || '-' }}</div>
            </div>

            <!-- Variants -->
            <div class="col-span-12 pt-4 border-t border-neutral-100">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.inventory.stock.overviewTitle') }}</span>
              <InventoryStockOverview v-if="item && hasPermission('inventory-stock:read')" :inventory-id="inventoryId" :refresh-key="stockKey" />
            </div>

            <!-- Attachments -->
            <div v-if="item.attachments && item.attachments.length" class="col-span-12 pt-4 border-t border-neutral-100">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">{{ $t('component.attachment.title') }}</span>
              <div class="flex flex-wrap gap-2">
                <a
                  v-for="att in item.attachments"
                  :key="att.id"
                  :href="att.url"
                  target="_blank"
                  rel="noopener"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors text-sm text-neutral-700 hover:text-neutral-900 no-underline"
                >
                  <UIcon name="i-lucide-paperclip" class="w-4 h-4 text-primary shrink-0" />
                  <span class="truncate max-w-48">{{ att.originalName }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Variant & stock overview -->

    <UTabs v-model="activeTab" :items="tabItems" variant="link" class="gap-4" />

    <!-- Lightbox Modal -->
    <Lightbox />

    <div class="w-full mt-4">
      <slot />
    </div>

    <InventoryVariantManagerModal v-model="showVariantModal" :inventory="item" @changed="onItemSaved" />
    <InventoryLogDrawer v-model:open="showLogDrawer" :inventory-id="inventoryId" />
  </div>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { Inventory } from '~/types/inventory'

const { t } = useI18n()
const route = useRoute()
const { hasPermission } = useAuth()
const { openLightbox } = useLightbox()
const inventoryId = Number(route.params.id)

const { item, isLoading } = inject('inventoryState') as { item: Ref<Inventory | null>; isLoading: Ref<boolean> }
const { fetchItem } = inject('inventoryActions') as { fetchItem: () => Promise<void> }

const showVariantModal = ref(false)
const showLogDrawer = ref(false)

// Bumped to force the stock overview to refetch (e.g. after adding stock, or switching tabs).
const stockKey = ref(0)
provide('inventoryStock', { refresh: () => { stockKey.value++ } })
watch(() => route.path, () => { stockKey.value++ })

const onItemSaved = async () => { await fetchItem(); stockKey.value++ }

const tabItems = computed(() => {
  const tabs: TabsItem[] = []
  if (hasPermission('inventory-stock:read')) {
    tabs.push({ value: 'stock-in', label: t('pages.inventory.tabs.stockIn'), icon: 'i-lucide-package', to: `/inventory/${inventoryId}/stock-in` })
  }
  if (hasPermission('inventory-stock:transfer')) {
    tabs.push({ value: 'transfer', label: t('pages.inventory.tabs.transfer'), icon: 'i-lucide-arrow-left-right', to: `/inventory/${inventoryId}/transfer` })
  }
  if (hasPermission('inventory-stock:read')) {
    tabs.push({ value: 'holder', label: t('pages.inventory.tabs.holder'), icon: 'i-lucide-users', to: `/inventory/${inventoryId}/holder` })
  }
  return tabs
})

const activeTab = computed({
  get() {
    let current = 'stock-in'
    if (route.path.endsWith('/transfer')) current = 'transfer'
    else if (route.path.endsWith('/holder')) current = 'holder'
    return current
  },
  set(val) {
    const target = tabItems.value.find(i => i.value === val)?.to
    if (typeof target === 'string' && route.path !== target) navigateTo(target)
  }
})
</script>
