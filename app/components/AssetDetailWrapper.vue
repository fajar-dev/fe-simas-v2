<template>
  <div class="space-y-6">
    <Header :title="`${asset?.name || ''}`" :description="`${asset?.code || ''}`" />

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

    <UCard v-else-if="asset" class="w-full">
      <div class="w-full mb-4 flex items-center justify-between">
        <UButton label="Back" to="/asset" color="neutral" icon="i-lucide-arrow-left" variant="link" />
        <UButton :to="`/asset/${asset.id}/edit`" color="primary" icon="i-lucide-edit">
          <span class="hidden sm:inline">Edit Asset</span>
        </UButton>
      </div>

      <!-- Grid: Image on Left, Content Grid on Right -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start">
        
        <!-- Left: Image Thumbnail -->
        <div v-if="asset.image" class="relative w-full aspect-[8/7] cursor-pointer overflow-hidden rounded-lg border border-neutral-200 group sm:col-span-4" @click="openLightbox(asset.image)">
          <NuxtImg :src="asset.image" :alt="asset.name" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
        <div v-else class="w-full aspect-[8/7] flex flex-col items-center justify-center bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-400 sm:col-span-4">
          <UIcon name="i-lucide-package" class="w-8 h-8 text-neutral-400 mb-1" />
          <span class="text-xs text-neutral-500 font-medium">No Image</span>
        </div>

        <!-- Right: Content Grid -->
        <div class="min-w-0 w-full sm:col-span-8">
          <div class="grid grid-cols-12 gap-x-8 gap-y-6">
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Code</span>
              <div class="text-sm text-neutral-900 font-mono font-medium truncate" :title="asset.code">
                {{ asset.code }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Name</span>
              <div class="text-sm text-neutral-900 font-medium truncate" :title="asset.name">
                {{ asset.name }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Category</span>
              <div class="text-sm text-neutral-900 font-medium truncate" :title="asset.subCategory?.category?.name || '-'">
                {{ asset.subCategory?.category?.name || '-' }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Sub Category</span>
              <div class="text-sm text-neutral-900 font-medium truncate" :title="asset.subCategory?.name || '-'">
                {{ asset.subCategory?.name || '-' }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Price</span>
              <div class="text-sm text-neutral-900 font-medium truncate" :title="formatCurrency(asset.price)">
                {{ formatCurrency(asset.price) }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Purchase Date</span>
              <div class="text-sm text-neutral-900 font-medium flex items-center gap-2 min-w-0">
                <span class="truncate" :title="asset.purchaseDate || '-'">{{ asset.purchaseDate || '-' }}</span>
                <span v-if="asset.age" class="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full font-medium shrink-0">{{ asset.age }}</span>
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Brand</span>
              <div class="text-sm text-neutral-900 font-medium truncate" :title="asset.brand || '-'">
                {{ asset.brand || '-' }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Model</span>
              <div class="text-sm text-neutral-900 font-medium truncate" :title="asset.model || '-'">
                {{ asset.model || '-' }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Last Location</span>
              <div class="text-sm text-neutral-900 font-medium flex items-center gap-1.5 flex-wrap min-w-0">
                <span class="truncate" :title="asset.lastLocation?.location ? asset.lastLocation.location.name : '-'">{{ asset.lastLocation?.location ? asset.lastLocation.location.name : '-' }}</span>
                <span v-if="asset.lastLocation?.location?.branch" class="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full font-medium shrink-0" :title="asset.lastLocation.location.branch.name">
                  {{ asset.lastLocation.location.branch.name }}
                </span>
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Active Holder</span>
              <div class="text-sm text-neutral-900 font-medium">
                <div v-if="asset.activeHolder?.employee" class="flex items-center gap-2 min-w-0">
                  <UAvatar
                    :src="asset.activeHolder.employee.photo || undefined"
                    :alt="asset.activeHolder.employee.name"
                    class="bg-primary-50 text-primary-700 shrink-0"
                    loading="lazy"
                  />
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm text-neutral-900 leading-tight block truncate" :title="asset.activeHolder.employee.name">{{ asset.activeHolder.employee.name }}</span>
                    <span class="text-xs text-neutral-500 leading-tight block truncate" :title="asset.activeHolder.employee.employeeId">{{ asset.activeHolder.employee.employeeId }}</span>
                  </div>
                </div>
                <span v-else>-</span>
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Created By</span>
              <div class="text-sm text-neutral-900 font-medium">
                <div v-if="asset.createdBy" class="flex items-center gap-2 min-w-0">
                  <UAvatar
                    :src="asset.createdBy.photo || undefined"
                    :alt="asset.createdBy.name"
                    class="bg-primary-50 text-primary-700 shrink-0 animate-none"
                    size="md"
                    loading="lazy"
                  />
                  <span class="text-sm text-neutral-900 truncate" :title="asset.createdBy.name">
                    {{ asset.createdBy.name }}
                  </span>
                </div>
                <span v-else>-</span>
              </div>
            </div>

            <!-- Custom Specs / Labels inline in the grid -->
            <div v-for="label in asset.labels" :key="label.id || label.key" class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1 truncate" :title="label.key">{{ label.key }}</span>
              <div class="text-sm text-neutral-900 font-medium truncate" :title="label.value">
                {{ label.value }}
              </div>
            </div>

            <!-- Description (Full width of the 12-column content grid) -->
            <div class="col-span-12 pt-4 border-t border-neutral-100">
              <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Description</span>
              <div class="text-sm text-neutral-700">
                {{ asset.description || '-' }}
              </div>
            </div>

          </div>
        </div>
      </div>
    </UCard>

    <!-- Tabs Navigation -->
    <UTabs v-model="activeTab" :items="items" variant="link" :ui="{  }" class="gap-4" />

    <!-- Sub Page Content Slot -->
    <div class="w-full mt-4">
      <slot :asset="asset" :is-loading="isLoading" />
    </div>

    <!-- Lightbox Modal -->
    <Lightbox />
  </div>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { Asset } from '~/types/asset'

const route = useRoute()
const assetId = Number(route.params.id)

// Inject state from the parent page ([id].vue) to prevent reloading on tab changes
const { asset, isLoading } = inject('assetState') as {
  asset: Ref<Asset | null>
  isLoading: Ref<boolean>
}

const { openLightbox } = useLightbox()

const items = computed(() => {
  const tabs: TabsItem[] = []
  if (asset.value?.hasLocation !== false) {
    tabs.push({
      value: 'location',
      label: 'Location',
      icon: 'i-lucide-map-pin',
      to: `/asset/${assetId}/location`
    })
  }
  if (asset.value?.hasHolder !== false) {
    tabs.push({
      value: 'holder',
      label: 'Holder',
      icon: 'i-lucide-user',
      to: `/asset/${assetId}/holder`
    })
  }
  if (asset.value?.hasMaintenance !== false) {
    tabs.push({
      value: 'maintenance',
      label: 'Maintenance',
      icon: 'i-lucide-wrench',
      to: `/asset/${assetId}/maintenance`
    })
  }
  return tabs
})

const activeTab = computed({
  get() {
    let current: string = 'location'
    if (route.path.endsWith('/holder')) current = 'holder'
    else if (route.path.endsWith('/maintenance')) current = 'maintenance'

    const isAllowed = items.value.some(i => i.value === current)
    if (!isAllowed && items.value.length > 0) {
      const firstTab = items.value[0]
      if (firstTab && firstTab.to) {
        navigateTo(firstTab.to)
      }
    }
    return current
  },
  set(val) {
    const target = items.value.find(i => i.value === val)?.to
    if (target && route.path !== target) {
      navigateTo(target)
    }
  }
})
</script>
