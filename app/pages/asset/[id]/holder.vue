<template>
  <AssetDetailWrapper v-slot="{ asset: parentAsset, isLoading: parentLoading }">
    <div class="space-y-6">
      
      <!-- Loading Skeleton for Status Card -->
      <UCard v-if="parentLoading || isLoadingActive" class="w-full">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <USkeleton class="w-16 h-16 rounded-full" />
            <div class="space-y-2">
              <USkeleton class="h-4 w-32" />
              <USkeleton class="h-3 w-48" />
            </div>
          </div>
          <USkeleton class="h-10 w-32 rounded-lg" />
        </div>
      </UCard>

      <!-- Active Holder Banner / Card -->
      <div v-else>
        <!-- Case 1: Actively Assigned -->
        <UCard 
          v-if="activeHolder" 
          class="w-full border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-50/30 to-white dark:from-primary-950/10 dark:to-neutral-900 shadow-sm"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-start gap-4">
              <UAvatar
                :src="activeHolder.employee?.photo || undefined"
                :alt="activeHolder.employee?.name"
                size="lg"
                class="bg-primary-100 text-primary-800 border-2 border-primary-200 shadow-sm w-16 h-16"
              />
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-bold tracking-wider uppercase bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 px-2 py-0.5 rounded">
                    Currently Assigned
                  </span>
                  <span class="text-xs text-neutral-500 font-mono">
                    ID: {{ activeHolder.employee?.employeeId }}
                  </span>
                </div>
                <h3 class="text-lg font-bold text-neutral-900 dark:text-white">
                  {{ activeHolder.employee?.name }}
                </h3>
                <p class="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  {{ activeHolder.employee?.jobPosition }}
                </p>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 pt-1">
                  <span class="flex items-center gap-1">
                    <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
                    Assigned: <strong class="text-neutral-700 dark:text-neutral-200">{{ activeHolder.assignedDate }}</strong>
                  </span>
                  <span v-if="activeHolder.createdBy" class="flex items-center gap-1">
                    <UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
                    By: <strong class="text-neutral-700 dark:text-neutral-200">{{ activeHolder.createdBy.name }}</strong>
                  </span>
                </div>
                <!-- Assign Note -->
                <p v-if="activeHolder.assignNote" class="text-xs italic text-neutral-500 mt-2 bg-white/60 dark:bg-black/20 p-2 rounded border border-neutral-100 dark:border-neutral-800 max-w-xl">
                  "{{ activeHolder.assignNote }}"
                </p>
                <!-- Attachments -->
                <div v-if="activeHolder.attachments && activeHolder.attachments.length > 0" class="flex flex-wrap gap-1.5 pt-2">
                  <a 
                    v-for="att in activeHolder.attachments" 
                    :key="att.id"
                    :href="att.url" 
                    target="_blank"
                    class="hover:opacity-85 transition-opacity"
                  >
                    <UBadge size="xs" color="neutral" variant="subtle" icon="i-lucide-paperclip">
                      {{ att.originalName }}
                    </UBadge>
                  </a>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-2 self-start md:self-center">
              <UButton
                color="error"
                variant="solid"
                icon="i-lucide-arrow-left-right"
                size="lg"
                class="shadow-sm font-semibold"
                @click="showReturnModal = true"
              >
                Return Asset
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Case 2: In Inventory (Unassigned) -->
        <UCard 
          v-else 
          class="w-full border-l-4 border-l-success-500 bg-gradient-to-r from-success-50/30 to-white dark:from-success-950/10 dark:to-neutral-900 shadow-sm"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-full bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300">
                <UIcon name="i-lucide-package-check" class="w-8 h-8" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold tracking-wider uppercase bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300 px-2 py-0.5 rounded">
                    Available
                  </span>
                </div>
                <h3 class="text-lg font-bold text-neutral-900 dark:text-white mt-1">
                  Asset in Inventory
                </h3>
                <p class="text-sm text-neutral-500">
                  This asset is ready to be assigned to an employee.
                </p>
              </div>
            </div>
            <div>
              <UButton
                color="primary"
                variant="solid"
                icon="i-lucide-user-plus"
                size="lg"
                class="shadow-sm font-semibold"
                @click="showAssignModal = true"
              >
                Assign Asset
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- History Log Table Section -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 px-1">
          <UIcon name="i-lucide-history" class="w-5 h-5 text-neutral-500" />
          <h3 class="text-md font-bold text-neutral-900 dark:text-white">Assignment & Return History</h3>
        </div>

        <DataTable
          v-model:search="search"
          v-model:page="page"
          v-model:perPage="perPage"
          :data="historyData"
          :columns="columns"
          :loading="isLoadingHistory"
          :from="meta.from"
          :to="meta.to"
          :total="meta.total"
          search-placeholder="Search history by notes, employee..."
          table-class="min-w-[800px]"
        />
      </div>

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
          class: 'bg-primary-50 text-primary-700 shadow-xs'
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
