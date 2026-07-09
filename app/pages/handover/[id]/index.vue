<template>
  <div class="space-y-6">
    <Header
      :title="handover ? `#${(handover.id)}` : $t('pages.assetHandover.detailTitle')"
      :description="$t('pages.assetHandover.detailDescription')"
    />

    <!-- Loading skeleton -->
    <UCard v-if="isLoading" class="w-full">
      <div class="w-full mb-4">
        <USkeleton class="h-8 w-20" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-5 space-y-4">
          <USkeleton v-for="i in 6" :key="i" class="h-12 w-full" />
        </div>
        <div class="lg:col-span-7 space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-24 w-full" />
        </div>
      </div>
    </UCard>

    <template v-else-if="handover">
      <!-- Top bar: back + actions -->
      <div class="w-full flex items-center justify-between gap-2">
        <UButton
          :label="$t('common.back')"
          to="/handover"
          color="neutral"
          icon="i-lucide-arrow-left"
          variant="link"
        />
        <UButton
          v-if="canCancel"
          :label="$t('pages.assetHandover.cancel')"
          color="warning"
          variant="soft"
          icon="i-lucide-ban"
          @click="() => { showCancelModal = true }"
        />
      </div>

      <!-- Main content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left: Document metadata + creator -->
        <div class="lg:col-span-5 space-y-6">
          <UCard>
            <template #header>
              <h2 class="text-sm font-bold text-neutral-800 uppercase tracking-wider">
                {{ $t('pages.assetHandover.docInfo') }}
              </h2>
            </template>

            <div class="space-y-4">
              <!-- Date -->
              <div>
                <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.assetHandover.form.date') }}</span>
                <span class="text-sm text-neutral-900 font-medium">{{ formatDateTime(handover.createdAt) }}</span>
              </div>

              <!-- Transaction Type -->
              <div>
                <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.assetHandover.form.transactionType') }}</span>
                <span class="text-sm text-neutral-900 font-medium">{{ $t(`pages.assetHandover.types.${handover.transactionType}`) }}</span>
              </div>

              <!-- Status -->
              <div>
                <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.assetHandover.columnStatus') }}</span>
                <UBadge :color="handoverStatusColor" variant="subtle" size="md">
                  {{ handoverStatusLabel }}
                </UBadge>
              </div>

              <!-- Handed Over By -->
              <div v-if="handover.handedOver">
                <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.assetHandover.form.handedOverBy') }}</span>
                <div class="flex items-center gap-2.5 p-2.5 border border-neutral-200 rounded-lg bg-neutral-50/50">
                  <UAvatar :src="handover.handedOver.photo || undefined" :alt="handover.handedOver.name" size="sm" class="ring-1 ring-primary/10" />
                  <div class="min-w-0 flex-1">
                    <span class="text-sm font-semibold text-neutral-800 block truncate">{{ handover.handedOver.name }}</span>
                    <span class="text-xs text-neutral-500 block mt-0.5 truncate">{{ handover.handedOver.jobPosition || '-' }} ({{ handover.handedOver.employeeId }})</span>
                  </div>
                </div>
              </div>

              <!-- Received By -->
              <div v-if="handover.received">
                <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.assetHandover.form.receivedBy') }}</span>
                <div class="flex items-center gap-2.5 p-2.5 border border-neutral-200 rounded-lg bg-neutral-50/50">
                  <UAvatar :src="handover.received.photo || undefined" :alt="handover.received.name" size="sm" class="ring-1 ring-primary/10" />
                  <div class="min-w-0 flex-1">
                    <span class="text-sm font-semibold text-neutral-800 block truncate">{{ handover.received.name }}</span>
                    <span class="text-xs text-neutral-500 block mt-0.5 truncate">{{ handover.received.jobPosition || '-' }} ({{ handover.received.employeeId }})</span>
                  </div>
                </div>
              </div>

              <!-- Note -->
              <div>
                <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.assetHandover.form.note') }}</span>
                <span class="text-sm text-neutral-900 font-medium whitespace-pre-line">{{ handover.note || '-' }}</span>
              </div>
            </div>
          </UCard>

          <!-- Creator Info -->
          <UCard>
            <template #header>
              <h2 class="text-sm font-bold text-neutral-800 uppercase tracking-wider">
                {{ $t('pages.assetHandover.columnCreatedBy') }}
              </h2>
            </template>

            <div class="flex items-center gap-3">
              <UAvatar :src="handover.createdBy?.photo || undefined" :alt="handover.createdBy?.name" size="md" class="ring-2 ring-primary/10" />
              <div class="min-w-0 flex-1">
                <span class="text-sm font-semibold text-neutral-800 block truncate">{{ handover.createdBy?.name || $t('common.system') }}</span>
                <span class="text-xs text-neutral-400 block mt-0.5">{{ formatDateTime(handover.createdAt) }}</span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Right: Items -->
        <div class="lg:col-span-7 space-y-6">
          <UCard>
            <template #header>
              <h2 class="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                <UIcon name="i-lucide-list" class="text-primary w-4 h-4" />
                {{ $t('pages.assetHandover.itemInfo') }}
              </h2>
            </template>

            <div class="space-y-4">
              <div
                v-for="item in handover.items"
                :key="item.id"
                class="border border-neutral-200 rounded-lg p-4 bg-neutral-50/30 flex flex-col gap-3"
              >
                <!-- Asset Info -->
                <div class="flex items-start gap-3">
                  <NuxtImg
                    v-if="item.asset?.image"
                    :src="item.asset.image"
                    :alt="item.asset?.name"
                    class="w-12 h-12 object-cover rounded-lg border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors shadow-2xs shrink-0"
                    @click="item.asset && openLightbox(item.asset.image)"
                  />
                  <div v-else class="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                    <UIcon name="i-lucide-box" class="w-5 h-5" />
                  </div>
                  <div class="min-w-0">
                    <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block leading-none">{{ $t('pages.assetHandover.itemForm.asset') }}</span>
                    <NuxtLink :to="`/asset/${item.asset?.id}`" class="text-sm font-bold text-neutral-800 hover:text-primary hover:underline block truncate mt-1">
                      {{ item.asset?.name || '-' }}
                    </NuxtLink>
                    <span class="text-xs font-semibold text-neutral-500 mt-0.5 block">{{ item.asset?.code || '-' }}</span>
                  </div>
                </div>

                <!-- Note -->
                <div v-if="item.note" class="text-xs text-neutral-600 bg-neutral-50 border border-neutral-100 rounded-lg p-2.5 flex items-start gap-2">
                  <UIcon name="i-lucide-info" class="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <span class="font-bold text-neutral-400 block uppercase tracking-wider text-xs mb-0.5">{{ $t('pages.assetHandover.itemForm.note') }}</span>
                    <span class="text-neutral-700 leading-relaxed whitespace-pre-line">{{ item.note }}</span>
                  </div>
                </div>
              </div>

              <!-- Empty items -->
              <div v-if="!handover.items.length" class="text-center text-sm text-neutral-400 py-8">
                {{ $t('common.noData') }}
              </div>
            </div>
          </UCard>

          <!-- Attachments -->
          <UCard>
            <template #header>
              <h2 class="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                <UIcon name="i-lucide-paperclip" class="text-primary w-4 h-4" />
                {{ $t('pages.assetHandover.attachments') }}
              </h2>
            </template>

            <div v-if="handover.attachments?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                v-for="att in handover.attachments"
                :key="att.id"
                :href="att.url"
                target="_blank"
                class="flex items-center gap-3 border border-neutral-200 rounded-lg p-3 bg-neutral-50/30 hover:border-primary hover:bg-primary/5 transition-colors min-w-0"
              >
                <div class="p-2 rounded-lg shrink-0" :class="getAttachmentTheme(att.mimeType).bg">
                  <UIcon :name="getAttachmentTheme(att.mimeType).icon" class="w-5 h-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <span class="text-sm font-medium text-neutral-800 block truncate">{{ att.originalName }}</span>
                  <span class="text-xs text-neutral-400 block mt-0.5">{{ formatFileSize(att.size) }}</span>
                </div>
                <UIcon name="i-lucide-download" class="w-4 h-4 text-neutral-400 shrink-0" />
              </a>
            </div>

            <div v-else class="text-center text-sm text-neutral-400 py-8">
              {{ $t('pages.assetHandover.noAttachments') }}
            </div>
          </UCard>
        </div>
      </div>
    </template>

    <!-- Cancel Confirmation Modal -->
    <HandoverCancelModal
      v-model="showCancelModal"
      :loading="isCancelling"
      @confirm="handleCancel"
    />

    <!-- Lightbox Modal -->
    <Lightbox />
  </div>
</template>

<script setup lang="ts">
import { assetHandoverService } from '~/services/asset-handover-service'
import type { AssetHandover } from '~/types/asset-handover'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const { t } = useI18n()
const toast = useToast()
const { openLightbox } = useLightbox()
const { hasPermission } = useAuth()

const handover = ref<AssetHandover | null>(null)
const isLoading = ref(true)

const showCancelModal = ref(false)
const isCancelling = ref(false)

// Only pending handovers can be cancelled; once approved it is locked.
const canCancel = computed(() =>
  handover.value?.status === 'pending' && hasPermission('asset-handover:cancel')
)

// Load document details
const fetchDetail = async () => {
  const id = Number(route.params.id)
  if (isNaN(id)) return
  isLoading.value = true
  try {
    const response = await assetHandoverService.getById(id)
    if (response.success && response.data) {
      handover.value = response.data
    } else {
      toast.add({ title: response.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    isLoading.value = false
  }
}

// Status badge visual decorations
const handoverStatusColor = computed<'warning' | 'success' | 'error' | 'neutral'>(() => {
  const s = handover.value?.status
  if (s === 'approve') return 'success'
  if (s === 'reject') return 'error'
  if (s === 'cancel') return 'neutral'
  return 'warning'
})

const handoverStatusLabel = computed(() => {
  const s = handover.value?.status
  if (s === 'approve') return t('pages.assetHandover.statusApprove')
  if (s === 'reject') return t('pages.assetHandover.statusReject')
  if (s === 'cancel') return t('pages.assetHandover.statusCancel')
  return t('pages.assetHandover.statusPending')
})

// Cancel a pending handover
const handleCancel = async () => {
  if (!handover.value) return
  isCancelling.value = true
  try {
    const response = await assetHandoverService.cancel(handover.value.id)
    if (response.success) {
      toast.add({ title: t('pages.assetHandover.cancelSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
      showCancelModal.value = false
      await fetchDetail()
    } else {
      toast.add({ title: response.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    isCancelling.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>
