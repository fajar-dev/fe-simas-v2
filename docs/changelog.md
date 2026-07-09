# 📋 Changelog

Semua perubahan penting pada project ini didokumentasikan di file ini.

Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

---

## [Unreleased] — 2026-07-09

### Added
- **Cancel Asset Handover**: aksi batalkan handover pada halaman list (dropdown) & detail — hanya muncul untuk handover `pending` dan bila punya permission `asset-handover:cancel`. Konfirmasi lewat modal `HandoverCancelModal`, plus badge & filter status `cancel`.
- **Asset Holder — sumber handover**: kolom "Source" pada riwayat holder menandai apakah record berasal dari serah terima (badge tertaut ke detail handover) atau manual.
- Locale `common.detail`.

### Changed
- Handover: label **Keperluan → Catatan** (field `note`) di form create & halaman detail; nilai ditampilkan konsisten dengan backend.
- Bersih-bersih: pindah helper `getLocalDatetimeString` & `getAttachmentBadgeTheme` ke `app/utils/format.ts`, hapus locale yang tidak terpakai, samakan struktur locale `en`/`id`.

### Fixed
- Handover: catatan tidak tersimpan karena ketidaksesuaian field dengan backend (`note` vs `purpose`) — kini konsisten memakai `note`.

---

## [0.1.0] — 2026-06-18

### 🎉 Initial Release

- SIMAS — Sistem Management Asset Dashboard
- Nuxt 4, NuxtUI v4, Tailwind CSS v4, TypeScript, Zod, Axios
- Authentication (email/password, Google OAuth, forgot/reset password)
- User management CRUD
- User CRUD
- Profile configuration
- Dashboard layout dengan collapsible sidebar
- Auth layout dengan split-screen design
- Custom design system (green primary, Geist font)
- Dokumentasi lengkap di `docs/`

---

## Template untuk Entry Baru

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- Fitur baru yang ditambahkan

### Changed
- Perubahan pada fitur yang sudah ada

### Fixed
- Bug yang diperbaiki

### Removed
- Fitur yang dihapus

### Security
- Perubahan terkait keamanan
```
