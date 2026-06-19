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
        search-placeholder="Search notes..."
        table-class="min-w-[600px]"
      >
        <template #actions>
          <UButton
            color="primary"
            variant="solid"
            icon="i-lucide-map-pin"
            @click="showAddModal = true"
          >
            Relocate Asset
          </UButton>
        </template>
      </DataTable>

      <!-- Relocation Add Modal -->
      <AssetLocationAddModal
        v-model="showAddModal"
        :lock-asset-id="assetId"
        @created="fetchLocations"
      />
    </div>
  </AssetDetailWrapper>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { assetLocationService } from '~/services/asset-location-service'
import type { AssetLocation } from '~/types/asset-location'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const assetId = Number(route.params.id)

const UButton = resolveComponent('UButton')
const UAvatar = resolveComponent('UAvatar')

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
    header: sortHeader('Relocation Date', 'date'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-900 font-medium' }, row.original.date)
    }
  },
  {
    accessorKey: 'location',
    header: sortHeader('Location', 'location'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-900 font-medium' }, row.original.location?.name || '-')
    }
  },
  {
    accessorKey: 'note',
    header: 'Notes',
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600 truncate max-w-md block' }, row.original.note || '-')
    }
  },
  {
    accessorKey: 'createdBy',
    header: 'Created By',
    cell: ({ row }) => {
      const creator = row.original.createdBy
      if (creator) {
        return h('div', { class: 'flex items-center gap-2' }, [
          h(UAvatar, {
            src: creator.photo || undefined,
            alt: creator.name,
            size: 'xs',
            class: 'bg-primary-50 text-primary-700'
          }),
          h('span', { class: 'text-neutral-700 font-medium text-sm' }, creator.name)
        ])
      } else {
        return h('span', { class: 'text-neutral-500 italic text-sm' }, 'System')
      }
    }
  }
]
</script>
