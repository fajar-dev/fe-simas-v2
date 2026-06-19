<template>
  <div class="space-y-6">
    <Header :title="asset ? asset.name : ''" :description="asset ? asset.code : ''" />

    <UCard v-if="isLoading" class="w-full">
      <div class="w-full mb-4">
        <USkeleton class="h-8 w-20" />
      </div>
      <!-- Loading Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start">
        <USkeleton class="w-full aspect-[8/5] rounded-xl sm:col-span-4" />
        <div class="min-w-0 w-full grid grid-cols-12 gap-6 sm:col-span-8">
          <div v-for="i in 9" :key="i" class="col-span-12 sm:col-span-6 md:col-span-4 space-y-2">
            <USkeleton class="h-3 w-1/4" />
            <USkeleton class="h-5 w-3/4" />
          </div>
          <!-- Loading Description -->
          <div class="col-span-12 pt-4 border-t border-neutral-100 dark:border-neutral-800/50 space-y-2">
            <USkeleton class="h-3 w-24" />
            <USkeleton class="h-12 w-full" />
          </div>
        </div>
      </div>
    </UCard>

    <UCard v-else-if="asset" class="w-full">
      <div class="w-full mb-6 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <UButton label="Back" to="/asset" color="neutral" icon="i-lucide-arrow-left" variant="link" />
        <UButton label="Edit Asset" :to="`/asset/${asset.id}/edit`" color="primary" icon="i-lucide-edit" />
      </div>

      <!-- Grid: Image on Left, Content Grid on Right -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-8 items-start">
        
        <!-- Left: Image Thumbnail -->
        <div v-if="asset.image" class="relative w-full aspect-[8/7] cursor-pointer overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 group sm:col-span-4" @click="openLightbox(asset.image)">
          <img :src="asset.image" :alt="asset.name" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
        <div v-else class="w-full aspect-[8/7] flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-400 sm:col-span-4">
          <UIcon name="i-lucide-package" class="w-8 h-8 text-neutral-400 mb-1" />
          <span class="text-xs text-neutral-500 font-medium">No Image</span>
        </div>

        <!-- Right: Content Grid -->
        <div class="min-w-0 w-full sm:col-span-8">
          <div class="grid grid-cols-12 gap-x-8 gap-y-6">
            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Code</span>
              <div class="text-sm text-neutral-900 dark:text-white font-mono font-medium">
                {{ asset.code }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Name</span>
              <div class="text-sm text-neutral-900 dark:text-white font-medium">
                {{ asset.name }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Category</span>
              <div class="text-sm text-neutral-900 dark:text-white font-medium">
                {{ asset.subCategory?.category?.name || '-' }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Sub Category</span>
              <div class="text-sm text-neutral-900 dark:text-white font-medium">
                {{ asset.subCategory?.name || '-' }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Price</span>
              <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {{ formatCurrency(asset.price) }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Purchase Date</span>
              <div class="text-sm text-neutral-900 dark:text-white font-medium flex items-center gap-2">
                <span>{{ asset.purchaseDate || '-' }}</span>
                <span v-if="asset.age" class="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-medium">{{ asset.age }}</span>
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Brand</span>
              <div class="text-sm text-neutral-900 dark:text-white font-medium">
                {{ asset.brand || '-' }}
              </div>
            </div>

            <div class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Model</span>
              <div class="text-sm text-neutral-900 dark:text-white font-medium">
                {{ asset.model || '-' }}
              </div>
            </div>

            <!-- Custom Specs / Labels inline in the grid -->
            <div v-for="label in asset.labels" :key="label.id || label.key" class="col-span-12 sm:col-span-6 md:col-span-4">
              <span class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">{{ label.key }}</span>
              <div class="text-sm text-neutral-900 dark:text-white font-medium">
                {{ label.value }}
              </div>
            </div>

            <!-- Description (Full width of the 12-column content grid) -->
            <div class="col-span-12 pt-4 border-t border-neutral-100 dark:border-neutral-800/50">
              <span class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">Description</span>
              <div class="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                {{ asset.description || '-' }}
              </div>
            </div>

          </div>
        </div>
      </div>
    </UCard>

    <!-- Lightbox Modal -->
    <Lightbox />
  </div>
</template>

<script setup lang="ts">
import { assetService } from '~/services/asset-service'
import type { Asset } from '~/types/asset'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const router = useRouter()
const assetId = Number(route.params.id)

// State
const asset = ref<Asset | null>(null)
const isLoading = ref(true)

const { openLightbox } = useLightbox()

// Fetch asset details
const fetchAsset = async () => {
  isLoading.value = true
  try {
    const response = await assetService.getById(assetId)
    if (response.success) {
      asset.value = response.data
    }
  } catch (error) {
    router.push('/asset')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAsset()
})
</script>
