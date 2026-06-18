# SIMAS — Sistem Management Asset (Nuxt 4 Dashboard)

> **BACA SEMUA INSTRUKSI INI SEBELUM MENULIS KODE APAPUN.**
> Dokumentasi lengkap ada di folder `docs/`. File ini adalah ringkasan aturan kritis.

## Tech Stack

- **Nuxt 4** (`^4.4.6`) — SSR disabled, SPA mode
- **NuxtUI v4** (`@nuxt/ui ^4.7.1`) — **WAJIB digunakan untuk semua UI**
- **Tailwind CSS v4** (`^4.3.0`) — Utility-first CSS
- **Zod v4** (`^4.4.3`) — Schema validation untuk forms
- **Axios** (`^1.16.1`) — HTTP client
- **TypeScript** (`^6.0.3`) — Strict mode
- **Bun** (`1.3.1`) — Package manager
- **Icons**: `@iconify-json/lucide` — Prefix: `i-lucide-*`

## ⛔ LARANGAN KERAS

### 1. DILARANG Hardcode CSS / Arbitrary Values

```
❌ DILARANG: px-[10px], m-[5px], w-[200px], h-[50vh], text-[14px], gap-[12px], max-w-[420px]
✅ GUNAKAN:  px-2.5,    m-1,     w-52,      h-screen,  text-sm,     gap-3,      max-w-md
```

### 2. WAJIB Gunakan NuxtUI Components

| Kebutuhan | Gunakan | JANGAN Gunakan |
|-----------|---------|----------------|
| Button | `<UButton>` | `<button class="...">` |
| Input | `<UInput>` | `<input class="...">` |
| Select | `<USelect>` / `<USelectMenu>` | `<select>` |
| Form | `<UForm>` + `<UFormField>` | Custom validation |
| Modal | `<UModal>` | Custom modal |
| Table | `<UTable>` | Custom table / `<table>` |
| Dropdown | `<UDropdownMenu>` | Custom dropdown |
| Pagination | `<UPagination>` | Custom pagination |
| Toast | `useToast()` | Custom notification |
| Icon | `<UIcon name="i-lucide-xxx">` | Inline SVG (kecuali brand) |
| Avatar | `<UAvatar>` | `<img class="rounded-full">` |
| Tooltip | `<UTooltip>` | Custom tooltip |
| Popover | `<UPopover>` | Custom popover |
| Alert | `<UAlert>` | Custom alert |
| Separator | `<USeparator>` | `<hr>` |
| Card | `<UCard>` | Custom card |
| Textarea | `<UTextarea>` | `<textarea>` |
| Checkbox | `<UCheckbox>` | `<input type="checkbox">` |
| Switch | `<USwitch>` | Custom toggle |
| Badge | `<UBadge>` | Custom badge span |
| Tabs | `<UTabs>` | Custom tabs |
| Breadcrumb | `<UBreadcrumb>` | Custom breadcrumb |
| Skeleton | `<USkeleton>` | Custom loading |

Daftar lengkap 125+ komponen: baca `docs/nuxtui-components.md`

### 3. Modal HARUS Component Terpisah

```
❌ SALAH:  Menulis modal inline di page
✅ BENAR:  Buat file di app/components/<feature>/AddModal.vue
           Lalu panggil: <FeatureAddModal v-model="showModal" @created="fetchData" />
```

### 4. DILARANG Menambah Library Tanpa Alasan Kuat

Jangan install package baru jika NuxtUI/Tailwind sudah bisa menangani kebutuhan tersebut.

## Struktur Folder

```
app/
├── components/          # Auto-imported components
│   ├── BrandLogo.vue    # Global: logo + nama app
│   ├── Header.vue       # Global: page header (title, tabs, actions)
│   ├── Sidebar.vue      # Global: sidebar navigasi (collapsible)
│   ├── UserPopover.vue  # Global: user profile dropdown
│   ├── DeleteModal.vue  # Global: generic delete confirmation
│   └── <feature>/       # Feature-specific components
│       ├── AddModal.vue      → <FeatureAddModal />
│       ├── UpdateModal.vue   → <FeatureUpdateModal />
│       └── DeleteModal.vue   → <FeatureDeleteModal /> (opsional)
├── composables/
│   ├── useAuth.ts       # Auth state (readonly)
│   ├── useNavigation.ts # Sidebar nav config
│   └── error-helper.ts  # Global error handler
├── layouts/
│   ├── dashboard.vue    # Sidebar + main content
│   └── auth.vue         # Split-screen auth
├── middleware/
│   ├── auth.global.ts   # Protected route guard
│   └── guest.ts         # Guest-only route guard
├── pages/
│   ├── index.vue        # Dashboard (layout: dashboard)
│   ├── auth/            # Auth pages (layout: auth, middleware: guest)
│   └── <feature>/
│       └── index.vue    # CRUD listing page
├── services/
│   ├── api-service.ts   # Axios base client + interceptors
│   ├── auth-service.ts  # Auth methods
│   └── <feature>-service.ts  # CRUD service
└── types/
    ├── auth.d.ts        # User, AuthData, ApiResponse
    └── <feature>.d.ts   # Feature types + payload
```

## Design System

- **Primary**: green (`#009838`)
- **Error**: red (`#B91C1C`)
- **Warning**: yellow (`#D97706`)
- **Neutral**: slate
- **Font**: Geist (Google Fonts)
- **Button/Input default size**: `lg` (set di `app.config.ts`)

## Checklist: Menambah Fitur CRUD Baru

Saat diminta membuat fitur baru (contoh: `product`):

1. `app/types/product.d.ts` — Interface `Product` + `ProductPayload`
2. `app/services/product-service.ts` — Copy pattern dari `contact-service.ts`
3. `app/components/product/AddModal.vue` — Copy pattern dari `contact/AddModal.vue`
4. `app/components/product/UpdateModal.vue` — Copy pattern dari `contact/UpdateModal.vue`
5. `app/pages/product/index.vue` — Copy pattern dari `contact/index.vue`
6. `app/composables/useNavigation.ts` — Tambah nav item baru
7. `docs/changelog.md` — Catat perubahan
8. Gunakan `DeleteModal` global (jangan buat baru)

## Coding Conventions

| Aspek | Aturan |
|-------|--------|
| File pages | `kebab-case.vue` |
| File components | `PascalCase.vue` |
| File composables | `camelCase.ts` dengan prefix `use` |
| File services | `kebab-case-service.ts` |
| File types | `kebab-case.d.ts` |
| Variables | `camelCase` |
| Functions | `camelCase` prefix verb (`handleSubmit`, `fetchData`) |
| Interfaces/Types | `PascalCase` |
| Emits | past-tense (`created`, `updated`, `deleted`) |
| Indent | 2 spaces |
| Quotes | Single quotes |
| Trailing comma | Never |
| Import types | `import type { X } from '...'` |
| Package manager | `bun` (bukan npm/yarn) |
| Icons | `i-lucide-*` (bukan heroicons/dll) |

## Script Setup Order

```vue
<script setup lang="ts">
// 1. Imports
// 2. definePageMeta / defineModel / defineProps / defineEmits
// 3. Composables (useToast, useRoute, useAuth)
// 4. Reactive state (ref, reactive)
// 5. Computed
// 6. Zod schema
// 7. Functions/methods
// 8. Watchers
// 9. Lifecycle hooks (onMounted)
</script>
```

## File yang JANGAN Diubah (Kecuali Diminta)

- `app/services/api-service.ts` — Base HTTP client
- `app/services/auth-service.ts` — Auth flow
- `app/assets/css/main.css` — Design tokens
- `app/app.config.ts` — NuxtUI theme config
- `app/layouts/dashboard.vue` — Dashboard layout
- `app/layouts/auth.vue` — Auth layout
- `nuxt.config.ts` — Nuxt configuration

## Dokumentasi Lengkap

Baca folder `docs/` untuk detail lebih lanjut:
- `docs/project-overview.md` — Arsitektur lengkap
- `docs/coding-standards.md` — Standar kode detail
- `docs/nuxtui-guide.md` — Panduan NuxtUI + contoh kode
- `docs/nuxtui-components.md` — Daftar 125+ komponen NuxtUI
- `docs/component-guide.md` — Pattern modal, form, component
- `docs/service-layer.md` — Pattern service, API, types
- `docs/page-pattern.md` — Template halaman CRUD & auth
- `docs/changelog.md` — Log perubahan
