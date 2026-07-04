<template>
  <div class="space-y-5">
    <!-- Controls -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div class="flex flex-row items-center gap-2">
        <!-- Search -->
        <UInput 
          v-model="search" 
          icon="i-lucide-search" 
          size="md" 
          variant="outline" 
          :placeholder="searchPlaceholder" 
          class="w-full sm:w-64" 
        />

        <!-- Items per page -->
        <USelect 
          v-model="perPage" 
          :items="limitOptions" 
          class="w-20" 
        />

        <!-- Extra filter controls -->
        <slot name="filters" />
      </div>

      <!-- Custom Top-Right Actions Slot -->
      <div class="w-full lg:w-auto">
        <slot name="actions" />
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <UTable 
        :data="data" 
        :columns="columns"
        :loading="loading"
        :ui="{ 
          th: 'bg-neutral-50 py-2.5', 
          td: 'text-neutral-900 py-3' 
        }"
        :class="['border border-neutral-200 rounded-md', tableClass]" 
      />
    </div>

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
      <span class="text-sm text-neutral-500">
        {{ $t('component.dataTable.showing', { from: from || 0, to: to || 0, total }) }}
      </span>
      <UPagination v-slot="{ page: activePage }" v-model:page="page" size="md" :total="total" :items-per-page="perPage">
        <!-- Optional custom pagination slots can be added here if needed, default is fine -->
      </UPagination>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const search = defineModel<string>('search', { default: '' })
const page = defineModel<number>('page', { default: 1 })
const perPage = defineModel<number>('perPage', { default: 10 })

withDefaults(defineProps<{
  columns: TableColumn<any>[]
  data: any[]
  loading?: boolean
  total?: number
  from?: number
  to?: number
  searchPlaceholder?: string
  limitOptions?: number[]
  tableClass?: string
}>(), {
  loading: false,
  total: 0,
  from: 0,
  to: 0,
  searchPlaceholder: 'Search...',
  limitOptions: () => [10, 25, 50, 100],
  tableClass: ''
})
</script>
