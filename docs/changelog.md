# 📋 Changelog

Semua perubahan penting pada project ini didokumentasikan di file ini.

Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

---

## [Unreleased] — 2026-07-10

### Added
- **Custom field handover**: tombol gear (ikon `i-lucide-settings`) di samping "Buat Serah Terima" membuka modal pengaturan (tab Assign/Return) untuk membangun field custom — tipe text/number/date/datetime/select/radio, opsi custom, required (validasi Zod, alert error inline). Di form create, field muncul sesuai tipe transaksi yang dipilih (required tampil asterisk merah seperti form lain) dan nilainya di-snapshot ke handover; ditampilkan di halaman detail. Ukuran modal disamakan dengan modal lain (`sm:max-w-md`).
- **Serah terima pengembalian (return handover)**: form create kini type-aware — untuk `return`, hanya aset yang active holder-nya = karyawan penyerah terpilih yang bisa dipindai. Halaman detail menampilkan tautan handover asal ("Dikembalikan Dari").
- **Blokir ubah status saat aset terikat handover**: modal Ubah Status (single & bulk) menampilkan alert merah + submit disabled bila aset dipegang via serah terima atau sedang dalam pending handover; tombol Return manual di-disable untuk holder dari serah terima. Composable baru `usePendingHandoverAssets`.
- **Redesign halaman detail handover** agar konsisten dengan gaya detail lain (satu `UCard`, grid field standar, chip lampiran, card Items terpisah).

### Changed
- **Rename `AssetHandover` → `Handover`** (generik untuk reuse modul stok): `handover-service.ts`, `types/handover.d.ts`, namespace i18n `pages.handover` + `nav.handover`, permission `handover:*`, endpoint `/handover`.
- **Cleanup type response (repo-wide)**: hapus scalar FK bila objek lengkap sudah ada (mis. `.assetId` → `.asset?.id`, `.roleId` → `.role?.id`); holder pakai `assignHandover`/`returnHandover`.
- **Copy handover digeneralisasi** (bukan khusus aset): judul "Serah Terima Aset" → "Serah Terima" / "Asset Handover" → "Handover", "Scan Aset" → "Scan Barang"/"Scan Item", penyebut "Aset/Asset" → "Barang/Item"; key `form.validation.assetRequired` → `itemRequired`.

### Added (sebelumnya)
- **Cancel Asset Handover**: aksi batalkan handover pada halaman list (dropdown) & detail — hanya muncul untuk handover `pending` dan bila punya permission `asset-handover:cancel`. Konfirmasi lewat modal `HandoverCancelModal`, plus badge & filter status `cancel`.
- **Asset Holder — sumber handover**: kolom "Source" pada riwayat holder menandai apakah record berasal dari serah terima (badge tertaut ke detail handover) atau manual.
- **Asset Holder — disable Assign saat pending handover**: tombol Assign kini di-disable di frontend (dengan tooltip alasan) bila aset sedang dalam handover `pending`, seperti perilaku saat aset tidak aktif.
- Locale `common.detail`.

### Changed
- Handover: label **Keperluan → Catatan** (field `note`) di form create & halaman detail; nilai ditampilkan konsisten dengan backend.
- Handover: **"Transaction Type" → "Type"**; nilai disederhanakan menjadi `assign`/`return` (label Penetapan/Pengembalian).
- **Sentralisasi enum**: nilai enum handover dipindah ke `app/utils/enums.ts` (`HANDOVER_TRANSACTION_TYPES`, `HANDOVER_STATUSES`) — dipakai oleh type, Zod schema, dan opsi select/filter (mirror `src/core/enums.ts` di backend).
- Bersih-bersih: pindah helper `getLocalDatetimeString` & `getAttachmentBadgeTheme` ke `app/utils/format.ts`, hapus locale yang tidak terpakai, samakan struktur locale `en`/`id`.

### Removed
- Handover: field **Kategori** & **Estimasi Kembali** dihapus dari form create, halaman detail, dan kolom list.

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
