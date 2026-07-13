<template>
  <div class="space-y-6">
    <Header
      :title="handover ? `#${(handover.id)}` : $t('pages.handover.detailTitle')"
      :description="$t('pages.handover.detailDescription')"
    />

    <!-- Loading skeleton -->
    <UCard
      v-if="isLoading"
      class="w-full"
    >
      <div class="w-full mb-4">
        <USkeleton class="h-8 w-24" />
      </div>
      <div class="grid grid-cols-12 gap-x-8 gap-y-6">
        <div
          v-for="i in 8"
          :key="i"
          class="col-span-12 sm:col-span-6 md:col-span-4 space-y-2"
        >
          <USkeleton class="h-3 w-1/3" />
          <USkeleton class="h-5 w-3/4" />
        </div>
      </div>
    </UCard>

    <template v-else-if="handover">
      <!-- Document card -->
      <UCard class="w-full">
        <!-- Top bar: back + actions -->
        <div class="w-full mb-6 flex items-center justify-between">
          <UButton
            :label="$t('common.back')"
            to="/handover"
            color="neutral"
            icon="i-lucide-arrow-left"
            variant="link"
          />
          <UButton
            v-if="canCancel"
            :label="$t('pages.handover.cancel')"
            color="warning"
            variant="outline"
            icon="i-lucide-ban"
            @click="() => { showCancelModal = true }"
          />
        </div>

        <!-- Metadata grid -->
        <div class="grid grid-cols-12 gap-x-8 gap-y-6">
          <!-- Document No -->
          <div class="col-span-12 sm:col-span-6 md:col-span-4">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.handover.columnDocNo') }}</span>
            <div class="text-sm text-neutral-900 font-semibold">
              #{{ handover.id }}
            </div>
          </div>

          <!-- Type -->
          <div class="col-span-12 sm:col-span-6 md:col-span-4">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.handover.form.transactionType') }}</span>
            <div class="text-sm text-neutral-900 font-medium">
              {{ $t(`pages.handover.types.${handover.transactionType}`) }}
            </div>
          </div>

          <!-- Status -->
          <div class="col-span-12 sm:col-span-6 md:col-span-4">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.handover.columnStatus') }}</span>
            <UBadge
              :color="handoverStatusColor"
              variant="subtle"
              size="md"
            >
              {{ handoverStatusLabel }}
            </UBadge>
          </div>

          <!-- Date -->
          <div class="col-span-12 sm:col-span-6 md:col-span-4">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.handover.form.date') }}</span>
            <div class="text-sm text-neutral-900 font-medium">
              {{ formatDateTime(handover.createdAt) }}
            </div>
          </div>

          <!-- Parent (origin) handover for a return -->
          <div
            v-if="handover.parentHandover"
            class="col-span-12 sm:col-span-6 md:col-span-4"
          >
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.handover.parentHandover') }}</span>
            <NuxtLink
              :to="`/handover/${handover.parentHandover.id}`"
              class="text-sm font-semibold text-primary hover:underline"
            >#{{ handover.parentHandover.id }}</NuxtLink>
          </div>

          <!-- Handed Over By -->
          <div class="col-span-12 sm:col-span-6 md:col-span-4">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.handover.form.handedOverBy') }}</span>
            <div
              v-if="handover.handedOver"
              class="flex items-center gap-2 min-w-0"
            >
              <UAvatar
                :src="handover.handedOver.photo || undefined"
                :alt="handover.handedOver.name"
                class="bg-primary-50 text-primary-700 shrink-0"
                loading="lazy"
              />
              <div class="flex flex-col min-w-0">
                <span
                  class="text-sm text-neutral-900 font-medium leading-tight truncate"
                  :title="handover.handedOver.name"
                >{{ handover.handedOver.name }}</span>
                <span class="text-xs text-neutral-500 leading-tight truncate">{{ handover.handedOver.jobPosition || handover.handedOver.employeeId }}</span>
              </div>
            </div>
            <span
              v-else
              class="text-sm text-neutral-500"
            >-</span>
          </div>

          <!-- Received By -->
          <div class="col-span-12 sm:col-span-6 md:col-span-4">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.handover.form.receivedBy') }}</span>
            <div
              v-if="handover.received"
              class="flex items-center gap-2 min-w-0"
            >
              <UAvatar
                :src="handover.received.photo || undefined"
                :alt="handover.received.name"
                class="bg-primary-50 text-primary-700 shrink-0"
                loading="lazy"
              />
              <div class="flex flex-col min-w-0">
                <span
                  class="text-sm text-neutral-900 font-medium leading-tight truncate"
                  :title="handover.received.name"
                >{{ handover.received.name }}</span>
                <span class="text-xs text-neutral-500 leading-tight truncate">{{ handover.received.jobPosition || handover.received.employeeId }}</span>
              </div>
            </div>
            <span
              v-else
              class="text-sm text-neutral-500"
            >-</span>
          </div>

          <!-- Created By -->
          <div class="col-span-12 sm:col-span-6 md:col-span-4">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.handover.columnCreatedBy') }}</span>
            <div class="flex items-center gap-2 min-w-0">
              <UAvatar
                :src="handover.createdBy?.photo || undefined"
                :alt="handover.createdBy?.name || 'System'"
                class="bg-primary-50 text-primary-700 shrink-0"
                loading="lazy"
              />
              <span
                class="text-sm text-neutral-900 font-medium truncate"
                :title="handover.createdBy?.name || $t('common.system')"
              >{{ handover.createdBy?.name || $t('common.system') }}</span>
            </div>
          </div>

          <!-- Note (full width) -->
          <div class="col-span-12 pt-4 border-t border-neutral-100">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ $t('pages.handover.form.note') }}</span>
            <div class="text-sm text-neutral-700 whitespace-pre-line">
              {{ handover.note || '-' }}
            </div>
          </div>

          <!-- Custom fields snapshot -->
          <div
            v-for="field in handover.customFields"
            :key="field.key"
            class="col-span-12 sm:col-span-6 md:col-span-4"
          >
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">{{ field.label }}</span>
            <div class="text-sm text-neutral-900 font-medium">{{ field.value || '-' }}</div>
          </div>

          <!-- Attachments (full width) -->
          <div
            v-if="handover.attachments?.length"
            class="col-span-12 pt-4 border-t border-neutral-100"
          >
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">{{ $t('pages.handover.attachments') }}</span>
            <div class="flex flex-wrap gap-2">
              <a
                v-for="att in handover.attachments"
                :key="att.id"
                :href="att.url"
                target="_blank"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors text-sm text-neutral-700 hover:text-neutral-900 no-underline"
              >
                <UIcon
                  :name="getAttachmentTheme(att.mimeType).icon"
                  class="w-4 h-4 text-primary shrink-0"
                />
                <span class="truncate max-w-48">{{ att.originalName }}</span>
                <span class="text-xs text-neutral-400 shrink-0">{{ formatFileSize(att.size) }}</span>
              </a>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Items card -->
      <UCard class="w-full">
        <div class="w-full mb-4">
          <h4 class="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <UIcon
              name="i-lucide-boxes"
              class="w-3.5 h-3.5"
            />
            {{ $t('pages.handover.itemInfo') }}
            <span class="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full font-medium normal-case tracking-normal">{{ handover.itemKind === 'stock' ? handover.stockItems.length : handover.items.length }}</span>
          </h4>
        </div>

        <!-- Asset items -->
        <div v-if="handover.itemKind !== 'stock'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="item in handover.items"
            :key="item.id"
            class="border border-neutral-200 rounded-lg p-3 flex flex-col gap-2.5"
          >
            <div class="flex items-start gap-3">
              <NuxtImg
                v-if="item.asset?.image"
                :src="item.asset.image"
                :alt="item.asset?.name"
                class="w-11 h-11 object-cover rounded-lg border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors shrink-0"
                @click="item.asset && openLightbox(item.asset.image)"
              />
              <div
                v-else
                class="w-11 h-11 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0"
              >
                <UIcon
                  name="i-lucide-box"
                  class="w-5 h-5"
                />
              </div>
              <div class="min-w-0 flex-1">
                <NuxtLink
                  :to="`/asset/${item.asset?.id}`"
                  class="text-sm font-semibold text-neutral-900 hover:text-primary hover:underline block truncate"
                >
                  {{ item.asset?.name || '-' }}
                </NuxtLink>
                <span class="text-xs text-neutral-500 mt-0.5 block truncate">{{ item.asset?.code || '-' }}</span>
              </div>
            </div>

            <div
              v-if="item.note"
              class="text-xs text-neutral-600 bg-neutral-50 border border-neutral-100 rounded-lg p-2 whitespace-pre-line"
            >
              {{ item.note }}
            </div>
          </div>

          <div
            v-if="!handover.items.length"
            class="col-span-full text-center text-sm text-neutral-400 py-8"
          >
            {{ $t('common.noData') }}
          </div>
        </div>

        <!-- Stock items -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="item in handover.stockItems"
            :key="item.id"
            class="border border-neutral-200 rounded-lg p-3 flex flex-col gap-2.5"
          >
            <div class="flex items-start gap-3">
              <div class="w-11 h-11 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-layers" class="w-5 h-5" />
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-sm font-semibold text-neutral-900 block truncate">{{ item.variant?.inventory?.name || '-' }} — {{ item.variant?.name || '-' }}</span>
                <span class="text-xs text-neutral-500 mt-0.5 block truncate">
                  {{ item.branch?.name || '-' }} ·
                  <UBadge :color="item.condition === 'new' ? 'success' : 'warning'" variant="subtle" size="sm">
                    {{ item.condition === 'new' ? $t('pages.inventory.condition.new') : $t('pages.inventory.condition.used') }}
                  </UBadge>
                  · {{ item.quantity }} {{ item.variant?.unit || '' }}
                </span>
              </div>
            </div>

            <div
              v-if="item.note"
              class="text-xs text-neutral-600 bg-neutral-50 border border-neutral-100 rounded-lg p-2 whitespace-pre-line"
            >
              {{ item.note }}
            </div>
          </div>

          <div
            v-if="!handover.stockItems.length"
            class="col-span-full text-center text-sm text-neutral-400 py-8"
          >
            {{ $t('common.noData') }}
          </div>
        </div>
      </UCard>
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
import { handoverService } from '~/services/handover-service'
import type { Handover } from '~/types/handover'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const { t } = useI18n()
const toast = useToast()
const { openLightbox } = useLightbox()
const { hasPermission } = useAuth()

const handover = ref<Handover | null>(null)
const isLoading = ref(true)

const showCancelModal = ref(false)
const isCancelling = ref(false)

// Only pending handovers can be cancelled; once approved it is locked.
const canCancel = computed(() =>
  handover.value?.status === 'pending' && hasPermission('handover:cancel')
)

// Load document details
const fetchDetail = async () => {
  const id = Number(route.params.id)
  if (isNaN(id)) return
  isLoading.value = true
  try {
    const response = await handoverService.getById(id)
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
  if (s === 'approve') return t('pages.handover.statusApprove')
  if (s === 'reject') return t('pages.handover.statusReject')
  if (s === 'cancel') return t('pages.handover.statusCancel')
  return t('pages.handover.statusPending')
})

// Cancel a pending handover
const handleCancel = async () => {
  if (!handover.value) return
  isCancelling.value = true
  try {
    const response = await handoverService.cancel(handover.value.id)
    if (response.success) {
      toast.add({ title: t('pages.handover.cancelSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
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
