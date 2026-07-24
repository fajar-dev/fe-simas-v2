# 📋 Changelog

Semua perubahan penting pada project ini didokumentasikan di file ini.

Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

---

## [Unreleased] — 2026-07-23

### Changed (UI Consistency)
- **Daftar Persediaan: baris expand menampilkan varian, URL sinkron seperti Asset**: kolom pertama tabel kini punya toggle expand (chevron, hanya muncul bila item punya varian) yang membuka tabel bersarang berisi varian item tersebut (gambar, nama, kode, deskripsi) — varian di-fetch sekali per item saat pertama kali dibuka, lalu di-cache. Pencarian, halaman, dan urutan kini juga tersinkron ke query string URL (`?q=...&page=...&sortBy=...`), sama seperti daftar Asset, jadi bisa di-bookmark/refresh tanpa kehilangan state.
- **Tombol Cancel/Save & Continue/Save & Create Another pada halaman Asset & Persediaan**: halaman create & edit Asset kini punya tombol **Cancel**; teks tombol simpan create diubah dari "Save Asset" jadi **Save**. Create Persediaan menambah **Save & Create Another** (submit lalu reset form, tetap di halaman). Edit Persediaan & edit Asset menambah **Save & Continue** (submit lalu refetch data, tetap di halaman) berdampingan dengan tombol simpan utama.
- **Tombol modal form: konsisten Cancel & Save**: audit menyeluruh pada semua modal berisi form (~30 file) — footer tombolnya kini seragam **Cancel** (outline neutral) & **Save** (tanpa ikon), menggantikan campuran sebelumnya (ada yang pakai ikon, ada yang pakai teks aksi spesifik seperti "Assign"/"Transfer"/"Send"). Modal konfirmasi (Delete, Cancel Handover), kamera/scanner, import, dan login SSO tidak disentuh karena bukan modal form.

### Changed (Stock Out)
- **Tipe Stock Out jadi switch, bukan radio**: pilihan Tipe pada modal Assign diganti dari dua radio ("Ke karyawan" / "Lainnya") menjadi satu `USwitch` berlabel "To employee" — nyala menampilkan field Karyawan, mati menyembunyikannya. Mengikuti perubahan backend dari `type: 'employee'|'other'` ke boolean `isEmployee`.
- **Tabel Stock Out kini dikelompokkan per dokumen, seperti Stock In**: satu aksi Assign (bisa multi-varian) kini tampil sebagai **satu baris** (Tanggal, Tipe, Karyawan, Catatan, Dibuat Oleh, Lampiran) dengan toggle expand di kolom pertama, membuka **tabel bersarang** berisi tiap item (Varian, Cabang, Kondisi, Sisa, tombol **Kembalikan** per item) — persis pola tabel Transfer/Stock In. `ReturnModal` kini menerima `employee` (dari dokumen induk) + `item` (baris bersarang yang dipilih) alih-alih satu objek gabungan.
- **Modal Assign Stock Out: lampiran, placeholder catatan, deskripsi**: tambah `AttachmentManager` (sama seperti Transfer/Add Stock) untuk melampirkan bukti pendukung; field catatan kini punya placeholder "Note (optional)"; modal menampilkan deskripsi singkat di bawah judul.
- **Modal Add Stock (Stock In) disamakan dengan Stock Out untuk multi-varian**: form "tambah baris" (pilih cabang & varian per baris) diganti jadi pola yang sama seperti Assign Stock Out/Transfer — pilih **satu cabang** dulu, lalu tabel semua varian dengan input qty Baru & Bekas (menampilkan qty saat ini sebagai konteks, tanpa batas atas karena ini menambah stok). Satu submit tetap mengirim banyak item sekaligus.
- **Assign Stock Out kini multi-varian sekaligus, seperti Transfer**: modal Assign diubah dari form satu varian/kondisi/qty menjadi tabel baris per varian (kolom qty Baru & Bekas, dibatasi stok tersedia) untuk satu cabang sumber — persis pola `TransferModal`. Satu submit mengirim banyak item sekaligus (`items: [...]`, sudah didukung backend sejak awal); tiap baris qty>0 jadi satu record stock-out terpisah di tabel setelahnya. Validasi Zod menolak qty melebihi stok tersedia per varian.
- **`TransferModal.vue` & `AddStockModal.vue` ikut dipindah, untuk konsistensi**: keduanya sudah lama memakai service tersendiri (`inventory-stock-transfer-service.ts`, `inventory-stock-in-service.ts`) tapi file komponennya tertinggal di `components/inventory/`. Kini pindah ke `components/inventory-stock-transfer/` & `components/inventory-stock-in/` masing-masing, disamakan dengan `inventory-stock-out/` — semua tiga sub-modul stok kini konsisten punya folder komponen sendiri. Halaman `transfer.vue` & `stock-in.vue` diperbarui memakai import eksplisit (bukan auto-import prefix).
- **Komponen & service Stock Out dipisah, seperti Asset**: `AssignModal.vue`/`ReturnModal.vue` pindah dari `components/inventory/` ke folder sendiri `components/inventory-stock-out/` (persis seperti `components/asset-holder/` terpisah dari `components/asset/`); halaman `stock-out.vue` kini meng-import keduanya secara eksplisit (bukan lewat auto-import prefix), sama seperti `asset/[id]/holder.vue`. Service baru `inventory-stock-out-service.ts` (mengikuti pola `inventory-stock-transfer-service.ts`) menangani list/assign/return lewat endpoint top-level `/inventory-stock-out`; `inventory-stock-service.ts` kini hanya menangani balance/entry.
- **Tab Assign/Return jadi "Stock Out" bertipe**: tab (`holder.vue` → `stock-out.vue`, route `/inventory/[id]/stock-out`) diganti nama jadi **Stock Out**; modal Assign kini punya pilihan **Tipe** ("Ke karyawan" / "Lainnya (bukan karyawan)") — memilih "Lainnya" menyembunyikan field Karyawan (tak wajib diisi), untuk stok yang keluar tanpa tujuan karyawan spesifik (dipakai, dibuang, dijual, dll.) dan tidak bisa dikembalikan. Tabel menambah kolom **Tipe** (badge); tombol Return tetap otomatis tersembunyi untuk baris tanpa sisa (termasuk semua baris tipe "Lainnya").

### Fixed
- **Service worker error di build static (`non-precached-url` untuk `/`)**: dengan `ssr:false` + `nuxi generate`, precache manifest dibuat sebelum Nitro selesai prerender, jadi `/` tidak pernah ikut ter-cache — tapi `@vite-pwa/nuxt` tetap mendaftarkan `NavigationRoute` ke `/` (default `navigateFallback`), yang melempar error tersebut saat SW diaktifkan. `pwa.workbox.navigateFallback` di-set eksplisit ke `undefined` agar route tersebut tidak didaftarkan.
- **PDF preview di modal Print Code gagal load worker (`Setting up fake worker`, MIME `application/octet-stream`) setelah deploy static**: pdf.js selalu memuat worker-nya sebagai ES module (`type: 'module'`), yang ditolak browser bila host static menyajikan `.mjs` dengan Content-Type salah. Worker script kini di-`fetch` lalu dibungkus ulang jadi `Blob` dengan type `text/javascript` eksplisit sebelum dijadikan `workerSrc` — Blob URL punya type sendiri, jadi tidak bergantung pada header server.

### Changed
- **Kelola Varian jadi nested form**: modal Kelola Varian bukan lagi daftar read-only + form tambah terpisah, melainkan **nested form** — tiap varian bisa **ditambah, diedit, dihapus** langsung inline (gambar, nama, kode+scan, deskripsi), lalu **Simpan** mempersist semuanya sekaligus (create/update/delete) dan me-refresh. Validasi Zod (`rows.N.name`), layout gambar-kiri / nama-atas / kode-bawah.
- **Gambar & deskripsi pada varian**: Kelola Varian dan create Persediaan kini punya field **gambar** (upload per varian) & **deskripsi**; ditampilkan & dikirim ke API. Kode varian pakai placeholder "Pindai atau ketik kode" agar konsisten; perbaikan uploader gambar per-varian (label-based, tidak bentrok dengan foto item).
- **Default ukuran input `lg`** untuk `selectMenu`/`select`/`textarea` (app.config).
- **Daftar Persediaan diperkaya**: tabel list menambah kolom **No**, **Varian** (`variantCount`), dan **Balance** (`balanceCount` = total stok on-hand); semua kolom data kini bisa **di-sort** (nama, kategori, subkategori, satuan, varian, balance). Tombol **label kustom** (checklist) selalu tampil dengan empty-state "Tidak ada label kustom", konsisten dengan asset.
- **Tab Balance → Stock In**: tabel varian & stok (expandable cabang→varian→kondisi) dipindah ke **detail wrapper**; tab **Stock In** (dulu "Balance") kini berisi **riwayat dokumen stock-in** (tanggal, item per varian/cabang/kondisi, catatan, pembuat, lampiran) — bergaya sama seperti tab Transfer, ganti dari daftar movement per-baris.
- **Create Persediaan**: hapus input **stok awal** (create hanya menambah varian); nama & kode varian pakai **validasi Zod** inline. Tambah tombol **Scan** di sebelah kode item & tiap kode varian, plus **Pindai Massal** (multi-scan menambah varian) memakai `AssetScannerModal`. Kategori, subkategori, & satuan kini **wajib** (asterisk + Zod). Placeholder nama/deskripsi disamakan dengan create asset. Tombol multi-scan pada create **asset** ikut diberi teks "Pindai Massal".
- **Kolom Dibuat Oleh & lampiran pada riwayat transfer**: pakai avatar + nama (fallback "Sistem") dan badge lampiran berwarna sesuai tipe file, konsisten dengan tabel asset.
- **Istilah Penetapan / Pengembalian**: label Assign/Return pada Inventory diselaraskan dengan handover — tab & log aktivitas (id) memakai **Penetapan/Pengembalian** (bukan lagi "Di-assign/Dikembalikan"), tombol & judul modal ikut disesuaikan; en memakai bentuk kata benda **Assignment/Return**.
- **Hapus drawer Log Aktivitas stok**: tombol & drawer timeline pergerakan stok (yang sempat menggantikan tab Pergerakan) dihapus — riwayatnya sudah tercakup lengkap di tab **Stock In**, **Transfer**, dan **Assign/Return**, jadi ledger flat terpisah tidak diperlukan lagi.
- **Service inventory-stock dipecah**: `inventory-stock-transfer-service.ts` & `inventory-stock-in-service.ts` baru (mengikuti pola `asset-holder-service.ts`), memanggil endpoint top-level `/inventory-stock-transfer` & `/inventory-stock-in` (konsisten dengan backend yang memisahkan modulnya dari `inventory-stock`); `inventory-stock-service.ts` kini hanya menangani balance/entry/holding/assign/return.
- **Tabel Transfer & Stock In: baris expand ke sub-tabel item**: kolom **Variant** dihapus; sebagai gantinya kolom pertama (paling kiri) berisi **ikon chevron** untuk expand/collapse baris. Klik memunculkan **tabel bersarang** (`UTable` sendiri, header Variant/Branch/Condition/Quantity) di bawah baris. `DataTable.vue` (komponen tabel bersama) diperluas mendukung `v-model:expanded` + slot `#expanded` (fitur native TanStack Table row-expansion).
- Tombol **Kelola Varian** pada detail Inventory: warna diubah dari `neutral` ke `primary`.
- **Refactor sisa penamaan `product` → `inventory`/`item`**: variabel & prop di FE (`selectedProduct`/`fetchProducts` → `selectedItem`/`fetchItems`, prop `product` → `inventory` pada `VariantManagerModal`, `product*` → `inventory*` pada `handover/StockItems`, key i18n `entry.selectProduct` → `entry.selectInventory` + redaksi "product" → "item").

### Added
- **Tombol Log Aktivitas pada detail Inventory**: header detail item kini punya tombol **Log Aktivitas** (ikon jam riwayat) yang membuka **drawer** timeline — bergaya sama seperti Log Aktivitas Asset (`UTimeline`, ikon & warna per aksi, avatar pembuat, infinite-scroll) — menampilkan riwayat item (create/update) dan stoknya (entry/stock-in/transfer/assign/return) dari endpoint `GET /inventory-log`. Komponen baru `inventory/LogDrawer.vue`, service `inventory-log-service.ts`, tipe `InventoryLog`; `getActionIcon`/`getActionTheme` (`app/utils/action.ts`) diperluas untuk module `inventory`/`stock`.
- **Tab Transfer = riwayat + form transfer**: tab **Transfer** kini menampilkan **tabel riwayat transfer** (tanggal, cabang asal → tujuan, item + kondisi + qty, catatan, pembuat, lampiran). Tombol **Transfer** membuka modal `TransferModal` (pilih cabang asal/tujuan, baris varian dibatasi stok tersedia, catatan, `AttachmentManager`) dengan **validasi Zod** — jumlah tidak boleh melebihi stok tersedia & cabang asal ≠ tujuan.
- **Lampiran & Dibuat Oleh pada Inventory**: halaman create/edit punya `AttachmentManager` (upload lampiran, seperti asset); halaman detail menampilkan **Dibuat Oleh** (avatar + nama) dan daftar **lampiran** (chip link file).

### Fixed
- **Halaman edit Inventory** tidak lagi ikut me-render header/tab detail — `[id].vue` hanya membungkus `InventoryDetailWrapper` untuk view tab, sedangkan route `/edit` tampil standalone.

### Added (lanjutan)
- **Modal Tambah Stok** di tab **Stok**: baris **nested** (pilih **cabang** + **varian** + jumlah Baru/Bekas), bisa **multi-baris → multi-cabang multi-varian**; **catatan** pakai `UTextarea`; **lampiran** pakai `AttachmentManager` (pola sama seperti asset). Tab **Pergerakan** menampilkan ikon lampiran (link file) untuk movement stock-in.
- **Item Inventory selengkap Asset + create/edit sebagai halaman**: daftar `/inventory` kini menampilkan **foto, kategori, subkategori, satuan**, dan **kolom custom-label dinamis** (popover toggle). Create/edit tidak lagi modal tapi **halaman** 3 kolom (Kolom 1 foto, Kolom 2 konten, Kolom 3 varian) — upload foto + kamera, kategori/subkategori dengan **tambah-inline** (`CategoryAddModal`/`SubCategoryAddModal`), satuan (select), label repeater. Di create, tiap **varian** bisa langsung diisi **stok awal per cabang × kondisi** (baru/bekas). Satuan pindah ke level item (varian tak lagi punya unit).

### Changed
- **Refactor key/relasi `product` → `inventory`** di FE: tipe & service (`getByProduct` → `getByInventory`, `productId` → `inventoryId`, sub-objek `variant.product` → `variant.inventory`) agar konsisten dengan entity `Inventory`.

### Added (Inventory — batch awal)
- **Menu Inventory (Persediaan)**: satu menu `Inventory`/`Persediaan` bergaya seperti Asset — daftar item master (`/inventory`) yang dibuka ke halaman detail bertab: **Stok** (tabel expandable cabang → varian → kondisi baru/bekas via `UTable`), **Transfer** antar cabang, **Assign/Return**, dan **Pergerakan** (ledger). Kelola varian & edit item dari header detail. Service `inventory-service`, `inventory-variant-service`, `inventory-stock-service`; tipe di `types/inventory.d.ts`.
- **Assign & Return stok ke karyawan**: modal Assign (pilih karyawan, varian, cabang, kondisi, qty) & Return (dibatasi sisa yang dipegang) di tab Assign/Return; stok yang dikembalikan selalu jadi kondisi *bekas*.
- **Handover stok**: form Buat Serah Terima kini punya toggle **Jenis Item (Aset / Stok)**; saat Stok, builder item stok (item = varian + cabang + kondisi + qty). Halaman detail handover merender baris stok bila `itemKind = stock`.

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
