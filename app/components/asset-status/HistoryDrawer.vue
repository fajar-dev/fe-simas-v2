<template>
  <USlideover
    v-model:open="open"
    title="Status History"
    description="History of all status changes for this asset."
    :ui="{ overlay: 'bg-black/40' }"
  >
    <template #body>
      <div
        ref="scrollContainerRef"
        class="h-full overflow-y-auto"
        @scroll="handleScroll"
      >
        <!-- Skeleton Loading (initial) -->
        <div v-if="isLoading && records.length === 0" class="space-y-6">
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
        <UTimeline v-else-if="records.length > 0" :items="timelineItems">
          <template #indicator="{ item }">
            <UIcon :name="item.icon || 'i-lucide-activity'" />
          </template>
          <template #title="{ item }">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge :color="item.color || 'neutral'" variant="subtle" size="sm">
                {{ item.title }}
              </UBadge>
              <span class="text-xs text-neutral-400">{{ item.date }}</span>
            </div>
          </template>
          <template #description="{ item }">
            <p v-if="item.description" class="text-neutral-700 whitespace-pre-wrap">{{ item.description }}</p>
            <UUser
              v-if="item.user"
              :name="item.user.name"
              :avatar="item.user.avatar"
              size="xs"
              class="mt-1"
            />
          </template>
        </UTimeline>

        <!-- Empty State -->
        <UEmpty
          v-else
          icon="i-lucide-activity"
          title="No status history"
          description="Status changes for this asset will appear here."
        />

        <!-- Loading more skeleton (infinite scroll) -->
        <div v-if="isLoading && records.length > 0" class="space-y-6 mt-6">
          <div v-for="i in 3" :key="i" class="flex gap-3">
            <USkeleton class="w-7 h-7 rounded-full shrink-0" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-5 w-20" />
              <USkeleton class="h-4 w-full" />
            </div>
          </div>
        </div>

        <!-- End of List -->
        <p v-if="!isLoading && records.length > 0 && records.length >= meta.total" class="text-center py-4 text-xs text-neutral-400">
          End of status history
        </p>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { AssetStatus } from '~/types/asset'
import { assetStatusService } from '~/services/asset-status-service'

type BadgeColor = 'success' | 'neutral' | 'primary' | 'warning' | 'error'

const STATUS_CONFIG: Record<string, { label: string; color: BadgeColor; icon: string }> = {
  active: { label: 'Active', color: 'success', icon: 'i-lucide-circle-check' },
  idle: { label: 'Idle', color: 'neutral', icon: 'i-lucide-pause-circle' },
  under_repair: { label: 'Under Repair', color: 'warning', icon: 'i-lucide-wrench' },
  damaged: { label: 'Damaged', color: 'error', icon: 'i-lucide-alert-triangle' },
  lost: { label: 'Lost', color: 'error', icon: 'i-lucide-search-x' },
  sold: { label: 'Sold', color: 'primary', icon: 'i-lucide-banknote' },
  disposed: { label: 'Disposed', color: 'neutral', icon: 'i-lucide-trash-2' },
}

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ assetId: number }>()

const records = ref<AssetStatus[]>([])
const isLoading = ref(false)
const scrollContainerRef = ref<HTMLElement | null>(null)

const meta = reactive({
  page: 1,
  perPage: 15,
  total: 0,
  lastPage: 1,
})

const timelineItems = computed(() =>
  records.value.map((record) => {
    const cfg = STATUS_CONFIG[record.status] || { label: record.status, color: 'neutral' as BadgeColor, icon: 'i-lucide-activity' }
    return {
      title: cfg.label,
      description: record.note || undefined,
      icon: cfg.icon,
      color: cfg.color,
      date: record.date,
      user: record.createdBy
        ? {
            name: record.createdBy.name,
            avatar: record.createdBy.photo
              ? { src: record.createdBy.photo, alt: record.createdBy.name }
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
  records.value = []
  meta.page = 1
  fetchPage()
}

const fetchPage = async () => {
  if (isLoading.value) return
  isLoading.value = true
  try {
    const response = await assetStatusService.getByAssetId(props.assetId, meta.page, meta.perPage)
    if (response.success && response.data) {
      if (meta.page === 1) {
        records.value = response.data
      } else {
        records.value = [...records.value, ...response.data]
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
    if (!isLoading.value && meta.page < meta.lastPage && records.value.length < meta.total) {
      meta.page++
      fetchPage()
    }
  }
}

defineExpose({ resetAndFetch })
</script>
