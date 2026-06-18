# 📚 Dokumentasi Project — Nuxt Boilerplate

> **WAJIB DIBACA oleh AI Agent sebelum memulai pekerjaan apapun di project ini.**

## Daftar Dokumentasi

| No | Dokumen | Deskripsi |
|----|---------|-----------|
| ⭐ | [ai-agent-instructions.md](./ai-agent-instructions.md) | **BACA INI PERTAMA** — Instruksi wajib untuk AI agent |
| 1 | [project-overview.md](./project-overview.md) | Arsitektur project, tech stack, dan struktur folder |
| 2 | [coding-standards.md](./coding-standards.md) | Standarisasi kode: naming, formatting, aturan ketat |
| 3 | [nuxtui-guide.md](./nuxtui-guide.md) | Panduan penggunaan komponen NuxtUI — **WAJIB DIIKUTI** |
| 3b | [nuxtui-components.md](./nuxtui-components.md) | Daftar lengkap 125+ komponen NuxtUI v4 yang tersedia |
| 4 | [component-guide.md](./component-guide.md) | Pattern pembuatan komponen, modal, form, dan layout |
| 5 | [service-layer.md](./service-layer.md) | Panduan service, API call, types, dan error handling |
| 6 | [page-pattern.md](./page-pattern.md) | Pattern halaman CRUD, auth, dan dashboard |
| 7 | [changelog.md](./changelog.md) | Log perubahan project |

## ⚠️ Aturan Utama (HARUS DIPATUHI)

1. **Gunakan NuxtUI component** — Dilarang membuat custom component jika NuxtUI sudah menyediakan
2. **Dilarang hardcode class** — Tidak boleh menggunakan `px-[10px]`, `m-[5px]`, `w-[200px]`, dll. Gunakan Tailwind utility class standar (`px-4`, `m-2`, `w-52`, dll)
3. **Modal di luar page** — Semua modal, dialog, dan popup HARUS dijadikan component terpisah di `app/components/<feature>/`
4. **Konsisten dengan pattern yang ada** — Baca referensi page dan component yang sudah ada sebelum membuat yang baru
5. **TypeScript strict** — Semua file menggunakan TypeScript, definisikan type di `app/types/`

## Quick Reference: Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Nuxt | ^4.4.6 | Framework utama |
| @nuxt/ui | ^4.7.1 | UI Component library |
| Tailwind CSS | ^4.3.0 | Utility-first CSS |
| Zod | ^4.4.3 | Schema validation |
| Axios | ^1.16.1 | HTTP client |
| TypeScript | ^6.0.3 | Type safety |
| Bun | 1.3.1 | Package manager |
| Icon Set | @iconify-json/lucide | Icon library |
