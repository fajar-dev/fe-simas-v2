<template>
  <div class="space-y-6">
    <!-- Header -->
    <Header
      :title="$t('pages.organization.title')"
      :description="$t('pages.organization.description')"
    >
    </Header>

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
    >
      <template #actions v-if="hasPermission('organization:create')">
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full lg:w-auto justify-center"
          @click="openCreate()"
        >
          {{ $t('pages.organization.addOrganization') }}
        </UButton>
      </template>
    </DataTable>

    <!-- Modals -->
    <OrganizationFormModal v-model="showForm" :organization="editingOrganization" @saved="fetchOrganizations" />
    <DeleteModal
      v-model="showDeleteModal"
      :title="$t('pages.organization.deleteTitle')"
      :item-name="selectedOrganization?.name"
      :loading="isDeleting"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { organizationService } from '~/services/organization-service'
import type { Organization } from '~/types/organization'

const { t } = useI18n()

definePageMeta({
  layout: 'dashboard'
})

const { hasPermission } = useAuth()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')

// State
const data = ref<Organization[]>([])
const isLoading = ref(false)

const {
  search,
  page,
  perPage,
  sortBy,
  order,
  sortHeader
} = useTableQuery(() => fetchOrganizations())

const selectedOrganization = ref<Organization | null>(null)

// Modal states
const showForm = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const editingOrganization = ref<Organization | null>(null)

// Pagination meta
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

// Fetch organizations from API
const fetchOrganizations = async () => {
  isLoading.value = true
  try {
    const response = await organizationService.getAll(page.value, perPage.value, search.value, sortBy.value, order.value)
    if (response.success) {
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

const openCreate = () => {
  editingOrganization.value = null
  showForm.value = true
}

// Table columns
const baseColumns: TableColumn<Organization>[] = [
  {
    accessorKey: 'name',
    header: sortHeader(t('pages.organization.columnName'), 'name'),
    cell: ({ row }) => {
      return h('span', { class: 'font-medium text-neutral-900' }, row.original.name)
    }
  },
  {
    accessorKey: 'type',
    header: sortHeader(t('pages.organization.columnType'), 'type'),
    cell: ({ row }) => {
      return h(UBadge, { color: 'neutral', variant: 'subtle' }, () => row.original.type)
    }
  },
  {
    id: 'parent',
    header: sortHeader(t('pages.organization.columnParent'), 'parent'),
    cell: ({ row }) => {
      const parent = row.original.parent
      if (!parent) return h('span', { class: 'text-neutral-400 text-xs' }, '-')
      return h('span', { class: 'text-neutral-600' }, parent.name)
    }
  },
  {
    accessorKey: 'description',
    header: sortHeader(t('pages.organization.columnDescription'), 'description'),
    cell: ({ row }) => {
      const desc = row.original.description
      return h('span', { class: 'text-neutral-600' }, desc || '-')
    }
  },
  {
    accessorKey: 'isActive',
    header: sortHeader(t('pages.organization.columnStatus'), 'isActive'),
    cell: ({ row }) => {
      const isActive = row.original.isActive
      return h(
        UBadge,
        { color: isActive ? 'primary' : 'error', variant: 'subtle' },
        () => (isActive ? t('common.active') : t('common.inactive'))
      )
    }
  }
]

const columns = computed(() => {
  const list = [...baseColumns]
  if (hasPermission('organization:update', 'organization:delete')) {
    list.push({
      id: 'actions',
      header: t('pages.organization.columnAction'),
      meta: {
        class: {
          td: 'text-right',
          th: 'text-right'
        }
      },
      cell: ({ row }) => {
        const items = getRowItems(row)
        if (items.flat().length === 0) return h('span', { class: 'text-neutral-400 text-xs' }, '-')
        return h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
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
  }
  return list
})

function getRowItems(row: Row<Organization>) {
  const actions = []
  if (hasPermission('organization:update')) {
    actions.push({
      label: t('pages.organization.editOrganization'),
      icon: 'i-lucide-edit',
      onSelect() {
        editingOrganization.value = row.original
        showForm.value = true
      }
    })
  }
  if (hasPermission('organization:delete')) {
    actions.push({
      label: t('pages.organization.deleteOrganization'),
      color: 'error' as const,
      icon: 'i-lucide-trash',
      onSelect() {
        selectedOrganization.value = row.original
        showDeleteModal.value = true
      }
    })
  }
  return actions
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedOrganization.value) return
  isDeleting.value = true
  try {
    const response = await organizationService.delete(selectedOrganization.value.id)
    if (response.success) {
      toast.add({
        title: t('pages.organization.deleteSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      showDeleteModal.value = false
      fetchOrganizations()
    }
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchOrganizations()
})
</script>
