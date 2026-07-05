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
        :search-placeholder="$t('pages.asset.note.searchPlaceholder')"
        table-class="min-w-[600px]"
      >
        <template #actions v-if="hasPermission('asset-note:create')">
          <UButton
            class="w-full lg:w-auto justify-center"
            color="primary"
            variant="solid"
            icon="i-lucide-plus"
            @click="() => { showAddModal = true }"
          >
            {{ $t('pages.asset.note.addNote') }}
          </UButton>
        </template>
      </DataTable>

      <!-- Add Modal -->
      <AssetNoteAddModal
        v-model="showAddModal"
        :lock-asset-id="assetId"
        @created="fetchNotes"
      />

      <!-- Update Modal -->
      <AssetNoteUpdateModal
        v-model="showUpdateModal"
        :note="selectedNote"
        :lock-asset-id="assetId"
        @updated="fetchNotes"
      />

      <!-- Delete Modal -->
      <DeleteModal 
        v-model="showDeleteModal" 
        :title="$t('pages.asset.note.deleteTitle')" 
        :item-name="selectedNote?.note ? `note: '${selectedNote.note}'` : `note ID: ${selectedNote?.id}`" 
        :loading="isDeleting"
        @confirm="handleDelete" 
      />
    </div>
  </AssetDetailWrapper>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { assetNoteService } from '~/services/asset-note-service'
import type { AssetNote } from '~/types/asset-note'

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const assetId = Number(route.params.id)
const { hasPermission } = useAuth()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

// State
const data = ref<AssetNote[]>([])
const isLoadingLogs = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchNotes())

const selectedNote = ref<AssetNote | null>(null)
const showAddModal = ref(false)
const showUpdateModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)

// Pagination meta
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

// Fetch notes for this specific asset
const fetchNotes = async () => {
  isLoadingLogs.value = true
  try {
    const response = await assetNoteService.getAll(
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
const baseColumns: TableColumn<AssetNote>[] = [
  {
    accessorKey: 'date',
    header: sortHeader(t('pages.asset.note.columnNoteDate'), 'date'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-900 font-medium' }, row.original.date)
    }
  },
  {
    accessorKey: 'note',
    header: sortHeader(t('pages.asset.note.columnNotes'), 'note'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-600 truncate max-w-md block' }, row.original.note || '-')
    }
  },
  {
    id: 'attachments',
    header: t('pages.asset.note.columnAttachments'),
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
    header: sortHeader(t('pages.asset.note.columnCreatedBy'), 'createdBy'),
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
        return h('span', { class: 'text-neutral-500 italic text-sm' }, t('pages.asset.note.system'))
      }
    }
  }
]

const columns = computed(() => {
  const list = [...baseColumns]
  if (hasPermission('asset-note:update', 'asset-note:delete')) {
    list.push({
      id: 'actions',
      header: t('pages.asset.note.columnAction'),
      meta: {
        class: {
          td: 'text-right',
          th: 'text-right'
        }
      },
      cell: ({ row }) => {
        return h(
          UDropdownMenu,
          {
            content: { align: 'end' },
            items: getRowItems(row),
            'aria-label': 'Actions dropdown'
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              'aria-label': 'Actions dropdown'
            })
        )
      }
    })
  }
  return list
})

function getRowItems(row: Row<AssetNote>) {
  const actions = []
  if (hasPermission('asset-note:update')) {
    actions.push({
      label: t('pages.asset.note.editRecord'),
      icon: 'i-lucide-edit',
      onSelect() {
        selectedNote.value = row.original
        showUpdateModal.value = true
      }
    })
  }
  if (hasPermission('asset-note:delete')) {
    actions.push({
      label: t('pages.asset.note.deleteRecord'),
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedNote.value = row.original
        showDeleteModal.value = true
      }
    })
  }
  return actions
}

const toast = useToast()
const handleDelete = async () => {
  if (!selectedNote.value) return
  isDeleting.value = true
  try {
    const response = await assetNoteService.delete(selectedNote.value.id)
    if (response.success) {
      toast.add({
        title: t('pages.asset.note.deleteSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchNotes()
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  fetchNotes()
})
</script>
