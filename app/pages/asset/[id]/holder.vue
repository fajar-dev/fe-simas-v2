<template>
  <AssetDetailWrapper v-slot="{ asset: parentAsset, isLoading: parentLoading }">
    <div class="space-y-4">
      <DataTable
        v-model:search="search"
        v-model:page="page"
        v-model:perPage="perPage"
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
          <UButton
            v-if="!activeHolder && hasPermission('asset-holder:create')"
            class="w-full lg:w-auto justify-center"
            color="primary"
            variant="solid"
            icon="i-lucide-user-plus"
            :loading="isLoadingActive"
            @click="showAssignModal = true"
          >
            {{ $t('pages.asset.holder.assignAsset') }}
          </UButton>
          <UButton
            v-if="activeHolder && hasPermission('asset-holder:return')"
            class="w-full lg:w-auto justify-center"
            color="error"
            variant="solid"
            icon="i-lucide-arrow-left-right"
            :loading="isLoadingActive"
            @click="showReturnModal = true"
          >
            {{ $t('pages.asset.holder.returnAsset') }}
          </UButton>
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

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

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

      const getAttachmentTheme = (mimeType: string) => {
        if (!mimeType) return { icon: 'i-lucide-file', color: 'neutral' as const }
        const type = mimeType.toLowerCase()
        if (type.startsWith('image/')) return { icon: 'i-lucide-image', color: 'success' as const }
        if (type.includes('pdf')) return { icon: 'i-lucide-file-text', color: 'error' as const }
        if (type.includes('word') || type.includes('officedocument') || type.includes('excel') || type.includes('sheet') || type.includes('powerpoint') || type.includes('presentation')) return { icon: 'i-lucide-file-text', color: 'primary' as const }
        if (type.includes('zip') || type.includes('rar') || type.includes('compressed') || type.includes('tar') || type.includes('gzip')) return { icon: 'i-lucide-archive', color: 'warning' as const }
        return { icon: 'i-lucide-file', color: 'neutral' as const }
      }

      return h(
        'div',
        { class: 'flex flex-wrap gap-2 max-w-sm' },
        attachments.map(att => {
          const theme = getAttachmentTheme(att.mimeType)
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
})
</script>
