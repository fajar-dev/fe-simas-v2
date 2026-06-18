# 📄 Page Pattern Guide

## Aturan Umum

1. **Setiap page HARUS mendefinisikan layout** via `definePageMeta({ layout: '...' })`
2. **Setiap page HARUS menggunakan `Header` component** sebagai elemen pertama (untuk dashboard pages)
3. **Setiap auth page HARUS memiliki `useHead`** untuk SEO
4. **Modal di page** — Hanya panggil component, jangan tulis inline
5. **Root wrapper** — Gunakan `<div class="space-y-6">` sebagai wrapper utama

## Layout Assignment

| Layout | Halaman | Middleware |
|--------|---------|-----------|
| `dashboard` | `/`, `/contact`, dan semua halaman protected | `auth.global` (otomatis) |
| `auth` | `/auth/sign-in`, `/auth/forgot-password`, `/auth/reset-password` | `guest` |

## Pattern 1: Dashboard Page (CRUD Listing)

Referensi: `app/pages/contact/index.vue`

```vue
<template>
  <div class="space-y-6">
    <!-- 1. Header -->
    <Header
      title="Feature Name"
      description="Feature description"
    />

    <!-- 2. Content Section -->
    <section class="space-y-5">
      <!-- 2a. Toolbar: Search + Filter + Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UInput 
            v-model="search" 
            icon="i-lucide-search" 
            size="md" 
            variant="outline" 
            placeholder="Search..." 
            class="flex-1 sm:flex-none sm:w-64" 
          />
          <USelect v-model="perPage" :items="limitOptions" class="w-20" />
        </div>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full sm:w-auto justify-center"
          @click="showAddModal = true"
        >
          Add [Feature]
        </UButton>
      </div>

      <!-- 2b. Data Table -->
      <div class="overflow-x-auto">
        <UTable 
          :data="data" 
          :columns="columns"
          :loading="isLoading"
          :ui="{ 
            th: 'bg-neutral-50 py-2.5', 
            td: 'text-neutral-900' 
          }"
          class="border border-neutral-200 rounded-md min-w-[640px]" 
        />
      </div>

      <!-- 2c. Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <span class="text-sm text-muted-foreground">
          Showing {{ meta.from || 0 }} to {{ meta.to || 0 }} of {{ meta.total }} results
        </span>
        <UPagination 
          v-model:page="page" 
          size="md" 
          :total="meta.total" 
          :items-per-page="perPage" 
        />
      </div>
    </section>

    <!-- 3. Modals (Component terpisah) -->
    <FeatureAddModal v-model="showAddModal" @created="fetchItems" />
    <FeatureUpdateModal v-model="showUpdateModal" :item="selectedItem" @updated="fetchItems" />
    <DeleteModal 
      v-model="showDeleteModal" 
      title="Delete [Feature]" 
      :item-name="selectedItem?.name" 
      :loading="isDeleting"
      @confirm="handleDelete" 
    />
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { featureService } from '~/services/feature-service'
import type { Feature } from '~/types/feature'

// Page meta
definePageMeta({
  layout: 'dashboard'
})

// Resolve components untuk render function di column
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// State
const search = ref('')
const limitOptions = ref([10, 25, 50, 100])
const perPage = ref(10)
const page = ref(1)
const data = ref<Feature[]>([])
const isLoading = ref(false)
const selectedItem = ref<Feature | null>(null)

// Modal states
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

// Fetch data
const fetchItems = async () => {
  isLoading.value = true
  try {
    const response = await featureService.getAll(page.value, perPage.value, search.value)
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

// Watch pagination changes
watch([page, perPage], () => {
  fetchItems()
})

// Watch search with debounce
let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchItems()
  }, 300)
})

// Table columns
const columns: TableColumn<Feature>[] = [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) => `#${row.getValue('id')}`
  },
  {
    accessorKey: 'name',
    header: 'Name'
  },
  // ... more columns
  {
    id: 'actions',
    header: 'Action',
    meta: {
      class: { td: 'text-right', th: 'text-right' }
    },
    cell: ({ row }) => {
      return h(
        UDropdownMenu,
        {
          content: { align: 'end' },
          items: getRowItems(row),
          'aria-label': 'Actions dropdown'
        },
        () => h(UButton, {
          icon: 'i-lucide-ellipsis-vertical',
          color: 'neutral',
          variant: 'ghost',
          'aria-label': 'Actions dropdown'
        })
      )
    }
  }
]

// Row action items
function getRowItems(row: Row<Feature>) {
  return [
    {
      label: 'Edit',
      icon: 'i-lucide-edit',
      onSelect() {
        selectedItem.value = row.original
        showUpdateModal.value = true
      }
    },
    {
      label: 'Delete',
      color: 'error',
      icon: 'i-lucide-trash',
      onSelect() {
        selectedItem.value = row.original
        showDeleteModal.value = true
      }
    }
  ]
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedItem.value) return
  isDeleting.value = true
  try {
    const response = await featureService.delete(selectedItem.value.id)
    if (response.success) {
      toast.add({
        title: '[Feature] deleted successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchItems()
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchItems()
})
</script>
```

## Pattern 2: Auth Page

Referensi: `app/pages/auth/sign-in.vue`

```vue
<template>
  <div class="w-full max-w-md mx-auto">
    <!-- 1. Logo + Header -->
    <div class="flex flex-col gap-5 mb-6">
      <BrandLogo />
      <div class="space-y-1">
        <h1 class="text-3xl font-bold text-neutral-900">
          Page Title
        </h1>
        <p class="text-neutral-600">
          Page description
        </p>
      </div>
    </div>

    <!-- 2. Form -->
    <UForm :state="state" :schema="schema" @submit="handleSubmit" class="space-y-4">
      <UFormField label="Email" name="email" :ui="{ label: 'text-sm font-medium text-neutral-800' }">
        <UInput v-model="state.email" type="email" placeholder="Enter your email" class="w-full" />
      </UFormField>

      <!-- 3. Actions -->
      <div class="flex flex-col gap-3 pt-2">
        <UButton type="submit" block color="primary" :loading="loading">
          Submit
        </UButton>

        <!-- Optional: Back link -->
        <NuxtLink
          to="/auth/sign-in"
          class="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          Back to Sign In
        </NuxtLink>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

useHead({
  title: 'Page Title'
})

const state = reactive({ email: '' })
const loading = ref(false)
const toast = useToast()

const schema = z.object({
  email: z.string().min(1, 'Email is required')
})

const handleSubmit = async () => {
  loading.value = true
  try {
    // ... API call
  } finally {
    loading.value = false
  }
}
</script>
```

### Auth Page Layout Structure:

```
+-----------------------------------+-------------------+
|                                   |                   |
|   Gradient Background             |   Form Content    |
|   (60% - lg:w-3/5)               |   (40% - lg:w-2/5)|
|                                   |                   |
|   - gradient.svg bg               |   - max-w-md      |
|   - grid.svg overlay              |   - BrandLogo     |
|                                   |   - Title + Desc  |
|                                   |   - UForm         |
|                                   |   - Actions       |
|                                   |                   |
+-----------------------------------+-------------------+
```

## Pattern 3: Simple Dashboard Page

Referensi: `app/pages/index.vue`

```vue
<template>
  <div class="space-y-6">
    <Header
      title="Dashboard"
      description="Rekap dari pertumbuhan penjualan"
    />
    
    <!-- Page content here -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})
</script>
```

## Responsive Design Pattern

### Toolbar (Search + Action)

```vue
<!-- Stack vertically on mobile, row on desktop -->
<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <!-- Left: Search + filter -->
  <div class="flex items-center gap-2 w-full sm:w-auto">
    <UInput class="flex-1 sm:flex-none sm:w-64" />
    <USelect class="w-20" />
  </div>
  
  <!-- Right: Add button (full-width on mobile) -->
  <UButton class="w-full sm:w-auto justify-center">
    Add Item
  </UButton>
</div>
```

### Pagination

```vue
<!-- Center on mobile, space-between on desktop -->
<div class="flex flex-col sm:flex-row items-center justify-between gap-3">
  <span class="text-sm text-muted-foreground">
    Showing X to Y of Z results
  </span>
  <UPagination ... />
</div>
```

### Table

```vue
<!-- Horizontal scroll on small screens -->
<div class="overflow-x-auto">
  <UTable class="min-w-[640px]" />
</div>
```

## Date Formatting

```typescript
// Pattern untuk format tanggal di table column
cell: ({ row }) => {
  const val = row.getValue('createdAt') as string
  if (!val) return '-'
  return new Date(val).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
```

## Toast Pattern

```typescript
const toast = useToast()

// Success toast (setelah create/update/delete berhasil)
toast.add({
  title: 'Contact created successfully!',
  color: 'success',
  icon: 'i-lucide-circle-check'
})

// Info toast (setelah action seperti reset link sent)
toast.add({
  title: 'Reset link sent',
  icon: 'i-lucide-circle-check',
  color: 'success'
})

// Error toast (manual, biasanya sudah di-handle oleh error-helper)
toast.add({
  title: 'An error occurred',
  color: 'error',
  icon: 'i-lucide-circle-x'
})
```

## Search Debounce Pattern

```typescript
let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1       // Reset ke halaman 1
    fetchItems()
  }, 300)                // 300ms debounce
})
```

## Middleware Usage

```typescript
// Dashboard page — tidak perlu middleware (sudah ada auth.global.ts)
definePageMeta({
  layout: 'dashboard'
})

// Auth page — tambahkan guest middleware
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})
```
