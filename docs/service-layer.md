# 🔌 Service Layer Guide

## Arsitektur Service Layer

```
app/services/
├── api-service.ts        # Base HTTP client (Axios) + interceptors
├── auth-service.ts       # Auth: login, logout, refresh, Google OAuth
└── <feature>-service.ts  # Feature CRUD operations

app/composables/
├── useAuth.ts            # Auth state accessor
├── useNavigation.ts      # Sidebar nav config
└── error-helper.ts       # Global error handler
```

## 1. API Service (Base Client)

`api-service.ts` adalah fondasi semua HTTP request. **Jangan edit file ini** kecuali untuk menambah interceptor.

```typescript
// Singleton instance
export const apiService = new ApiService()
```

### Fitur:
- **Axios instance** dengan `baseURL` dari `runtimeConfig.public.apiUrl`
- **Auto-refresh token** saat mendapat 401 via interceptor
- **Auto-redirect** ke `/auth/sign-in` jika refresh gagal
- **Auto-redirect** ke `/` jika mendapat 403 (forbidden)

### Penggunaan di Service:

```typescript
// Semua request melalui apiService.client
const response = await apiService.client.get<ApiResponse<T>>('/endpoint', this.authHeaders)
const response = await apiService.client.post<ApiResponse<T>>('/endpoint', payload, this.authHeaders)
const response = await apiService.client.put<ApiResponse<T>>('/endpoint', payload, this.authHeaders)
const response = await apiService.client.delete<ApiResponse<T>>('/endpoint', this.authHeaders)
```

## 2. Pattern Service Class

Setiap feature memiliki service class yang mengikuti pattern ini:

```typescript
import { apiService } from "./api-service"
import { handleServiceError } from "../composables/error-helper"
import type { Feature, FeaturePayload, ApiResponse } from "../types/feature"

export class FeatureService {

  // Auth headers — WAJIB di setiap request yang butuh auth
  private get authHeaders() {
    return { headers: { Authorization: `Bearer ${useAuth().state.token}` } }
  }

  // GET ALL (dengan pagination + search)
  async getAll(page = 1, perPage = 10, q = ''): Promise<ApiResponse<Feature[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<Feature[]>>(
        `/feature?page=${page}&perPage=${perPage}&q=${q}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET BY ID
  async getById(id: number): Promise<ApiResponse<Feature>> {
    try {
      const response = await apiService.client.get<ApiResponse<Feature>>(
        `/feature/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // CREATE
  async create(payload: FeaturePayload): Promise<ApiResponse<Feature>> {
    try {
      const response = await apiService.client.post<ApiResponse<Feature>>(
        `/feature`,
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // UPDATE
  async update(id: number, payload: FeaturePayload): Promise<ApiResponse<Feature>> {
    try {
      const response = await apiService.client.put<ApiResponse<Feature>>(
        `/feature/${id}`,
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // DELETE
  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.delete<ApiResponse<null>>(
        `/feature/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

// Export singleton — WAJIB
export const featureService = new FeatureService()
```

### Aturan Service:
1. **Selalu export sebagai singleton** — `export const featureService = new FeatureService()`
2. **Selalu gunakan `authHeaders`** — Untuk endpoint yang membutuhkan auth
3. **Selalu wrap dalam try-catch** — Catch diarahkan ke `handleServiceError`
4. **Selalu type response** — `apiService.client.get<ApiResponse<Feature[]>>`
5. **Return `response.data`** — Bukan `response`, karena Axios wrap di `.data`

## 3. Error Handler

`error-helper.ts` menangani semua error dari service secara global:

```typescript
export const handleServiceError = (error: any): never => {
  if (axios.isCancel(error)) {
    throw error                    // Re-throw cancelled requests
  }

  const toast = useToast()
  const responseData = error.response?.data

  let title = responseData?.message || 'Gagal'
  let message = ''

  // Handle validation errors (422)
  if (error.response?.status === 422 && responseData?.errors) {
    message = responseData.errors.map((err: any) => err.message).join(', ')
  } else {
    message = responseData?.message || error.message || 'Terjadi kesalahan'
    if (message === title) message = ''
  }

  toast.add({
    title,
    description: message,
    icon: 'i-lucide-circle-x',
    color: 'error'
  })

  throw new Error()               // Re-throw to stop execution
}
```

### Behaviour:
- **422 (Validation)**: Menampilkan semua pesan error digabung dengan koma
- **Error lain**: Menampilkan `message` dari response
- **Selalu throw** — Caller harus handle di `finally` block, bukan `catch`

## 4. Type Definitions

### Pattern Type File (`app/types/<feature>.d.ts`)

```typescript
// Data model dari API
export interface Feature {
  id: number
  name: string
  // ... field lain sesuai API response
  createdAt?: string
  updatedAt?: string
}

// Payload untuk create/update
export interface FeaturePayload {
  name: string
  // ... field yang dikirim ke API (tanpa id, timestamps)
}

// Pagination meta (sudah ada di contact.d.ts, bisa dipakai ulang)
export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  from: number
  to: number
}

// API Response wrapper (sudah ada di contact.d.ts & auth.d.ts)
export interface ApiResponse<T = any> {
  success: boolean
  statusCode?: number
  message?: string
  data: T
  meta?: PaginationMeta
}
```

> **⚠️ TODO**: `ApiResponse` dan `PaginationMeta` saat ini didefinisikan di dua file (`auth.d.ts` dan `contact.d.ts`). Idealnya dipindahkan ke `app/types/api.d.ts` sebagai shared type.

## 5. Auth Service

`auth-service.ts` menangani semua authentication:

### Methods:

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `login(email, password)` | `POST /auth/login` | Login dengan credentials |
| `google(code)` | `POST /auth/google` | Login via Google OAuth |
| `forgotPassword(email)` | `POST /auth/forgot-password` | Request reset link |
| `validateResetPassword(email, token)` | `GET /auth/validate-reset-token` | Validasi reset token |
| `resetPassword(token, password)` | `POST /auth/reset-password` | Reset password |
| `logout()` | `POST /auth/logout` | Logout + clear session |
| `refreshToken()` | `POST /auth/refresh` | Auto-refresh token |

### Session Management:

```
localStorage:
├── accessToken   → Bearer token untuk API requests
├── refreshToken  → Token untuk refresh
└── user          → JSON string user object
```

### useAuth Composable:

```typescript
const { state, service } = useAuth()

// Read-only state
state.token  // string | null
state.user   // User | null

// Service methods
service.logout()
service.login(email, password)
```

## 6. Composables

### useAuth

- **Fungsi**: Accessor untuk auth state (readonly getter)
- **Penggunaan**: Di component yang perlu akses user/token
- **Jangan**: Modifikasi state langsung, gunakan `authService` methods

### useNavigation

- **Fungsi**: Konfigurasi sidebar navigation + active state detection
- **Data**: `navGroups` (menu utama), `bottomNavItems` (menu bawah), `isCollapsed` (sidebar state)
- **Tambah menu**: Tambahkan item baru di `navGroups` atau `bottomNavItems`

```typescript
// Menambah menu baru:
const navGroups: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Dashboard', to: '/', icon: 'i-lucide-layout-dashboard' },
      { label: 'Contact', to: '/contact', icon: 'i-lucide-users-round' },
      // Tambah di sini:
      { label: 'Product', to: '/product', icon: 'i-lucide-package' }
    ]
  }
]
```

### error-helper (handleServiceError)

- **Fungsi**: Global error handler untuk service layer
- **Auto**: Menampilkan toast error
- **Auto**: Handle validation errors (422)
- **Selalu throw**: Caller harus handle di `finally`

## 7. Import Pattern

```typescript
// Service — direct import
import { contactService } from '~/services/contact-service'

// Types — type-only import
import type { Contact, ContactPayload } from '~/types/contact'

// Composable — auto-imported oleh Nuxt (tidak perlu import)
const { state } = useAuth()
const toast = useToast()
const route = useRoute()

// External lib
import { z } from 'zod'
import axios from 'axios'
```

## 8. Checklist Membuat Service Baru

1. Buat file type: `app/types/<feature>.d.ts`
2. Buat file service: `app/services/<feature>-service.ts`
3. Ikuti pattern `ContactService` persis
4. Export singleton di akhir file
5. Gunakan `handleServiceError` di setiap catch
6. Type semua response dengan generic `ApiResponse<T>`
7. Tambahkan `authHeaders` di setiap method yang butuh auth
