# 🎨 NuxtUI Component Guide

> **WAJIB DIBACA** — Project ini menggunakan NuxtUI v4 (`@nuxt/ui ^4.7.1`).
> Semua UI HARUS menggunakan komponen NuxtUI. Dilarang membuat custom component jika NuxtUI sudah menyediakan.

## Konfigurasi Global (app.config.ts)

```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',    // Warna utama brand
      error: 'red',        // Untuk error/danger states
      warning: 'yellow',   // Untuk warning states
      neutral: 'slate'     // Untuk neutral/muted elements
    },
    button: {
      defaultVariants: { size: 'lg' }  // Default button size
    },
    input: {
      defaultVariants: { size: 'lg' }  // Default input size
    }
  }
})
```

> ⚠️ **Perhatikan**: Button dan Input sudah default `size: 'lg'`. Tidak perlu menambahkan `size="lg"` kecuali perlu override size lain.

## Komponen NuxtUI yang Digunakan

### 1. UApp (Root Wrapper)

Digunakan di `app.vue` sebagai root wrapper aplikasi:

```vue
<UApp :toaster="{ position: 'top-right', progress: false }">
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</UApp>
```

### 2. UButton

**Penggunaan Standar:**

```vue
<!-- Primary action -->
<UButton color="primary">Save</UButton>

<!-- Secondary/Cancel -->
<UButton color="neutral" variant="outline">Cancel</UButton>

<!-- Danger/Delete -->
<UButton color="error">Delete</UButton>

<!-- Ghost (icon-only button) -->
<UButton 
  color="neutral" 
  variant="ghost" 
  icon="i-lucide-x" 
  aria-label="Close"
/>

<!-- Full-width button -->
<UButton block color="primary" :loading="loading">Submit</UButton>

<!-- Button with icon -->
<UButton color="primary" variant="solid" icon="i-lucide-plus">
  Add Contact
</UButton>

<!-- Soft variant -->
<UButton variant="soft" color="neutral">Continue with Google</UButton>

<!-- Submit form dari luar -->
<UButton type="submit" form="form-id" color="primary" :loading="isSubmitting">
  Save
</UButton>
```

**Variant Reference:**

| Variant | Kapan Digunakan |
|---------|----------------|
| `solid` | Primary actions (default) |
| `outline` | Secondary actions, Cancel |
| `ghost` | Icon-only buttons, subtle actions |
| `soft` | Alternative actions (Google login) |

**Color Reference:**

| Color | Kapan Digunakan |
|-------|----------------|
| `primary` | Submit, Save, utama |
| `neutral` | Cancel, secondary |
| `error` | Delete, Logout, destructive |
| `success` | (Toast only) |

### 3. UInput

```vue
<!-- Standard input -->
<UInput v-model="form.name" placeholder="Enter name" class="w-full" />

<!-- Email input -->
<UInput v-model="form.email" type="email" placeholder="Enter email" class="w-full" />

<!-- Input with icon -->
<UInput v-model="search" icon="i-lucide-search" size="md" variant="outline" placeholder="Search..." />

<!-- Password input with toggle -->
<UInput
  v-model="state.password"
  :type="showPassword ? 'text' : 'password'"
  placeholder="Enter your password"
  class="w-full"
>
  <template #trailing>
    <UButton
      color="neutral"
      variant="ghost"
      :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
      class="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-transparent cursor-pointer"
      @click="showPassword = !showPassword"
      aria-label="Toggle Password Visibility"
    />
  </template>
</UInput>
```

### 4. UForm + UFormField

**Pattern standar form dengan Zod validation:**

```vue
<template>
  <UForm 
    id="form-id" 
    :schema="schema" 
    :state="form" 
    @submit="handleSubmit" 
    class="space-y-2"
  >
    <UFormField label="Name" name="name">
      <UInput v-model="form.name" placeholder="Enter name" class="w-full" />
    </UFormField>

    <UFormField label="Email" name="email">
      <UInput v-model="form.email" type="email" placeholder="Enter email" class="w-full" />
    </UFormField>
  </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address')
})
</script>
```

**UFormField dengan hint slot (contoh: forgot password link):**

```vue
<UFormField label="Password" name="password" :ui="{ label: 'text-sm font-medium text-neutral-800' }">
  <template #hint>
    <NuxtLink to="/auth/forgot-password" class="text-sm font-medium text-primary">
      Forgot password?
    </NuxtLink>
  </template>
  <UInput v-model="state.password" type="password" class="w-full" />
</UFormField>
```

### 5. UModal

**Pattern Form Modal (Add/Update):**

```vue
<UModal 
  title="Modal Title"
  description="Modal description."
  v-model:open="open" 
  :ui="{ 
    content: 'sm:max-w-md',       <!-- Lebar modal -->
    overlay: 'bg-black/40',       <!-- Overlay background -->
    footer: 'justify-end'         <!-- Footer alignment -->
  }"
>
  <template #body>
    <UForm id="form-id" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-2">
      <!-- Form fields -->
    </UForm>
  </template>
  <template #footer>
    <div class="flex justify-end items-center gap-2 w-full">
      <UButton label="Cancel" @click="open = false" color="neutral" variant="outline" />
      <UButton type="submit" form="form-id" color="primary" :loading="isSubmitting">
        Save
      </UButton>
    </div>
  </template>
</UModal>
```

**Pattern Delete Confirmation Modal:**

```vue
<UModal v-model:open="open" :ui="{ content: 'sm:max-w-sm', overlay: 'bg-black/40' }">
  <template #content>
    <UCard :ui="{ body: 'flex flex-col gap-4 relative' }">
      <!-- Warning icon + message -->
      <div class="flex flex-col items-center text-center select-none space-y-3">
        <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
          <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
        </div>
        <div class="space-y-1.5">
          <h3 class="text-base font-medium text-neutral-900">Delete Confirmation</h3>
          <p class="text-sm text-neutral-600">
            Are you sure? This action cannot be undone.
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <UButton color="neutral" variant="outline" class="flex-1 justify-center" @click="open = false">
          Cancel
        </UButton>
        <UButton color="error" :loading="loading" class="flex-1 justify-center" @click="$emit('confirm')">
          Delete
        </UButton>
      </div>
    </UCard>
  </template>
</UModal>
```

**Ukuran Modal:**

| Ukuran | Class | Kapan Digunakan |
|--------|-------|----------------|
| Small | `sm:max-w-sm` | Delete confirmation, simple alert |
| Medium | `sm:max-w-md` | Form modal (add/edit) |
| Large | `sm:max-w-lg` | Detail view, complex form |

### 6. UTable

```vue
<UTable 
  :data="data" 
  :columns="columns"
  :loading="isLoading"
  :ui="{ 
    th: 'bg-neutral-50 py-2.5', 
    td: 'text-neutral-900' 
  }"
  class="border border-neutral-200 rounded-md"
/>
```

**Column definition pattern:**

```typescript
import type { TableColumn } from '@nuxt/ui'

const columns: TableColumn<Contact>[] = [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) => `#${row.getValue('id')}`
  },
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    id: 'actions',
    header: 'Action',
    meta: {
      class: { td: 'text-right', th: 'text-right' }
    },
    cell: ({ row }) => {
      // Render action dropdown — lihat section UDropdownMenu
    }
  }
]
```

### 7. UDropdownMenu (Action Column)

```typescript
import { h, resolveComponent } from 'vue'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// Di column cell:
cell: ({ row }) => {
  return h(
    UDropdownMenu,
    {
      content: { align: 'end' },
      items: [
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
      ],
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
```

### 8. UPagination

```vue
<UPagination 
  v-model:page="page" 
  size="md" 
  :total="meta.total" 
  :items-per-page="perPage" 
/>
```

### 9. USelect

```vue
<USelect v-model="perPage" :items="limitOptions" class="w-20" />
```

### 10. UIcon

```vue
<!-- Selalu gunakan prefix i-lucide- -->
<UIcon name="i-lucide-box" class="w-5 h-5" />
<UIcon name="i-lucide-search" class="w-4 h-4" />
```

**Icon yang sering digunakan:**

| Icon | Penggunaan |
|------|-----------|
| `i-lucide-plus` | Add/Create button |
| `i-lucide-edit` | Edit action |
| `i-lucide-trash` | Delete action |
| `i-lucide-x` | Close button |
| `i-lucide-search` | Search input |
| `i-lucide-eye` / `i-lucide-eye-off` | Password toggle |
| `i-lucide-log-out` | Logout |
| `i-lucide-circle-check` | Success toast |
| `i-lucide-circle-x` | Error toast |
| `i-lucide-triangle-alert` | Warning/danger |
| `i-lucide-menu` | Mobile menu |
| `i-lucide-arrow-left` | Back navigation |
| `i-lucide-loader-circle` | Loading spinner (+ `animate-spin`) |
| `i-lucide-ellipsis-vertical` | More actions |
| `i-lucide-chevrons-up-down` | Expand/collapse |
| `i-lucide-layout-dashboard` | Dashboard nav |
| `i-lucide-users-round` | Contact/users nav |

### 11. UTooltip

```vue
<UTooltip
  :text="item.label"
  :disabled="!isCollapsed"
  :content="{ align: 'center', side: 'right', sideOffset: 8 }"
>
  <!-- Trigger content -->
</UTooltip>
```

### 12. UPopover

```vue
<UPopover v-bind="popoverProps">
  <!-- Trigger slot -->
  <slot>
    <UAvatar :src="user.photo" size="sm" />
  </slot>

  <template #content>
    <div class="p-3 w-56 space-y-3 select-none">
      <!-- Popover content -->
    </div>
  </template>
</UPopover>
```

### 13. UAvatar

```vue
<UAvatar
  :src="user.photo"
  :alt="user.name"
  size="sm"
  class="ring-2 ring-primary/10 shrink-0"
/>
```

### 14. USeparator

```vue
<USeparator label="OR" color="neutral" />
```

### 15. UAlert

```vue
<UAlert
  title="Check your email"
  description="We've sent a password reset link to your email address."
  icon="i-lucide-mail-check"
  color="success"
  variant="subtle"
/>
```

### 16. UCard

```vue
<UCard :ui="{ body: 'flex flex-col gap-4 relative' }">
  <!-- Card content -->
</UCard>
```

### 17. Toast (useToast)

```typescript
const toast = useToast()

// Success toast
toast.add({
  title: 'Contact created successfully!',
  color: 'success',
  icon: 'i-lucide-circle-check'
})

// Error toast
toast.add({
  title: 'An error occurred',
  description: 'Optional detail message',
  color: 'error',
  icon: 'i-lucide-circle-x'
})
```

## NuxtUI `:ui` Prop Pattern

Gunakan `:ui` prop untuk customize styling tanpa hardcode:

```vue
<!-- Modal -->
:ui="{ content: 'sm:max-w-md', overlay: 'bg-black/40', footer: 'justify-end' }"

<!-- Table -->
:ui="{ th: 'bg-neutral-50 py-2.5', td: 'text-neutral-900' }"

<!-- Card -->
:ui="{ body: 'flex flex-col gap-4 relative' }"

<!-- FormField -->
:ui="{ label: 'text-sm font-medium text-neutral-800' }"
```

## Daftar Komponen NuxtUI yang HARUS Digunakan

| Kebutuhan | Komponen NuxtUI | Jangan Gunakan |
|-----------|-----------------|----------------|
| Button | `<UButton>` | `<button class="...">` |
| Input | `<UInput>` | `<input class="...">` |
| Select | `<USelect>` | `<select class="...">` |
| Form | `<UForm>` + `<UFormField>` | Custom form validation |
| Modal/Dialog | `<UModal>` | Custom modal |
| Table | `<UTable>` | Custom table |
| Pagination | `<UPagination>` | Custom pagination |
| Dropdown | `<UDropdownMenu>` | Custom dropdown |
| Toast | `useToast()` | Custom notification |
| Icon | `<UIcon>` | `<svg>` inline (kecuali custom brand icon) |
| Avatar | `<UAvatar>` | `<img class="rounded-full">` |
| Tooltip | `<UTooltip>` | Custom tooltip |
| Popover | `<UPopover>` | Custom popover |
| Alert | `<UAlert>` | Custom alert box |
| Separator | `<USeparator>` | `<hr>` |
| Card | `<UCard>` | Custom card div |
