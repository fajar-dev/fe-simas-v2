<template>
  <AssetDetailWrapper v-slot="{ asset: parentAsset, isLoading: parentLoading }">
    <div class="space-y-4">
      <DataTable
        v-model:search="search"
        v-model:page="page"
        v-model:per-page="perPage"
        :data="historyData"
        :columns="columns"
        :loading="isLoadingHistory || isLoadingActive"
        :from="meta.from"
        :to="meta.to"
        :total="meta.total"
        :search-placeholder="$t('pages.asset.holder.searchPlaceholder')"
        table-class="min-w-[800px]"
      >
        <template #actions>
          <!-- Context-sensitive action button: Assign if available, Return if assigned -->
          <UTooltip
            v-if="!activeHolder && hasPermission('asset-holder:create')"
            :text="assignDisabledReason"
            :prevent="!isAssignDisabled"
          >
            <UButton
              class="w-full lg:w-auto justify-center"
              color="primary"
              variant="solid"
              icon="i-lucide-user-plus"
              :loading="isLoadingActive || isLoadingPendingHandover"
              :disabled="isAssignDisabled"
              @click="() => { showAssignModal = true }"
            >
              {{ $t('pages.asset.holder.assignAsset') }}
            </UButton>
          </UTooltip>
          <UTooltip
            v-if="activeHolder && hasPermission('asset-holder:return')"
            :text="$t('component.assetStatus.handoverReturnWarning.returnAsset')"
            :prevent="!isManualReturnDisabled"
          >
            <UButton
              class="w-full lg:w-auto justify-center"
              color="error"
              variant="solid"
              icon="i-lucide-arrow-left-right"
              :loading="isLoadingActive"
              :disabled="isManualReturnDisabled"
              @click="() => { showReturnModal = true }"
            >
              {{ $t('pages.asset.holder.returnAsset') }}
            </UButton>
          </UTooltip>
        </template>
      </DataTable>

      <!-- Modals -->
      <AssignModal
        v-model="showAssignModal"
        :lock-asset-id="assetId"
        @created="handleReload"
      />

      <ReturnModal
        v-model="showReturnModal"
        :active-holder="activeHolder"
        @returned="handleReload"
      />
    </div>
  </AssetDetailWrapper>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { assetHolderService } from '~/services/asset-holder-service'
import { handoverService } from '~/services/handover-service'
import type { AssetHolder } from '~/types/asset-holder'
import AssignModal from '~/components/asset-holder/AssignModal.vue'
import ReturnModal from '~/components/asset-holder/ReturnModal.vue'

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const assetId = Number(route.params.id)
const { hasPermission } = useAuth()

// Inject parent asset state to check last status
const { asset: parentAssetRef } = inject('assetState') as { asset: Ref<import('~/types/asset').Asset | null> }
const isAssetNotActive = computed(() => {
  const status = parentAssetRef.value?.lastStatus?.status
  return !!status && status !== 'active'
})

// Assets tied to a pending handover cannot be assigned a holder (also enforced by the backend).
const isInPendingHandover = ref(false)
const isLoadingPendingHandover = ref(false)

const isAssignDisabled = computed(() => isAssetNotActive.value || isInPendingHandover.value)
const assignDisabledReason = computed(() => {
  if (isAssetNotActive.value) return t('component.assetStatus.notActiveWarning.assignHolder')
  if (isInPendingHandover.value) return t('component.assetStatus.pendingHandoverWarning.assignHolder')
  return ''
})

// Holders created from an assign handover must be returned via a return handover, not manually.
const isManualReturnDisabled = computed(() => !!activeHolder.value?.assignHandover)

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const NuxtLink = resolveComponent('NuxtLink')

// State
const activeHolder = ref<AssetHolder | null>(null)
const historyData = ref<AssetHolder[]>([])
const isLoadingActive = ref(false)
const isLoadingHistory = ref(false)

const showAssignModal = ref(false)
const showReturnModal = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchHistory(), { defaultSortBy: 'createdAt', defaultOrder: 'DESC' })

// Pagination meta
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

// Fetch active holder
const fetchActiveHolder = async () => {
  isLoadingActive.value = true
  try {
    const res = await assetHolderService.getActiveHolder(assetId)
    if (res.success) {
      activeHolder.value = res.data
    }
  } finally {
    isLoadingActive.value = false
  }
}

// Check whether this asset is part of a pending handover (blocks holder assignment)
const fetchPendingHandover = async () => {
  isLoadingPendingHandover.value = true
  try {
    const res = await handoverService.getAll(1, 200, '', '', '', 'pending')
    if (res.success && res.data) {
      isInPendingHandover.value = res.data.some(h => h.items.some(item => item.asset?.id === assetId))
    }
  } finally {
    isLoadingPendingHandover.value = false
  }
}

// Fetch holder logs (history) for this asset
const fetchHistory = async () => {
  isLoadingHistory.value = true
  try {
    const res = await assetHolderService.getAll(
      page.value,
      perPage.value,
      search.value,
      sortBy.value,
      order.value,
      assetId
    )
    if (res.success && res.data) {
      historyData.value = res.data
      if (res.meta) {
        meta.total = res.meta.total
        meta.from = res.meta.from
        meta.to = res.meta.to
      }
    }
  } finally {
    isLoadingHistory.value = false
  }
}

const handleReload = () => {
  fetchActiveHolder()
  fetchHistory()
  fetchPendingHandover()
}

// Table columns
const columns: TableColumn<AssetHolder>[] = [
  {
    accessorKey: 'employee',
    header: sortHeader(t('pages.asset.holder.columnEmployee'), 'employee'),
    cell: ({ row }) => {
      const employee = row.original.employee
      if (!employee) return h('span', { class: 'text-neutral-500 italic' }, '-')
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UAvatar, {
          src: employee.photo || undefined,
          alt: employee.name,
          class: 'bg-primary-50 text-primary-700',
          loading: 'lazy'
        }),
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'text-neutral-900 font-semibold text-sm' }, employee.name),
          h('span', { class: 'text-neutral-500 text-xs' }, employee.employeeId)
        ])
      ])
    }
  },
  {
    id: 'source',
    header: t('pages.asset.holder.columnSource'),
    cell: ({ row }) => {
      const handover = row.original.assignHandover
      if (handover) {
        return h(
          NuxtLink,
          { to: `/handover/${handover.id}` },
          () => h(UBadge, {
            color: 'primary',
            variant: 'subtle',
            icon: 'i-lucide-arrow-left-right',
            label: t('pages.asset.holder.handoverSource'),
            class: 'cursor-pointer'
          })
        )
      }
      return h(UBadge, {
        color: 'neutral',
        variant: 'subtle',
        label: t('pages.asset.holder.manualSource')
      })
    }
  },
  {
    accessorKey: 'assignedDate',
    header: sortHeader(t('pages.asset.holder.columnAssignedDate'), 'assignedDate'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-900 font-medium' }, formatDate(row.original.assignedDate || ''))
    }
  },
  {
    accessorKey: 'returnedDate',
    header: sortHeader(t('pages.asset.holder.columnReturnDate'), 'returnedDate'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-900 font-medium' }, formatDate(row.original.returnedDate || ''))
    }
  },
  {
    accessorKey: 'notes',
    header: sortHeader(t('pages.asset.holder.columnNotes'), 'notes'),
    cell: ({ row }) => {
      const notes = [
        row.original.assignNote ? `${t('pages.asset.holder.assignPrefix')}${row.original.assignNote}` : null,
        row.original.returnNote ? `${t('pages.asset.holder.returnPrefix')}${row.original.returnNote}` : null
      ].filter(Boolean).join(' | ')
      return h('span', { class: 'text-neutral-600 truncate max-w-md block' }, notes || '-')
    }
  },
  {
    id: 'attachments',
    header: t('pages.asset.holder.columnAttachments'),
    cell: ({ row }) => {
      const attachments = row.original.attachments || []
      if (attachments.length === 0) return h('span', { class: 'text-neutral-400 text-xs' }, '-')

      return h(
        'div',
        { class: 'flex flex-wrap gap-2 max-w-sm' },
        attachments.map((att) => {
          const theme = getAttachmentBadgeTheme(att.mimeType)
          return h(
            'a',
            {
              href: att.url,
              target: '_blank',
              class: 'cursor-pointer inline-block max-w-[160px]'
            },
            [
              h(UBadge, {
                color: theme.color,
                variant: 'subtle',
                icon: theme.icon,
                label: att.originalName,
                class: 'max-w-full truncate'
              })
            ]
          )
        })
      )
    }
  },
  {
    accessorKey: 'createdBy',
    header: sortHeader(t('pages.asset.holder.columnAssignBy'), 'createdBy'),
    cell: ({ row }) => {
      const creator = row.original.createdBy
      if (creator) {
        return h('div', { class: 'flex items-center gap-2' }, [
          h(UAvatar, {
            src: creator.photo || undefined,
            alt: creator.name,
            size: 'xs',
            class: 'bg-primary-50 text-primary-700',
            loading: 'lazy'
          }),
          h('span', { class: 'text-neutral-700 font-medium text-sm' }, creator.name)
        ])
      } else {
        return h('span', { class: 'text-neutral-500 italic text-sm' }, t('pages.asset.holder.system'))
      }
    }
  },
  {
    accessorKey: 'returnedBy',
    header: sortHeader(t('pages.asset.holder.columnReturnBy'), 'returnedBy'),
    cell: ({ row }) => {
      const returner = row.original.returnedBy
      if (returner) {
        return h('div', { class: 'flex items-center gap-2' }, [
          h(UAvatar, {
            src: returner.photo || undefined,
            alt: returner.name,
            size: 'xs',
            class: 'bg-primary-50 text-primary-700',
            loading: 'lazy'
          }),
          h('span', { class: 'text-neutral-700 font-medium text-sm' }, returner.name)
        ])
      } else {
        return h('span', { class: 'text-neutral-400 text-sm' }, '-')
      }
    }
  }
]

onMounted(() => {
  fetchActiveHolder()
  fetchHistory()
  fetchPendingHandover()
})
</script>
