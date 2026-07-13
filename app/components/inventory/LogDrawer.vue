<template>
  <USlideover
    v-model:open="open"
    :title="$t('component.inventory.logDrawer.title')"
    :description="$t('component.inventory.logDrawer.description')"
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
              <span :class="item.color === 'success' ? 'text-emerald-600 font-medium' : item.color === 'error' ? 'text-red-600 font-medium' : item.color === 'warning' ? 'text-amber-600 font-medium' : item.color === 'info' ? 'text-sky-600 font-medium' : 'text-neutral-700 font-medium'">
                {{ item.title }}
              </span>
            </div>
          </template>
          <template #description="{ item }">
            <p class="text-neutral-700 whitespace-pre-wrap">{{ item.description }}</p>
            <div class="flex flex-wrap items-center gap-1.5 mt-1">
              <a
                v-for="att in item.attachments"
                :key="att.id"
                :href="att.url"
                target="_blank"
                rel="noopener"
                :title="att.originalName"
                class="text-neutral-500 hover:text-primary"
              >
                <UIcon name="i-lucide-paperclip" class="w-4 h-4" />
              </a>
            </div>
            <UUser
              v-if="item.user"
              :name="item.user.name"
              :avatar="item.user.avatar"
              size="xs"
              class="mt-1"
            />
            <div v-else class="flex items-center gap-2 mt-1">
              <UIcon name="i-lucide-monitor" class="w-4 h-4 text-neutral-400" />
              <span class="text-xs text-neutral-400 italic">{{ $t('component.inventory.logDrawer.system') }}</span>
            </div>
          </template>
        </UTimeline>

        <!-- Empty State -->
        <UEmpty
          v-else
          icon="i-lucide-history"
          :title="$t('component.inventory.logDrawer.noLogs')"
          :description="$t('component.inventory.logDrawer.noLogsDesc')"
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
          {{ $t('component.inventory.logDrawer.endOfHistory') }}
        </p>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { inventoryStockService } from '~/services/inventory-stock-service'
import type { InventoryStockMovement } from '~/types/inventory'

const { t } = useI18n()

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ inventoryId: number }>()

const logs = ref<InventoryStockMovement[]>([])
const isLoading = ref(false)
const scrollContainerRef = ref<HTMLElement | null>(null)

const meta = reactive({
  page: 1,
  perPage: 15,
  total: 0,
  lastPage: 1,
})

// Visual theme per movement type (mirrors the old Movements tab).
const typeMeta: Record<string, { label: string, color: string, icon: string }> = {
  entry: { label: 'entry', color: 'primary', icon: 'i-lucide-package-plus' },
  adjustment: { label: 'entry', color: 'neutral', icon: 'i-lucide-settings-2' },
  transfer_out: { label: 'transferOut', color: 'warning', icon: 'i-lucide-arrow-up-right' },
  transfer_in: { label: 'transferIn', color: 'info', icon: 'i-lucide-arrow-down-left' },
  assign_out: { label: 'assignOut', color: 'error', icon: 'i-lucide-user-check' },
  return_in: { label: 'returnIn', color: 'success', icon: 'i-lucide-undo-2' },
}

const timelineItems = computed(() =>
  logs.value.map((log) => {
    const m = typeMeta[log.type] || { label: log.type, color: 'neutral', icon: 'i-lucide-info' }
    const conditionLabel = log.condition === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used')
    const qty = log.quantity > 0 ? `+${log.quantity}` : `${log.quantity}`
    const parts = [
      log.variant?.name || '-',
      conditionLabel,
      `${qty} ${t('pages.inventory.monitor.quantity')}`,
      log.branch?.name ? `@ ${log.branch.name}` : '',
    ].filter(Boolean)
    return {
      title: t(`pages.inventory.movement.${m.label}`),
      description: `${parts.join(' · ')}${log.note ? `\n${log.note}` : ''}`,
      icon: m.icon,
      color: m.color,
      date: formatDate(log.createdAt),
      attachments: log.attachments || [],
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
  if (isOpen) resetAndFetch()
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
    const res = await inventoryStockService.getMovements(meta.page, meta.perPage, { inventoryId: props.inventoryId })
    if (res.success && res.data) {
      logs.value = meta.page === 1 ? res.data : [...logs.value, ...res.data]
      if (res.meta) {
        meta.total = res.meta.total
        meta.lastPage = Math.ceil(res.meta.total / meta.perPage)
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
