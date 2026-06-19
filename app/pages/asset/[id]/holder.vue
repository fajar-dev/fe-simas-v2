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
        search-placeholder="Search assignment history..."
        table-class="min-w-[800px]"
      >
        <template #actions>
          <!-- Context-sensitive action button: Assign if available, Return if assigned -->
          <UButton
            v-if="!activeHolder"
            class="w-full lg:w-auto justify-center"
            color="primary"
            variant="solid"
            icon="i-lucide-user-plus"
            :loading="isLoadingActive"
            @click="showAssignModal = true"
          >
            Assign Asset
          </UButton>
          <UButton
            v-else
            class="w-full lg:w-auto justify-center"
            color="error"
            variant="solid"
            icon="i-lucide-arrow-left-right"
            :loading="isLoadingActive"
            @click="showReturnModal = true"
          >
            Return Asset
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

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const assetId = Number(route.params.id)

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
} = useTableQuery(() => fetchHistory(), 'createdAt', 'DESC')

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
    header: sortHeader('Employee', 'employee'),
    cell: ({ row }) => {
      const employee = row.original.employee
      if (!employee) return h('span', { class: 'text-neutral-500 italic' }, '-')
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UAvatar, {
          src: employee.photo || undefined,
          alt: employee.name,
          size: 'xs',
          class: 'bg-primary-50 text-primary-700'
        }),
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'text-neutral-900 dark:text-neutral-100 font-semibold text-sm' }, employee.name),
          h('span', { class: 'text-neutral-500 text-xs font-mono' }, employee.employeeId)
        ])
      ])
    }
  },
  {
    accessorKey: 'assignedDate',
    header: sortHeader('Assigned Date', 'assignedDate'),
    cell: ({ row }) => {
      return h('span', { class: 'text-neutral-900 dark:text-neutral-200 font-medium text-sm' }, row.original.assignedDate)
    }
  },
  {
    accessorKey: 'returnedDate',
    header: sortHeader('Status / Return Date', 'returnedDate'),
    cell: ({ row }) => {
      const returnedDate = row.original.returnedDate
      if (!returnedDate) {
        return h(UBadge, {
          color: 'success',
          variant: 'subtle',
          label: 'Active'
        })
      }
      return h('span', { class: 'text-neutral-600 dark:text-neutral-400 font-medium text-sm' }, returnedDate)
    }
  },
  {
    id: 'notes',
    header: 'Notes',
    cell: ({ row }) => {
      const assignNote = row.original.assignNote
      const returnNote = row.original.returnNote
      
      const elements = []
      if (assignNote) {
        elements.push(h('div', { class: 'text-xs text-neutral-600 dark:text-neutral-400' }, [
          h('span', { class: 'font-semibold text-neutral-400 dark:text-neutral-500 mr-1' }, 'Assign:'),
          assignNote
        ]))
      }
      if (returnNote) {
        elements.push(h('div', { class: 'text-xs text-neutral-600 dark:text-neutral-400 mt-1' }, [
          h('span', { class: 'font-semibold text-neutral-400 dark:text-neutral-500 mr-1' }, 'Return:'),
          returnNote
        ]))
      }
      
      if (elements.length === 0) {
        return h('span', { class: 'text-neutral-400 text-xs' }, '-')
      }
      
      return h('div', { class: 'max-w-xs' }, elements)
    }
  },
  {
    id: 'attachments',
    header: 'Attachments',
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
        { class: 'flex flex-wrap gap-1 max-w-[220px]' },
        attachments.map(att => {
          const theme = getAttachmentTheme(att.mimeType)
          return h(
            'a',
            {
              href: att.url,
              target: '_blank',
              class: 'cursor-pointer inline-block max-w-full'
            },
            [
              h(UBadge, {
                color: theme.color,
                variant: 'subtle',
                icon: theme.icon,
                label: att.originalName,
                size: 'xs',
                class: 'max-w-[130px] truncate'
              })
            ]
          )
        })
      )
    }
  },
  {
    id: 'handledBy',
    header: 'Handled By',
    cell: ({ row }) => {
      const creator = row.original.createdBy
      const returner = row.original.returnedBy
      const elements = []
      
      if (creator) {
        elements.push(h('div', { class: 'flex items-center gap-1.5' }, [
          h('span', { class: 'text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide' }, 'Assigned:'),
          h('span', { class: 'text-neutral-700 dark:text-neutral-300 text-xs font-medium' }, creator.name)
        ]))
      }
      if (returner) {
        elements.push(h('div', { class: 'flex items-center gap-1.5 mt-1' }, [
          h('span', { class: 'text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide' }, 'Returned:'),
          h('span', { class: 'text-neutral-700 dark:text-neutral-300 text-xs font-medium' }, returner.name)
        ]))
      }
      
      if (elements.length === 0) {
        return h('span', { class: 'text-neutral-400 text-xs' }, '-')
      }
      
      return h('div', { class: 'flex flex-col' }, elements)
    }
  }
]

onMounted(() => {
  fetchActiveHolder()
  fetchHistory()
})
</script>
