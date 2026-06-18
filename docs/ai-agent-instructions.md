# 🤖 AI Agent Instructions

> **File ini HARUS dibaca oleh AI agent sebelum melakukan perubahan apapun di project ini.**

## Langkah Pertama: Baca Dokumentasi

Sebelum menulis kode apapun, baca file-file ini secara berurutan:

1. **[README.md](./README.md)** — Overview & aturan utama
2. **[coding-standards.md](./coding-standards.md)** — Larangan & standar kode
3. **[nuxtui-guide.md](./nuxtui-guide.md)** — Komponen NuxtUI yang tersedia
4. **[component-guide.md](./component-guide.md)** — Pattern component & modal
5. **[service-layer.md](./service-layer.md)** — Pattern service & API
6. **[page-pattern.md](./page-pattern.md)** — Pattern halaman

## Aturan Kritis (JANGAN DILANGGAR)

### 1. DILARANG Hardcode CSS Values

```
❌ px-[10px], m-[5px], w-[200px], h-[50vh], text-[14px], max-w-[420px]
✅ px-2.5, m-1, w-52, h-screen, text-sm, max-w-md
```

### 2. WAJIB Gunakan NuxtUI

- Button → `<UButton>` (bukan `<button>`)
- Input → `<UInput>` (bukan `<input>`)
- Form → `<UForm>` + `<UFormField>` (bukan custom)
- Modal → `<UModal>` (bukan custom modal)
- Table → `<UTable>` (bukan custom table)
- Dropdown → `<UDropdownMenu>` (bukan custom)
- Pagination → `<UPagination>` (bukan custom)
- Toast → `useToast()` (bukan custom notification)
- Icon → `<UIcon name="i-lucide-xxx">` (bukan inline SVG, kecuali brand icon)

### 3. Modal HARUS Component Terpisah

- Buat di `app/components/<feature>/`
- Contoh: `app/components/product/AddModal.vue`
- Jangan tulis modal inline di page

### 4. Ikuti Pattern yang Ada

- **Service**: Copy pattern dari `contact-service.ts`
- **Types**: Copy pattern dari `contact.d.ts`
- **Page CRUD**: Copy pattern dari `pages/contact/index.vue`
- **Add Modal**: Copy pattern dari `components/contact/AddModal.vue`
- **Update Modal**: Copy pattern dari `components/contact/UpdateModal.vue`
- **Delete**: Gunakan `DeleteModal` global

### 5. Script Setup Order

```
1. Imports
2. definePageMeta / defineModel / defineProps / defineEmits
3. Composables (useToast, useRoute, dll)
4. Reactive state
5. Computed
6. Schema (Zod)
7. Functions
8. Watchers
9. Lifecycle hooks
```

## Checklist: Menambah Fitur CRUD Baru

Saat AI agent diminta membuat fitur CRUD baru (misal: `product`):

```
[ ] 1. Buat type:       app/types/product.d.ts
[ ] 2. Buat service:    app/services/product-service.ts
[ ] 3. Buat component:  app/components/product/AddModal.vue
[ ] 4. Buat component:  app/components/product/UpdateModal.vue
[ ] 5. Buat page:       app/pages/product/index.vue
[ ] 6. Update navigasi: app/composables/useNavigation.ts (tambah nav item)
[ ] 7. Update docs:     docs/changelog.md (catat perubahan)
```

## Referensi File yang Sudah Ada

| Tipe | File Referensi | Gunakan Sebagai Template |
|------|---------------|-------------------------|
| Type definition | `app/types/contact.d.ts` | ✅ |
| Service class | `app/services/contact-service.ts` | ✅ |
| Add Modal | `app/components/contact/AddModal.vue` | ✅ |
| Update Modal | `app/components/contact/UpdateModal.vue` | ✅ |
| CRUD Page | `app/pages/contact/index.vue` | ✅ |
| Auth Page | `app/pages/auth/sign-in.vue` | ✅ |
| Delete Modal | `app/components/DeleteModal.vue` | ❌ Gunakan langsung, jangan buat baru |
| Sidebar Nav | `app/composables/useNavigation.ts` | Tambah item di sini |

## Konvensi Penting

| Aspek | Aturan |
|-------|--------|
| Bahasa kode | English (variable, function, class) |
| Bahasa UI | Bisa English atau Indonesia (sesuai konteks) |
| Bahasa toast | English |
| Indent | 2 spaces |
| Quote | Single quotes |
| Trailing comma | NEVER |
| File extension | `.vue` (component/page), `.ts` (logic), `.d.ts` (types) |
| CSS arbitrary | **DILARANG** |
| Package manager | `bun` (bukan npm/yarn) |
| Icons | `i-lucide-*` prefix (bukan heroicons/dll) |

## Yang TIDAK Perlu Dilakukan

- ❌ Jangan tambah library baru tanpa alasan kuat
- ❌ Jangan ubah `api-service.ts` (kecuali menambah interceptor)
- ❌ Jangan ubah `auth-service.ts` (kecuali menambah auth method)
- ❌ Jangan ubah design token di `main.css` (kecuali diminta)
- ❌ Jangan ubah `app.config.ts` (kecuali menambah default variant baru)
- ❌ Jangan ubah layout files (kecuali diminta secara spesifik)
- ❌ Jangan menulis CSS custom jika bisa pakai Tailwind utility
- ❌ Jangan membuat custom form validation jika bisa pakai Zod + UForm
