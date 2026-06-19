<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      title="Feedback History"
      description="View and track your submitted feedback and responses"
    />

    <DataTable
      v-model:search="search"
      v-model:page="page"
      v-model:perPage="perPage"
      :data="paginatedData"
      :columns="columns"
      :loading="isLoading"
      :from="meta.from"
      :to="meta.to"
      :total="meta.total"
      search-placeholder="Search feedback..."
    />

    <!-- Lightbox Modal -->
    <Lightbox />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { feedbackService } from '~/services/feedback-service'
import type { FeedbackItem } from '~/services/feedback-service'

definePageMeta({
  layout: 'dashboard'
})

// Table controls state
const search = ref('')
const perPage = ref(10)
const page = ref(1)

const feedbacks = ref<FeedbackItem[]>([])
const isLoading = ref(false)

const { openLightbox } = useLightbox()

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



// Table columns: Time, URL, Message, Attachment, Reply (Matching style rules of User Profile / Category table cells)
const columns: TableColumn<FeedbackItem>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Time',
    meta: { class: { td: 'w-[140px]' } },
    cell: ({ row }) => {
      const dateStr = formatDate(row.original.timestamp)
      return h('span', { class: 'font-medium text-neutral-600' }, dateStr)
    }
  },
  {
    accessorKey: 'url',
    header: 'URL',
    meta: { class: { td: 'w-[180px] max-w-[180px]' } },
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900 truncate block', title: row.original.url }, row.original.url)
    }
  },
  {
    accessorKey: 'message',
    header: 'Message',
    meta: { class: { td: 'min-w-[300px]' } },
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col py-1' }, [
        h('div', { class: 'text-md font-semibold text-primary-900' }, row.original.category),
        h('span', { class: 'text-neutral-600 whitespace-pre-wrap' }, row.original.message)
      ])
    }
  },
  {
    accessorKey: 'images',
    header: 'Attachment',
    meta: { class: { td: 'w-[150px]' } },
    cell: ({ row }) => {
      const imgs = row.original.images
      if (!imgs || !imgs.length) return h('span', { class: 'text-neutral-400 text-sm' }, '-')
      
      return h(
        'div',
        { class: 'flex flex-wrap gap-1.5 py-1' },
        imgs.map((img) => 
          h('img', {
            src: img,
            alt: 'Screenshot',
            class: 'w-16 h-10 object-cover rounded border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors shadow-2xs shrink-0',
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
    meta: { class: { td: 'min-w-[250px]' } },
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col py-1' }, [
        h('div', { class: 'text-md font-semibold text-primary-900' }, row.original.type || '-'),
        h('span', { class: 'text-neutral-600 whitespace-pre-wrap' }, row.original.reply || '-')
      ])
    }
  }
]

onMounted(() => {
  fetchFeedback()
})
</script>
