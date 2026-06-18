<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <Header
      title="Feedback History"
      description="View and track your submitted feedback and responses"
    >
      <template #actions>
        <UButton
          color="primary"
          variant="outline"
          icon="i-lucide-plus"
          @click="triggerFeedback"
        >
          New Feedback
        </UButton>
      </template>
    </Header>

    <!-- Content Area -->
    <section class="space-y-4">
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <UIcon name="i-lucide-loader" class="w-8 h-8 animate-spin text-neutral-400" />
        <p class="text-neutral-500 text-sm">Loading your feedback history...</p>
      </div>

      <div v-else-if="!feedbacks.length" class="flex flex-col items-center justify-center border border-dashed border-neutral-200 rounded-xl p-12 bg-white text-center">
        <div class="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mb-4 text-neutral-400">
          <UIcon name="i-lucide-message-square" class="w-6 h-6" />
        </div>
        <h3 class="text-base font-semibold text-neutral-900 mb-1">No Feedback Found</h3>
        <p class="text-sm text-neutral-500 max-w-sm mb-6">
          You haven't submitted any feedback yet. Help us improve SIMAS by sharing your experience.
        </p>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          @click="triggerFeedback"
        >
          Submit Feedback
        </UButton>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="(item, index) in feedbacks" 
          :key="index"
          class="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden transition-all duration-200 hover:border-neutral-300"
        >
          <!-- Card Header -->
          <div class="px-5 py-4 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50">
            <div class="flex items-center gap-3">
              <UBadge :color="getTypeColor(item.type)" variant="soft" class="capitalize">
                {{ getTypeLabel(item.type) }}
              </UBadge>
              <span class="text-xs text-neutral-500 font-medium">
                {{ formatDate(item.timestamp) }}
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-neutral-500">
              <UIcon name="i-lucide-link" class="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span class="font-mono text-neutral-400 select-none">URL:</span>
              <a 
                :href="item.url" 
                target="_blank" 
                class="hover:text-blue-600 underline truncate max-w-[200px] md:max-w-[400px]"
              >
                {{ item.url || '-' }}
              </a>
            </div>
          </div>

          <!-- Card Body -->
          <div class="p-5 space-y-4">
            <div>
              <h4 class="text-xs font-semibold uppercase text-neutral-400 tracking-wider mb-1">Message</h4>
              <p class="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
                {{ item.message }}
              </p>
            </div>

            <!-- Screenshots Gallery -->
            <div v-if="item.images && item.images.length">
              <h4 class="text-xs font-semibold uppercase text-neutral-400 tracking-wider mb-2">Attached Screenshots</h4>
              <div class="flex flex-wrap gap-3">
                <div 
                  v-for="(img, imgIdx) in item.images" 
                  :key="imgIdx"
                  class="relative group w-28 h-20 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 cursor-pointer shadow-2xs hover:shadow-xs transition-shadow"
                  @click="openLightbox(img)"
                >
                  <img 
                    :src="img" 
                    alt="Screenshot" 
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <UIcon name="i-lucide-zoom-in" class="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Admin Response -->
            <div 
              v-if="item.reply" 
              class="mt-2 p-4 bg-primary/5 border border-primary/10 rounded-lg flex gap-3 items-start"
            >
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <UIcon name="i-lucide-shield-alert" class="w-4 h-4" />
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-neutral-800">Admin Response</span>
                  <span class="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-semibold">Reply</span>
                </div>
                <p class="text-sm text-neutral-700 leading-relaxed">
                  {{ item.reply }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Lightbox Modal -->
    <UModal v-model:open="lightboxOpen" :ui="{ content: 'sm:max-w-4xl bg-transparent p-0 shadow-none border-none' }">
      <template #content>
        <div class="relative flex flex-col items-center justify-center p-2 select-none group max-h-screen">
          <img 
            :src="lightboxImage" 
            alt="Full Screenshot" 
            class="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain border border-neutral-700 bg-black"
          />
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="solid"
            class="absolute top-4 right-4 rounded-full bg-black/60 hover:bg-black/80 text-white"
            @click="lightboxOpen = false"
            aria-label="Close Preview"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { feedbackService } from '~/services/feedback-service'
import type { FeedbackItem } from '~/services/feedback-service'
import { useFeedback } from '~/composables/useFeedback'

definePageMeta({
  layout: 'dashboard'
})

const { triggerFeedback } = useFeedback()

const feedbacks = ref<FeedbackItem[]>([])
const isLoading = ref(false)

const lightboxOpen = ref(false)
const lightboxImage = ref('')

const openLightbox = (url: string) => {
  lightboxImage.value = url
  lightboxOpen.value = true
}

const fetchFeedback = async () => {
  isLoading.value = true
  try {
    const response = await feedbackService.getAll()
    if (response.success && response.data) {
      // Sort feedback by date descending
      feedbacks.value = response.data.sort((a, b) => {
        const timeA = Number(a.timestamp) || 0
        const timeB = Number(b.timestamp) || 0
        return timeB - timeA
      })
    }
  } catch (error) {
    console.error('Failed to load feedback:', error)
  } finally {
    isLoading.value = false
  }
}

const formatDate = (timestamp: string) => {
  const ts = Number(timestamp)
  if (isNaN(ts)) return timestamp
  
  return new Date(ts).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'bug':
      return 'error'
    case 'feature':
      return 'success'
    default:
      return 'neutral'
  }
}

const getTypeLabel = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'bug':
      return 'Bug Report'
    case 'feature':
      return 'Feature Request'
    case 'other':
      return 'General / Other'
    default:
      return type || 'Other'
  }
}

onMounted(() => {
  fetchFeedback()
})
</script>
