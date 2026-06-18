<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Feedback History"
      description="View and track your submitted feedback and responses"
    >
      <template #actions>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          @click="triggerFeedback"
        >
          Submit Feedback
        </UButton>
      </template>
    </Header>

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
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <UTable 
          :data="paginatedData" 
          :columns="columns"
          :loading="isLoading"
          :ui="{ 
            th: 'bg-neutral-50 py-2.5', 
            td: 'text-neutral-900 py-3 align-middle' 
          }"
          class="border border-neutral-200 rounded-md bg-white" 
        />
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <span class="text-sm text-neutral-500">
          Showing {{ meta.from }} to {{ meta.to }} of {{ meta.total }} results
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
import { ref, reactive, computed, onMounted, h, resolveComponent, watch } from 'vue'
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

// Table columns definition with Time, URL, Message (category/type + message), and Reply (type + reply text)
const columns: TableColumn<FeedbackItem>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Time',
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-500 text-xs font-semibold' }, formatDate(row.original.timestamp))
    }
  },
  {
    accessorKey: 'url',
    header: 'URL',
    cell: ({ row }) => {
      const url = row.original.url
      if (!url) return '-'
      return h(
        'a',
        {
          href: url,
          target: '_blank',
          class: 'text-blue-500 hover:text-blue-600 underline truncate block max-w-[200px] text-xs font-medium'
        },
        url
      )
    }
  },
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => {
      const typeLabel = getTypeLabel(row.original.type)
      const imgs = row.original.images
      
      const children = [
        // Category/Type label (plain text bold, no badge)
        h('div', { class: 'text-xs font-bold text-neutral-500 uppercase tracking-wider' }, typeLabel),
        // Message body
        h('div', { class: 'text-sm text-neutral-800 font-medium whitespace-pre-wrap max-w-md mt-0.5' }, row.original.message)
      ]
      
      // Inline Screenshots inside Message cell
      if (imgs && imgs.length > 0) {
        children.push(
          h('div', { class: 'flex gap-1.5 mt-2' },
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
        )
      }
      
      return h('div', { class: 'flex flex-col py-1' }, children)
    }
  },
  {
    accessorKey: 'reply',
    header: 'Reply',
    cell: ({ row }) => {
      const reply = row.original.reply
      if (!reply) return h('span', { class: 'text-neutral-400 text-xs' }, '-')
      
      return h('div', { class: 'flex flex-col py-1' }, [
        // Reply type/header
        h('div', { class: 'text-xs font-bold text-neutral-500 uppercase tracking-wider' }, 'Admin Reply'),
        // Reply body
        h('div', { class: 'text-xs text-neutral-600 whitespace-pre-wrap max-w-sm mt-0.5 font-medium' }, reply)
      ])
    }
  }
]

onMounted(() => {
  fetchFeedback()
})
</script>
