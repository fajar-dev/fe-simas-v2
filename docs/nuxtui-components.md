# 📦 NuxtUI v4 — Daftar Lengkap Komponen

> Referensi lengkap semua komponen NuxtUI v4 yang tersedia (`@nuxt/ui ^4.7.1`).
> Dokumentasi resmi: https://ui.nuxt.com/docs/components
>
> **Aturan**: Jika komponen yang dibutuhkan sudah ada di daftar ini, WAJIB gunakan NuxtUI. Dilarang membuat custom component.

---

## 1. Layout (8 komponen)

Komponen struktural untuk mengorganisir layout aplikasi.

| Komponen | Tag | Deskripsi | Docs |
|----------|-----|-----------|------|
| App | `<UApp>` | Root wrapper aplikasi, menyediakan toaster & theming | [Docs](https://ui.nuxt.com/docs/components/app) |
| Container | `<UContainer>` | Responsive container dengan max-width | [Docs](https://ui.nuxt.com/docs/components/container) |
| Error | `<UError>` | Error page display | [Docs](https://ui.nuxt.com/docs/components/error) |
| Footer | `<UFooter>` | Footer layout | [Docs](https://ui.nuxt.com/docs/components/footer) |
| Header | `<UHeader>` | Header layout (beda dari custom Header kita) | [Docs](https://ui.nuxt.com/docs/components/header) |
| Main | `<UMain>` | Main content area | [Docs](https://ui.nuxt.com/docs/components/main) |
| Sidebar | `<USidebar>` | Sidebar layout (beda dari custom Sidebar kita) | [Docs](https://ui.nuxt.com/docs/components/sidebar) |
| Theme | `<UTheme>` | Theme provider untuk nested theming | [Docs](https://ui.nuxt.com/docs/components/theme) |

> **Catatan**: Project ini menggunakan custom `Header.vue` dan `Sidebar.vue` karena kebutuhan spesifik (collapsible, mobile drawer). `UHeader` dan `USidebar` dari NuxtUI bisa dipertimbangkan untuk refactor di masa depan.

---

## 2. Element (16 komponen)

Elemen UI fundamental — building blocks utama.

| Komponen | Tag | Deskripsi | Digunakan? |
|----------|-----|-----------|------------|
| Alert | `<UAlert>` | Alert/notifikasi inline | ✅ Ya (forgot-password, reset-password) |
| Avatar | `<UAvatar>` | User avatar/profile picture | ✅ Ya (sidebar, popover) |
| AvatarGroup | `<UAvatarGroup>` | Group beberapa avatar | ❌ Belum |
| Badge | `<UBadge>` | Badge/label kecil | ❌ Belum |
| Banner | `<UBanner>` | Banner notifikasi atas halaman | ❌ Belum |
| Button | `<UButton>` | Tombol interaktif | ✅ Ya (utama) |
| Calendar | `<UCalendar>` | Kalender date picker | ❌ Belum |
| Card | `<UCard>` | Container card dengan padding | ✅ Ya (delete modal) |
| Chip | `<UChip>` | Indicator dot pada elemen | ❌ Belum |
| Collapsible | `<UCollapsible>` | Expandable/collapsible section | ❌ Belum |
| FieldGroup | `<UFieldGroup>` | Group beberapa form fields | ❌ Belum |
| Icon | `<UIcon>` | Iconify icon renderer | ✅ Ya (utama) |
| Kbd | `<UKbd>` | Keyboard shortcut indicator | ❌ Belum |
| Progress | `<UProgress>` | Progress bar | ❌ Belum |
| Separator | `<USeparator>` | Garis pemisah / divider | ✅ Ya (sign-in: "OR") |
| Skeleton | `<USkeleton>` | Loading skeleton placeholder | ❌ Belum |

---

## 3. Form (20 komponen)

Komponen form untuk input dan validasi data.

| Komponen | Tag | Deskripsi | Digunakan? |
|----------|-----|-----------|------------|
| Checkbox | `<UCheckbox>` | Single checkbox | ❌ Belum |
| CheckboxGroup | `<UCheckboxGroup>` | Group checkboxes | ❌ Belum |
| ColorPicker | `<UColorPicker>` | Color picker input | ❌ Belum |
| FileUpload | `<UFileUpload>` | File upload dropzone | ❌ Belum |
| Form | `<UForm>` | Form wrapper dengan validasi (Zod/Yup) | ✅ Ya (utama) |
| FormField | `<UFormField>` | Form field wrapper (label, error, hint) | ✅ Ya (utama) |
| Input | `<UInput>` | Text input standar | ✅ Ya (utama) |
| InputDate | `<UInputDate>` | Date picker input | ❌ Belum |
| InputMenu | `<UInputMenu>` | Input dengan dropdown menu autocomplete | ❌ Belum |
| InputNumber | `<UInputNumber>` | Numeric input dengan stepper | ❌ Belum |
| InputTags | `<UInputTags>` | Tag input (multiple values) | ❌ Belum |
| InputTime | `<UInputTime>` | Time picker input | ❌ Belum |
| Listbox | `<UListbox>` | List selection (single/multiple) | ❌ Belum |
| PinInput | `<UPinInput>` | OTP/PIN input | ❌ Belum |
| RadioGroup | `<URadioGroup>` | Radio button group | ❌ Belum |
| Select | `<USelect>` | Dropdown select | ✅ Ya (per page) |
| SelectMenu | `<USelectMenu>` | Searchable select dropdown | ❌ Belum |
| Slider | `<USlider>` | Range slider | ❌ Belum |
| Switch | `<USwitch>` | Toggle switch | ❌ Belum |
| Textarea | `<UTextarea>` | Multi-line text input | ❌ Belum |

---

## 4. Data (9 komponen)

Komponen untuk menampilkan dan mengorganisir data.

| Komponen | Tag | Deskripsi | Digunakan? |
|----------|-----|-----------|------------|
| Accordion | `<UAccordion>` | Expandable accordion sections | ❌ Belum |
| Carousel | `<UCarousel>` | Image/content carousel | ❌ Belum |
| Empty | `<UEmpty>` | Empty state placeholder | ❌ Belum |
| Marquee | `<UMarquee>` | Scrolling marquee animation | ❌ Belum |
| ScrollArea | `<UScrollArea>` | Custom scrollbar container | ❌ Belum |
| Table | `<UTable>` | Data table dengan sorting | ✅ Ya (contact list) |
| Timeline | `<UTimeline>` | Timeline/log display | ❌ Belum |
| Tree | `<UTree>` | Tree view (nested data) | ❌ Belum |
| User | `<UUser>` | User info display (avatar + name + desc) | ❌ Belum |

---

## 5. Navigation (8 komponen)

Komponen untuk navigasi dan wayfinding.

| Komponen | Tag | Deskripsi | Digunakan? |
|----------|-----|-----------|------------|
| Breadcrumb | `<UBreadcrumb>` | Breadcrumb navigation trail | ❌ Belum |
| CommandPalette | `<UCommandPalette>` | Command palette (⌘K) | ❌ Belum |
| FooterColumns | `<UFooterColumns>` | Footer dengan kolom links | ❌ Belum |
| Link | `<ULink>` | Styled link component | ❌ Belum |
| NavigationMenu | `<UNavigationMenu>` | Top navigation menu | ❌ Belum |
| Pagination | `<UPagination>` | Page pagination | ✅ Ya (contact list) |
| Stepper | `<UStepper>` | Step-by-step wizard | ❌ Belum |
| Tabs | `<UTabs>` | Tab navigation | ❌ Belum |

---

## 6. Overlay (8 komponen)

Elemen floating yang muncul di atas konten utama.

| Komponen | Tag | Deskripsi | Digunakan? |
|----------|-----|-----------|------------|
| ContextMenu | `<UContextMenu>` | Right-click context menu | ❌ Belum |
| Drawer | `<UDrawer>` | Bottom/side drawer sheet | ❌ Belum |
| DropdownMenu | `<UDropdownMenu>` | Dropdown menu (button trigger) | ✅ Ya (table actions) |
| Modal | `<UModal>` | Dialog modal | ✅ Ya (utama — CRUD modals) |
| Popover | `<UPopover>` | Popover tooltip/content | ✅ Ya (user profile) |
| Slideover | `<USlideover>` | Side panel overlay | ❌ Belum |
| Toast | `useToast()` | Toast notifications | ✅ Ya (utama) |
| Tooltip | `<UTooltip>` | Hover tooltip | ✅ Ya (sidebar collapsed) |

---

## 7. Dashboard (10 komponen)

Komponen khusus untuk membangun dashboard.

| Komponen | Tag | Deskripsi | Digunakan? |
|----------|-----|-----------|------------|
| DashboardGroup | `<UDashboardGroup>` | Group dashboard panels | ❌ Belum |
| DashboardNavbar | `<UDashboardNavbar>` | Top navbar dashboard | ❌ Belum |
| DashboardPanel | `<UDashboardPanel>` | Resizable panel | ❌ Belum |
| DashboardResizeHandle | `<UDashboardResizeHandle>` | Panel resize handle | ❌ Belum |
| DashboardSearch | `<UDashboardSearch>` | Search dialog (⌘K) | ❌ Belum |
| DashboardSearchButton | `<UDashboardSearchButton>` | Search trigger button | ❌ Belum |
| DashboardSidebar | `<UDashboardSidebar>` | Dashboard sidebar | ❌ Belum |
| DashboardSidebarCollapse | `<UDashboardSidebarCollapse>` | Sidebar collapse button | ❌ Belum |
| DashboardSidebarToggle | `<UDashboardSidebarToggle>` | Sidebar toggle (mobile) | ❌ Belum |
| DashboardToolbar | `<UDashboardToolbar>` | Toolbar actions bar | ❌ Belum |

> **Catatan**: Dashboard components sangat berguna! Pertimbangkan refactor ke `UDashboardSidebar` + `UDashboardPanel` untuk layout yang lebih konsisten.

---

## 8. Page / Marketing (23 komponen)

Pre-built sections untuk landing page dan marketing.

| Komponen | Tag | Deskripsi |
|----------|-----|-----------|
| AuthForm | `<UAuthForm>` | Pre-built auth form (login/register) |
| BlogPost | `<UBlogPost>` | Single blog post card |
| BlogPosts | `<UBlogPosts>` | Blog post grid |
| ChangelogVersion | `<UChangelogVersion>` | Changelog version entry |
| ChangelogVersions | `<UChangelogVersions>` | Changelog version list |
| Page | `<UPage>` | Page wrapper |
| PageAnchors | `<UPageAnchors>` | Page anchor navigation |
| PageAside | `<UPageAside>` | Page sidebar |
| PageBody | `<UPageBody>` | Page body content |
| PageCard | `<UPageCard>` | Feature card |
| PageColumns | `<UPageColumns>` | Multi-column layout |
| PageCTA | `<UPageCTA>` | Call-to-action section |
| PageFeature | `<UPageFeature>` | Feature highlight section |
| PageGrid | `<UPageGrid>` | Feature grid |
| PageHeader | `<UPageHeader>` | Page header with title |
| PageHero | `<UPageHero>` | Hero section |
| PageLinks | `<UPageLinks>` | Quick links section |
| PageList | `<UPageList>` | Feature list |
| PageLogos | `<UPageLogos>` | Logo cloud |
| PageSection | `<UPageSection>` | Generic page section |
| PricingPlan | `<UPricingPlan>` | Single pricing plan card |
| PricingPlans | `<UPricingPlans>` | Pricing plans grid |
| PricingTable | `<UPricingTable>` | Pricing comparison table |

---

## 9. AI Chat (8 komponen) `v4.3+`

Komponen untuk membangun chatbot/AI interface.

| Komponen | Tag | Deskripsi |
|----------|-----|-----------|
| ChatMessage | `<UChatMessage>` | Single chat message bubble |
| ChatMessages | `<UChatMessages>` | Chat messages container |
| ChatPalette | `<UChatPalette>` | Chat command palette |
| ChatPrompt | `<UChatPrompt>` | Chat input prompt |
| ChatPromptSubmit | `<UChatPromptSubmit>` | Submit button for prompt |
| ChatReasoning | `<UChatReasoning>` | AI reasoning display |
| ChatShimmer | `<UChatShimmer>` | Loading shimmer effect |
| ChatTool | `<UChatTool>` | Tool call display |

---

## 10. Editor (6 komponen) `v4.3+`

Rich text editor powered by TipTap.

| Komponen | Tag | Deskripsi |
|----------|-----|-----------|
| Editor | `<UEditor>` | Rich text editor |
| EditorDragHandle | `<UEditorDragHandle>` | Block drag handle |
| EditorEmojiMenu | `<UEditorEmojiMenu>` | Emoji picker menu |
| EditorMentionMenu | `<UEditorMentionMenu>` | @mention autocomplete |
| EditorSuggestionMenu | `<UEditorSuggestionMenu>` | Suggestion dropdown |
| EditorToolbar | `<UEditorToolbar>` | Formatting toolbar |

---

## 11. Content (5 komponen)

Komponen untuk dokumentasi (integrasi Nuxt Content).

| Komponen | Tag | Deskripsi |
|----------|-----|-----------|
| ContentNavigation | `<UContentNavigation>` | Navigation tree |
| ContentSearch | `<UContentSearch>` | Content search dialog |
| ContentSearchButton | `<UContentSearchButton>` | Search trigger button |
| ContentSurround | `<UContentSurround>` | Prev/Next navigation |
| ContentToc | `<UContentToc>` | Table of Contents |

---

## 12. Color Mode (5 komponen)

Komponen untuk dark/light mode switching.

| Komponen | Tag | Deskripsi |
|----------|-----|-----------|
| ColorModeAvatar | `<UColorModeAvatar>` | Avatar yang switch per mode |
| ColorModeButton | `<UColorModeButton>` | Toggle dark/light button |
| ColorModeImage | `<UColorModeImage>` | Image yang switch per mode |
| ColorModeSelect | `<UColorModeSelect>` | Color mode dropdown select |
| ColorModeSwitch | `<UColorModeSwitch>` | Color mode switch toggle |

---

## 13. i18n (1 komponen)

| Komponen | Tag | Deskripsi |
|----------|-----|-----------|
| LocaleSelect | `<ULocaleSelect>` | Language/locale selector |

---

## Ringkasan: Komponen yang Sudah Digunakan di Project

| Komponen | Penggunaan | File |
|----------|-----------|------|
| `UApp` | Root wrapper | `app.vue` |
| `UAlert` | Success/info alerts | Auth pages |
| `UAvatar` | User profile picture | Sidebar, UserPopover |
| `UButton` | Semua tombol | Seluruh project |
| `UCard` | Card wrapper | DeleteModal |
| `UDropdownMenu` | Action dropdown di table | Contact page |
| `UForm` | Form wrapper + validation | Modal forms, Auth pages |
| `UFormField` | Form field + label + error | Modal forms, Auth pages |
| `UIcon` | Semua icon (lucide) | Seluruh project |
| `UInput` | Text/email/password input | Modal forms, Auth pages |
| `UModal` | Dialog modal | CRUD modals |
| `UPagination` | Table pagination | Contact page |
| `UPopover` | User profile popover | UserPopover |
| `USelect` | Per-page selector | Contact page |
| `USeparator` | Divider "OR" | Sign-in page |
| `UTable` | Data table | Contact page |
| `UTooltip` | Sidebar tooltip | Sidebar |
| `useToast()` | Toast notifications | Service layer, pages |

## Komponen Potensial untuk Digunakan

Komponen NuxtUI yang belum digunakan tapi sangat berguna:

| Komponen | Kapan Digunakan |
|----------|----------------|
| `<UBadge>` | Status labels (active, inactive, pending) |
| `<USkeleton>` | Loading state sebelum data dimuat |
| `<UEmpty>` | Tampilan saat data kosong (no results) |
| `<UBreadcrumb>` | Navigasi breadcrumb di halaman detail |
| `<UTabs>` | Tab navigation (ganti custom tab) |
| `<USlideover>` | Detail panel dari samping |
| `<UDrawer>` | Bottom sheet (mobile) |
| `<USwitch>` | Toggle aktif/nonaktif |
| `<UTextarea>` | Multi-line input (keterangan, notes) |
| `<UCheckbox>` | Checkbox untuk bulk actions |
| `<UInputDate>` | Date picker untuk filter tanggal |
| `<USelectMenu>` | Searchable dropdown (filter by category) |
| `<UUser>` | Display user info (avatar + nama + email) |
| `<UDashboardSearch>` | Global search (⌘K) |
| `<UCommandPalette>` | Command palette navigation |
| `<UProgress>` | Progress bar (upload, process) |
| `<UStepper>` | Multi-step form wizard |
