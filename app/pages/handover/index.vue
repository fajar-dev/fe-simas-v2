<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header with Breadcrumbs and Title -->
    <Header
      :title="$t('pages.handover.title')"
      :description="$t('pages.handover.description')"
    >
      <template #breadcrumbs>
        <div class="flex items-center gap-2 text-xs text-neutral-500 mb-2 select-none">
          <NuxtLink to="/" class="hover:text-primary transition-colors">Dashboard</NuxtLink>
          <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 text-neutral-400" />
          <span class="font-medium text-neutral-700">{{ $t('nav.handover') }}</span>
        </div>
      </template>
    </Header>

    <!-- Main List Controls & Table -->
    <DataTable
      v-model:search="search"
      v-model:page="page"
      v-model:perPage="perPage"
      :data="data"
      :columns="columns"
      :loading="isLoading"
      :from="meta.from"
      :to="meta.to"
      :total="meta.total"
      :search-placeholder="$t('pages.handover.searchPlaceholder')"
      table-class="min-w-[1000px]"
    >
      <!-- Filter slots -->
      <template #filters>
        <div class="flex flex-col sm:flex-row items-center gap-2 w-full">
          <!-- Status Filter -->
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            class="w-full sm:w-48"
          />

          <!-- Transaction Type Filter -->
          <USelect
            v-model="typeFilter"
            :items="typeOptions"
            class="w-full sm:w-48"
          />
        </div>
      </template>

      <!-- Actions slot -->
      <template #actions v-if="hasPermission('handover:create') || hasPermission('handover-field:manage')">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UTooltip v-if="hasPermission('handover-field:manage')" :text="$t('pages.handover.fieldSettings.title')">
            <UButton
              color="neutral"
              variant="subtle"
              icon="i-lucide-settings"
              square
              aria-label="Custom fields"
              @click="() => { showFieldSettings = true }"
            />
          </UTooltip>
          <UButton
            v-if="hasPermission('handover:create')"
            color="primary"
            variant="solid"
            icon="i-lucide-plus"
            to="/handover/create"
            class="flex-1 sm:flex-none justify-center shadow-sm hover:shadow-md transition-all duration-200"
          >
            {{ $t('pages.handover.addHandover') }}
          </UButton>
        </div>
      </template>
    </DataTable>

    <!-- Custom Field Settings Modal -->
    <HandoverFieldSettingsModal v-model="showFieldSettings" />

    <!-- Cancel Confirmation Modal -->
    <HandoverCancelModal
      v-model="showCancelModal"
      :loading="isCancelling"
      @confirm="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { handoverService } from '~/services/handover-service'
import type { Handover } from '~/types/handover'

definePageMeta({
  layout: 'dashboard'
})

const { t } = useI18n()
const { hasPermission } = useAuth()
const toast = useToast()

// Resolve required Nuxt UI components for programmatic template cell rendering
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

// Query & filter states
const data = ref<Handover[]>([])
const isLoading = ref(false)

const statusFilter = ref('all')
const typeFilter = ref('all')

watch([statusFilter, typeFilter], () => {
  page.value = 1
  fetchHandovers()
})

const statusOptions = computed(() => [
  { label: t('common.all'), value: 'all' },
  ...HANDOVER_STATUSES.map(s => ({
    label: t(`pages.handover.status${s.charAt(0).toUpperCase()}${s.slice(1)}`),
    value: s
  }))
])

const typeOptions = computed(() => [
  { label: t('common.all'), value: 'all' },
  ...HANDOVER_TRANSACTION_TYPES.map(v => ({ label: t(`pages.handover.types.${v}`), value: v }))
])

// Pagination metadata
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

// Setup table query synchronization with watcher (disabled syncUrl to omit browser URL params)
const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchHandovers(), { defaultSortBy: 'createdAt', defaultOrder: 'DESC' })

// Fetch handovers from service
const fetchHandovers = async () => {
  isLoading.value = true
  try {
    const response = await handoverService.getAll(
      page.value,
      perPage.value,
      search.value,
      sortBy.value,
      order.value,
      statusFilter.value === 'all' ? '' : statusFilter.value,
      typeFilter.value === 'all' ? '' : typeFilter.value
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
    isLoading.value = false
  }
}

// Columns definition
const baseColumns: TableColumn<Handover>[] = [
  {
    accessorKey: 'id',
    header: sortHeader(t('pages.handover.columnDocNo'), 'id'),
    cell: ({ row }) => {
      const docNo = `#${String(row.original.id)}`
      return h(
        'span',
        { class: 'font-semibold text-primary hover:underline cursor-pointer' },
        {
          default: () => docNo,
          onClick: (e: Event) => {
            e.stopPropagation()
            navigateTo(`/handover/${row.original.id}`)
          }
        }
      )
    }
  },
  {
    accessorKey: 'createdAt',
    header: sortHeader(t('pages.handover.columnDate'), 'createdAt'),
    cell: ({ row }) => {
      const d = row.original.createdAt
      // Format simple local date
      const formatted = d ? d.replace('T', ' ').slice(0, 16) : '-'
      return h('span', { class: 'text-neutral-600 font-medium' }, formatted)
    }
  },
  {
    accessorKey: 'handedOver',
    header: t('pages.handover.columnHandedOverBy'),
    cell: ({ row }) => {
      const person = row.original.handedOver
      if (!person) return h('span', { class: 'text-neutral-400 text-xs' }, '-')
      return h('div', { class: 'flex items-center gap-2 min-w-0' }, [
        h(UAvatar, {
          src: person.photo || undefined,
          alt: person.name,
          class: 'bg-primary-50 text-primary-700',
          loading: 'lazy'
        }),
        h('div', { class: 'flex flex-col min-w-0' }, [
          h('span', { class: 'text-neutral-900 font-semibold truncate' }, person.name),
          h('span', { class: 'text-xs text-neutral-500' }, person.employeeId)
        ])
      ])
    }
  },
  {
    accessorKey: 'received',
    header: t('pages.handover.columnReceivedBy'),
    cell: ({ row }) => {
      const person = row.original.received
      if (!person) return h('span', { class: 'text-neutral-400 text-xs' }, '-')
      return h('div', { class: 'flex items-center gap-2 min-w-0' }, [
        h(UAvatar, {
          src: person.photo || undefined,
          alt: person.name,
          class: 'bg-primary-50 text-primary-700',
          loading: 'lazy'
        }),
        h('div', { class: 'flex flex-col min-w-0' }, [
          h('span', { class: 'text-neutral-900 font-semibold truncate' }, person.name),
          h('span', { class: 'text-xs text-neutral-500' }, person.employeeId)
        ])
      ])
    }
  },
  {
    accessorKey: 'transactionType',
    header: sortHeader(t('pages.handover.columnType'), 'transactionType'),
    cell: ({ row }) => {
      const label = t(`pages.handover.types.${row.original.transactionType}`)
      return h('span', { class: 'text-sm text-neutral-600 font-medium' }, label)
    }
  },
  {
    accessorKey: 'status',
    header: sortHeader(t('pages.handover.columnStatus'), 'status'),
    cell: ({ row }) => {
      const s = row.original.status
      let label = t('pages.handover.statusPending')
      let col: 'warning' | 'success' | 'error' | 'neutral' = 'warning'
      if (s === 'approve') {
        label = t('pages.handover.statusApprove')
        col = 'success'
      } else if (s === 'reject') {
        label = t('pages.handover.statusReject')
        col = 'error'
      } else if (s === 'cancel') {
        label = t('pages.handover.statusCancel')
        col = 'neutral'
      }
      return h(UBadge, { color: col, variant: 'subtle' }, () => label)
    }
  },
  {
    accessorKey: 'createdBy',
    header: t('pages.handover.columnCreatedBy'),
    cell: ({ row }) => {
      const creator = row.original.createdBy
      if (!creator) return h('span', { class: 'text-neutral-400 text-xs' }, '-')
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UAvatar, {
          src: creator.photo || undefined,
          alt: creator.name,
          size: 'xs',
          class: 'ring-1 ring-primary/10'
        }),
        h('span', { class: 'text-xs text-neutral-700 truncate max-w-[120px]' }, creator.name)
      ])
    }
  }
]

const columns = computed(() => {
  const list = [...baseColumns]
  list.push({
    id: 'actions',
    header: t('pages.handover.columnAction'),
    meta: {
      class: {
        td: 'text-right',
        th: 'text-right'
      }
    },
    cell: ({ row }) => {
      const items = getRowItems(row)
      return h(
        UDropdownMenu,
        {
          content: { align: 'end' },
          items: items,
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
  return list
})

function getRowItems(row: Row<Handover>) {
  const handover = row.original
  const actions = []

  // Always can view
  actions.push({
    label: t('common.detail'),
    icon: 'i-lucide-eye',
    onSelect() {
      navigateTo(`/handover/${handover.id}`)
    }
  })

  // Only pending handovers can be cancelled; once approved it is locked.
  if (handover.status === 'pending' && hasPermission('handover:cancel')) {
    actions.push({
      label: t('pages.handover.cancel'),
      icon: 'i-lucide-ban',
      color: 'warning' as const,
      onSelect() {
        selectedHandover.value = handover
        showCancelModal.value = true
      }
    })
  }

  return actions
}

// Cancel flow
const selectedHandover = ref<Handover | null>(null)
const showCancelModal = ref(false)
const isCancelling = ref(false)
const showFieldSettings = ref(false)

const handleCancel = async () => {
  if (!selectedHandover.value) return
  isCancelling.value = true
  try {
    const response = await handoverService.cancel(selectedHandover.value.id)
    if (response.success) {
      toast.add({ title: t('pages.handover.cancelSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
      showCancelModal.value = false
      await fetchHandovers()
    } else {
      toast.add({ title: response.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    isCancelling.value = false
  }
}

onMounted(() => {
  fetchHandovers()
})
</script>