<template>
  <AssetDetailWrapper v-slot="{ asset, isLoading }">
    <div class="space-y-4">
      <DataTable
        v-model:search="search"
        v-model:page="page"
        v-model:perPage="perPage"
        :data="data"
        :columns="columns"
        :loading="isLoadingLogs"
        :from="meta.from"
        :to="meta.to"
        :total="meta.total"
        :search-placeholder="$t('pages.asset.location.searchPlaceholder')"
        table-class="min-w-[600px]"
      >
        <template #actions v-if="hasPermission('asset-location:create')">
          <UButton
            class="w-full lg:w-auto justify-center"
            color="primary"
            variant="solid"
            icon="i-lucide-map-pin"
            @click="showAddModal = true"
          >
            {{ $t('pages.asset.location.relocateAsset') }}
          </UButton>
        </template>
      </DataTable>

      <!-- Relocation Add Modal -->
      <AssetLocationAddModal
        v-model="showAddModal"
        :lock-asset-id="assetId"
        :exclude-location-id="asset?.lastLocation?.location?.id"
        @created="fetchLocations"
      />
    </div>
  </AssetDetailWrapper>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { assetLocationService } from '~/services/asset-location-service'
import type { AssetLocation } from '~/types/asset-location'

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const assetId = Number(route.params.id)
const { hasPermission } = useAuth()

const UButton = resolveComponent('UButton')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

// State
const data = ref<AssetLocation[]>([])
const isLoadingLogs = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchLocations())

const showAddModal = ref(false)

// Pagination meta
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

// Fetch relocation logs for this specific asset
const fetchLocations = async () => {
  isLoadingLogs.value = true
  try {
    const response = await assetLocationService.getAll(
      page.value,
      perPage.value,
      search.value,
      sortBy.value,
      order.value,
      assetId
    )
    if (response.success && response.data) {
      data.value = response.data
      if (response.meta) {
        meta.total = response.meta.total
        meta.from = response.meta.from
        meta.to = response.meta.to
      }
    }
  } finally {
    isLoadingLogs.value = false
  }
}

// Table columns
const columns: TableColumn<AssetLocation>[] = [
  {
    accessorKey: 'date',
    header: sortHeader(t('pages.asset.location.columnRelocationDate'), 'date'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-900 font-medium' }, formatDate(row.original.date || ''))
    }
  },
  {
    accessorKey: 'source',
    header: t('pages.asset.location.columnSource'),
    cell: ({ row }) => {
      const source = row.original.source
      return h(UBadge, {
        color: source === 'ble' ? 'primary' : 'neutral',
        variant: 'subtle',
        size: 'xs',
        label: source === 'ble' ? 'BLE' : t('pages.asset.location.manualSource')
      })
    }
  },
  {
    accessorKey: 'location',
    header: sortHeader(t('pages.asset.location.columnLocation'), 'location'),
    cell: ({ row }) => {
      const location = row.original.location
      if (!location) {
        return h('span', { class: 'text-neutral-900 font-medium' }, '-')
      }
      const locName = location.name
      const branchName = location.branch?.name
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h('span', { class: 'text-neutral-900 font-semibold' }, locName),
        branchName ? h('span', { class: 'text-xs text-neutral-500' }, branchName) : null
      ])
    }
  },
  {
    accessorKey: 'note',
    header: sortHeader(t('pages.asset.location.columnNotes'), 'note'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600 truncate max-w-md block' }, row.original.note || '-')
    }
  },
  {
    id: 'attachments',
    header: t('pages.asset.location.columnAttachments'),
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

      // Render clickable mini badges for each attachment
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
    header: sortHeader(t('pages.asset.location.columnCreatedBy'), 'createdBy'),
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
        return h('span', { class: 'text-neutral-500 italic text-sm' }, t('pages.asset.location.system'))
      }
    }
  }
]

onMounted(() => {
  fetchLocations()
})
</script>
