<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Feedback History"
      description="View and track your submitted feedback and responses"
    />

    <section class="space-y-5">
      <!-- Controls -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <!-- Search -->
          <UInput 
            v-model="search" 
            icon="i-lucide-search" 
            size="md" 
            variant="outline" 
            placeholder="Search feedback..." 
            class="w-full sm:w-64" 
          />

          <!-- Items per page -->
          <USelect 
            v-model="perPage" 
            :items="limitOptions" 
            class="w-20" 
          />
        </div>

        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="triggerFeedback"
        >
          Submit Feedback
        </UButton>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <UTable 
          :data="paginatedData" 
          :columns="columns"
          :loading="isLoading"
          :ui="{ 
            th: 'bg-neutral-50 py-2.5', 
            td: 'text-neutral-900 py-3' 
          }"
          class="border border-neutral-200 rounded-md min-w-[768px]" 
        />
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <span class="text-sm text-neutral-500">
          Showing {{ meta.from || 0 }} to {{ meta.to || 0 }} of {{ meta.total }} results
        </span>
        <UPagination v-model:page="page" size="md" :total="meta.total" :items-per-page="perPage" />
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
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { feedbackService } from '~/services/feedback-service'
import type { FeedbackItem } from '~/services/feedback-service'
import { useFeedback } from '~/composables/useFeedback'

definePageMeta({
  layout: 'dashboard'
})

const { triggerFeedback } = useFeedback()

// Table controls state
const search = ref('')
const limitOptions = ref([10, 25, 50, 100])
const perPage = ref(10)
const page = ref(1)

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

// Watch search to reset page
watch(search, () => {
  page.value = 1
})

// Filter and Paginate client-side
const filteredData = computed(() => {
  let result = feedbacks.value
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter(item => 
      item.message.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      (item.url && item.url.toLowerCase().includes(q))
    )
  }
  return result
})

const paginatedData = computed(() => {
  const start = (page.value - 1) * perPage.value
  const end = start + perPage.value
  return filteredData.value.slice(start, end)
})

const meta = computed(() => {
  const total = filteredData.value.length
  const from = total > 0 ? (page.value - 1) * perPage.value + 1 : 0
  const to = Math.min(page.value * perPage.value, total)
  return { total, from, to }
})

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

const getTypeLabel = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'bug':
    case 'issue':
      return 'Issue'
    case 'feature':
    case 'suggestion':
      return 'Suggestion'
    case 'compliment':
      return 'Compliment'
    default:
      return type || 'Other'
  }
}

// Table columns: Time, URL, Message, Attachment, Reply (Matching style rules of User Profile / Category table cells)
const columns: TableColumn<FeedbackItem>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Time',
    cell: ({ row }) => {
      const dateStr = formatDate(row.original.timestamp)
      return h('span', { class: 'text-neutral-600 text-sm' }, dateStr)
    }
  },
  {
    accessorKey: 'url',
    header: 'URL',
    cell: ({ row }) => {
      const url = row.original.url
      if (!url) return h('span', { class: 'text-neutral-400 text-sm' }, '-')
      return h('a', {
        href: url,
        target: '_blank',
        class: 'text-blue-500 hover:text-blue-600 underline truncate block max-w-[200px] text-sm'
      }, url)
    }
  },
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => {
      const typeLabel = getTypeLabel(row.original.type)
      const message = row.original.message
      
      return h('div', { class: 'flex flex-col py-1' }, [
        // Category Label (lowercase bold text, no badge, matches subheadings style)
        h('div', { class: 'text-[10px] font-bold text-neutral-400 uppercase tracking-wider' }, typeLabel),
        // Message Body (matches name/main column font-medium style)
        h('span', { class: 'font-medium text-neutral-900 block whitespace-pre-wrap max-w-md mt-0.5' }, message)
      ])
    }
  },
  {
    accessorKey: 'images',
    header: 'Attachment',
    cell: ({ row }) => {
      const imgs = row.original.images
      if (!imgs || !imgs.length) return h('span', { class: 'text-neutral-400 text-sm' }, '-')
      
      return h(
        'div',
        { class: 'flex gap-1.5 py-1' },
        imgs.map((img) => 
          h('img', {
            src: img,
            alt: 'Screenshot',
            class: 'w-10 h-7 object-cover rounded border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors shadow-2xs',
            onClick: (e: Event) => {
              e.stopPropagation()
              openLightbox(img)
            }
          })
        )
      )
    }
  },
  {
    accessorKey: 'reply',
    header: 'Reply',
    cell: ({ row }) => {
      const reply = row.original.reply
      if (!reply) return h('span', { class: 'text-neutral-400 text-sm' }, '-')
      
      return h('div', { class: 'flex flex-col py-1' }, [
        h('div', { class: 'text-[10px] font-bold text-neutral-400 uppercase tracking-wider' }, 'Admin Response'),
        h('span', { class: 'text-sm text-neutral-600 font-medium whitespace-pre-wrap max-w-sm mt-0.5' }, reply)
      ])
    }
  }
]

onMounted(() => {
  fetchFeedback()
})
</script>
