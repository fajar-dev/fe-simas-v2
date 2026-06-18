# 🧩 Component Guide

## Prinsip Dasar

1. **Reusability** — Komponen harus bisa dipakai ulang di berbagai konteks
2. **Single Responsibility** — Satu komponen, satu tanggung jawab
3. **Props Down, Events Up** — Data mengalir ke bawah via props, perubahan dikomunikasikan via emit
4. **Modal = Component** — Semua modal, dialog, dan popup **HARUS** dijadikan component terpisah, BUKAN ditulis inline di page

## Kategori Komponen

### 1. Global Components (`app/components/`)

Komponen yang digunakan di seluruh aplikasi. Auto-imported oleh Nuxt.

| Komponen | Fungsi | Props | Emits |
|----------|--------|-------|-------|
| `BrandLogo` | Logo + nama aplikasi | `isCollapsed?: boolean` | — |
| `Header` | Page header: title, description, tabs, actions, mobile nav | `title: string`, `description?: string` | — |
| `Sidebar` | Navigasi sidebar (collapsible, responsive) | — | — |
| `UserPopover` | User profile dropdown + logout | `popoverProps?: Record<string, any>` | — |
| `DeleteModal` | Generic delete confirmation modal | `title?: string`, `itemName?: string`, `loading?: boolean` | `confirm` |

### 2. Feature Components (`app/components/<feature>/`)

Komponen spesifik untuk fitur tertentu. Dinamakan dengan prefix folder.

**Contoh: `contact/`**

| Komponen | Fungsi | Props | Emits |
|----------|--------|-------|-------|
| `ContactAddModal` | Form tambah contact | `modelValue: boolean` (v-model) | `created` |
| `ContactUpdateModal` | Form edit contact | `modelValue: boolean`, `contact: Contact \| null` | `updated` |
| `ContactDeleteModal` | Konfirmasi hapus contact | `modelValue: boolean`, `contact: Contact \| null` | `deleted` |

> **Auto-naming oleh Nuxt:** File `components/contact/AddModal.vue` otomatis jadi `<ContactAddModal />`.

## Aturan Wajib: Modal HARUS Jadi Component

### ❌ SALAH — Modal ditulis inline di page

```vue
<!-- pages/product/index.vue -->
<template>
  <div>
    <!-- ... page content ... -->
    
    <!-- ❌ JANGAN tulis modal langsung di page -->
    <UModal v-model:open="showAdd">
      <template #body>
        <UForm ...>
          <!-- 50+ baris form code -->
        </UForm>
      </template>
    </UModal>
  </div>
</template>
```

### ✅ BENAR — Modal dijadikan component terpisah

```vue
<!-- components/product/AddModal.vue -->
<template>
  <UModal ...>
    <!-- Modal content -->
  </UModal>
</template>

<!-- pages/product/index.vue -->
<template>
  <div>
    <!-- ... page content ... -->
    <ProductAddModal v-model="showAdd" @created="fetchProducts" />
  </div>
</template>
```

## Pattern: Add Modal Component

```vue
<template>
  <UModal 
    title="Add [Feature]"
    description="Fill in the details to create a new [feature]."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="add-[feature]-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-2">
        <UFormField label="Field Name" name="fieldName">
          <UInput v-model="form.fieldName" placeholder="Enter value" class="w-full" />
        </UFormField>
        <!-- More fields -->
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton label="Cancel" @click="open = false" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="add-[feature]-form"
          color="primary"
          :loading="isSubmitting"
        >
          Save
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { featureService } from '~/services/[feature]-service'
import type { FeaturePayload } from '~/types/[feature]'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

const schema = z.object({
  fieldName: z.string().min(1, 'Field is required')
})

const form = reactive<FeaturePayload>({
  fieldName: ''
})

const resetForm = () => {
  form.fieldName = ''
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await featureService.create(form)
    if (response.success) {
      toast.add({
        title: '[Feature] created successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('created')
      open.value = false
      resetForm()
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (val) => {
  if (!val) resetForm()
})
</script>
```

## Pattern: Update Modal Component

```vue
<template>
  <UModal 
    title="Edit [Feature]"
    description="Update the [feature] information below."
    v-model:open="open" 
    :ui="{ 
      content: 'sm:max-w-md', 
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="update-[feature]-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-2">
        <!-- Same fields as Add, populated from props.item -->
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton label="Cancel" @click="open = false" color="neutral" variant="outline" />
        <UButton type="submit" form="update-[feature]-form" color="primary" :loading="isSubmitting">
          Save Changes
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { featureService } from '~/services/[feature]-service'
import type { Feature, FeaturePayload } from '~/types/[feature]'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  [feature]: Feature | null       // Data item yang akan di-edit
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

// Schema (sama dengan Add)
const schema = z.object({ /* ... */ })

const form = reactive<FeaturePayload>({ /* ... */ })

// Populate form saat modal dibuka
const populateForm = () => {
  if (props.[feature]) {
    form.fieldName = props.[feature].fieldName
    // ... populate semua field
  }
}

const handleSubmit = async () => {
  if (!props.[feature]) return
  isSubmitting.value = true
  try {
    const response = await featureService.update(props.[feature].id, form)
    if (response.success) {
      toast.add({
        title: '[Feature] updated successfully!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('updated')
      open.value = false
    }
  } finally {
    isSubmitting.value = false
  }
}

// Watch: populate saat modal open
watch(open, (val) => {
  if (val) populateForm()
})
</script>
```

## Pattern: Menggunakan Generic DeleteModal

Untuk delete, **gunakan DeleteModal global** bukan buat baru:

```vue
<!-- Di page -->
<DeleteModal 
  v-model="showDeleteModal" 
  title="Delete [Feature]" 
  :item-name="selectedItem?.name" 
  :loading="isDeleting"
  @confirm="handleDelete" 
/>
```

```typescript
// Handler di page
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
```

## Pattern: Header Component

Digunakan di setiap dashboard page sebagai header pertama:

```vue
<Header
  title="Page Title"
  description="Optional page description"
>
  <!-- Optional: Tab navigation -->
  <template #tabs>
    <NuxtLink to="/feature" class="...">Tab 1</NuxtLink>
    <NuxtLink to="/feature/other" class="...">Tab 2</NuxtLink>
  </template>

  <!-- Optional: Action buttons -->
  <template #actions>
    <UButton icon="i-lucide-download">Export</UButton>
  </template>
</Header>
```

## Checklist Membuat Feature Component Baru

Saat menambah fitur CRUD baru (misal: `product`):

1. **Types**: Buat `app/types/product.d.ts`
   - Interface `Product` (data dari API)
   - Interface `ProductPayload` (payload create/update)

2. **Service**: Buat `app/services/product-service.ts`
   - Class `ProductService` mengikuti pattern `ContactService`
   - Export singleton: `export const productService = new ProductService()`

3. **Components**: Buat folder `app/components/product/`
   - `AddModal.vue` — Form create
   - `UpdateModal.vue` — Form update
   - Gunakan `DeleteModal` global (jangan buat baru)

4. **Page**: Buat `app/pages/product/index.vue`
   - Mengikuti pattern `contact/index.vue`

5. **Navigation**: Update `app/composables/useNavigation.ts`
   - Tambahkan nav item baru di `navGroups`

## v-model Pattern untuk Modal

Semua modal menggunakan `defineModel` untuk two-way binding:

```vue
<!-- Component -->
<script setup>
const open = defineModel<boolean>({ default: false })
</script>

<!-- Parent -->
<ComponentModal v-model="showModal" />
```

## Slot Pattern

| Komponen | Slot | Fungsi |
|----------|------|--------|
| `Header` | `#tabs` | Tab navigation links |
| `Header` | `#actions` | Action buttons (filter, export, dll) |
| `DeleteModal` | `#description` | Custom delete message |
| `UModal` | `#body` | Modal body content |
| `UModal` | `#footer` | Modal footer (action buttons) |
| `UModal` | `#content` | Full custom modal content |
| `UInput` | `#trailing` | Trailing element (password toggle) |
| `UFormField` | `#hint` | Hint text/link |
| `UserPopover` | `default` | Custom trigger element |
| `UPopover` | `#content` | Popover body |
