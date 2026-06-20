<template>
  <USlideover
    v-model:open="open"
    title="Activity Log"
    description="History of all actions performed on this asset."
    :ui="{ overlay: 'bg-black/40' }"
  >
    <template #body>
      <div
        ref="scrollContainerRef"
        class="h-full overflow-y-auto"
        @scroll="handleScroll"
      >
        <!-- Skeleton Loading (initial) -->
        <div v-if="isLoading && logs.length === 0" class="space-y-6">
          <div v-for="i in 5" :key="i" class="flex gap-3">
            <USkeleton class="w-7 h-7 rounded-full shrink-0" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-5 w-20" />
              <USkeleton class="h-4 w-full" />
              <USkeleton class="h-4 w-2/3" />
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <UTimeline v-else-if="logs.length > 0" :items="timelineItems">
          <template #indicator="{ item }">
            <UIcon :name="item.icon || 'i-lucide-info'" />
          </template>
          <template #title="{ item }">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge :color="item.color || 'neutral'" variant="subtle" size="sm">
                {{ item.title }}
              </UBadge>
            </div>
          </template>
          <template #description="{ item }">
            <p class="text-neutral-700 whitespace-pre-wrap">{{ item.description }}</p>
            <UUser
              v-if="item.user"
              :name="item.user.name"
              :avatar="item.user.avatar"
              size="xs"
              class="mt-1"
            />
            <div v-else class="flex items-center gap-2 mt-1">
              <UIcon name="i-lucide-monitor" class="w-4 h-4 text-neutral-400" />
              <span class="text-xs text-neutral-400 italic">System</span>
            </div>
          </template>
        </UTimeline>

        <!-- Empty State -->
        <UEmpty
          v-else
          icon="i-lucide-history"
          title="No activity logs found"
          description="Actions performed on this asset will appear here."
        />

        <!-- Loading more skeleton (infinite scroll) -->
        <div v-if="isLoading && logs.length > 0" class="space-y-6 mt-6">
          <div v-for="i in 3" :key="i" class="flex gap-3">
            <USkeleton class="w-7 h-7 rounded-full shrink-0" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-5 w-20" />
              <USkeleton class="h-4 w-full" />
            </div>
          </div>
        </div>

        <!-- End of List -->
        <p v-if="!isLoading && logs.length > 0 && logs.length >= meta.total" class="text-center py-4 text-xs text-neutral-400">
          End of activity history
        </p>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { AssetLog } from '~/types/asset-log'
import { assetLogService } from '~/services/asset-log-service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ assetId: number }>()

const logs = ref<AssetLog[]>([])
const isLoading = ref(false)
const scrollContainerRef = ref<HTMLElement | null>(null)

const meta = reactive({
  page: 1,
  perPage: 15,
  total: 0,
  lastPage: 1,
})

// Map logs to UTimeline items format
const timelineItems = computed(() =>
  logs.value.map((log) => {
    const theme = getActionTheme(log.module, log.action)
    return {
      title: theme.label,
      description: log.description,
      icon: getActionIcon(log.module, log.action),
      color: theme.color,
      date: formatDate(log.createdAt),
      user: log.createdBy
        ? {
            name: log.createdBy.name,
            avatar: log.createdBy.photo
              ? { src: log.createdBy.photo, alt: log.createdBy.name }
              : undefined,
          }
        : null,
    }
  }),
)

watch(open, (isOpen) => {
  if (isOpen) {
    resetAndFetch()
  }
})

const resetAndFetch = () => {
  logs.value = []
  meta.page = 1
  fetchPage()
}

const fetchPage = async () => {
  if (isLoading.value) return
  isLoading.value = true
  try {
    const response = await assetLogService.getAll(
      meta.page,
      meta.perPage,
      '',
      'createdAt',
      'DESC',
      props.assetId,
    )
    if (response.success && response.data) {
      if (meta.page === 1) {
        logs.value = response.data
      } else {
        logs.value = [...logs.value, ...response.data]
      }
      if (response.meta) {
        meta.total = response.meta.total
        meta.lastPage = Math.ceil(response.meta.total / meta.perPage)
      }
    }
  } finally {
    isLoading.value = false
  }
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
    if (!isLoading.value && meta.page < meta.lastPage && logs.value.length < meta.total) {
      meta.page++
      fetchPage()
    }
  }
}
</script>
