<template>
  <div class="relative z-10 w-full max-w-[560px] px-4">
    <UCard
      class="w-full rounded-lg p-2 shadow-lg"
      :ui="{
        body: 'flex flex-col gap-6'
      }"
    >
      <!-- Logo and Header -->
      <div class="flex flex-col items-center text-center gap-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-[#e6f7ec] flex items-center justify-center">
            <UIcon name="i-lucide-book-open" class="w-6 h-6 text-[#009838]" />
          </div>
          <div class="text-left">
            <h1 class="text-lg font-bold text-neutral-900">{{ $t('pages.book.title') }}</h1>
            <p class="text-sm text-neutral-500">{{ $t('pages.book.description') }}</p>
          </div>
        </div>

        <!-- Tabs: Pinjam / Kembalikan -->
        <UTabs v-model="activeTab" :items="tabs" class="w-full" />
      </div>

      <!-- ═══ Tab: Pinjam (Borrow) ═══ -->
      <div v-if="activeTab === 'borrow'" class="space-y-5">
        <!-- Serial Number -->
        <div>
          <label class="text-sm font-medium text-neutral-700 block mb-1.5">
            {{ $t('pages.book.serialNumber') }} <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-2">
            <UInput
              v-model="borrowForm.serialNumber"
              :placeholder="$t('pages.book.serialPlaceholder')"
              :loading="isLookingUp"
              class="w-full"
              @keyup.enter="lookupAsset"
            >
              <template #leading>
                <UIcon name="i-lucide-hash" class="w-4 h-4 text-neutral-400" />
              </template>
            </UInput>
            <UButton icon="i-lucide-scan" color="neutral" variant="soft" square @click="() => { showScanner = true }" />
          </div>
        </div>

        <!-- Lookup error -->
        <UAlert
          v-if="lookupError"
          color="error"
          variant="soft"
          icon="i-lucide-triangle-alert"
          :title="lookupError"
          class="w-full"
        />

        <!-- Asset info (auto-filled after lookup) -->
        <div v-if="foundAsset" class="space-y-4">
          <UFormField :label="$t('pages.book.bookTitle')" required>
            <UInput :model-value="foundAsset.name" :placeholder="$t('pages.book.bookTitlePlaceholder')" class="w-full" disabled>
              <template #leading>
                <UIcon name="i-lucide-book-open" class="w-4 h-4 text-neutral-400" />
              </template>
            </UInput>
          </UFormField>

          <UFormField :label="$t('pages.book.category')" required>
            <UInput :model-value="foundAsset.subCategory?.category?.name || '-'" :placeholder="$t('pages.book.categoryPlaceholder')" class="w-full" disabled>
              <template #leading>
                <UIcon name="i-lucide-tag" class="w-4 h-4 text-neutral-400" />
              </template>
            </UInput>
          </UFormField>

          <!-- Borrow Note (optional) -->
          <UFormField :label="$t('pages.book.borrowNote')">
            <UTextarea
              v-model="borrowForm.assignNote"
              :placeholder="$t('pages.book.borrowNotePlaceholder')"
              class="w-full"
              :rows="3"
            />
          </UFormField>

          <!-- Borrow Photo (camera only) -->
          <div>
            <label class="text-sm font-medium text-neutral-700 block mb-1.5">
              {{ $t('pages.book.borrowPhoto') }} <span class="text-red-500">*</span>
            </label>
            <div v-if="borrowPhotoPreview" class="relative inline-block w-full aspect-square max-w-xs">
              <img :src="borrowPhotoPreview" class="w-full h-full rounded-lg object-cover border border-neutral-200" alt="Borrow photo" />
              <UButton icon="i-lucide-x" color="error" variant="solid" size="xs" class="absolute top-1 right-1 rounded-full" @click="removeBorrowPhoto" />
            </div>
            <div
              v-else
              class="flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-neutral-200 rounded-lg cursor-pointer hover:border-primary transition-colors"
              @click="() => { showBorrowCamera = true }"
            >
              <UIcon name="i-lucide-camera" class="w-10 h-10 text-neutral-300 mb-3" />
              <span class="text-sm text-neutral-500 mb-2">{{ $t('pages.book.borrowPhotoHint') }}</span>
              <UButton :label="$t('pages.book.openCamera')" icon="i-lucide-camera" color="neutral" variant="outline" size="sm" @click.stop="showBorrowCamera = true" />
            </div>
          </div>
        </div>

        <!-- Submit -->
        <UButton
          v-if="foundAsset"
          :label="$t('pages.book.borrowBook')"
          icon="i-lucide-book-open"
          color="success"
          block
          size="lg"
          :loading="isSubmitting"
          :disabled="!canBorrow"
          @click="handleBorrow"
        />
      </div>

      <!-- ═══ Tab: Kembalikan (Return) ═══ -->
      <div v-if="activeTab === 'return'" class="space-y-5">
        <!-- Select Book -->
        <UFormField :label="$t('pages.book.selectBook')" required>
          <USelectMenu
            v-model="selectedBorrowedBook"
            :items="borrowedBookOptions"
            :placeholder="$t('pages.book.selectBookPlaceholder')"
            :loading="isLoadingBorrowed"
            searchable
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-lucide-book-open" class="w-4 h-4 text-neutral-400" />
            </template>
          </USelectMenu>
        </UFormField>

        <UAlert
          v-if="!isLoadingBorrowed && borrowedBookOptions.length === 0"
          color="neutral"
          variant="soft"
          icon="i-lucide-info"
          :title="$t('pages.book.noBorrowedBooks')"
          class="w-full"
        />

        <!-- Goodreads Link → returnNote -->
        <UFormField v-if="selectedBorrowedBook" :label="$t('pages.book.goodreadsLink')">
          <UTextarea
            v-model="returnForm.goodreadsLink"
            :placeholder="$t('pages.book.goodreadsPlaceholder')"
            class="w-full"
            :rows="3"
          />
        </UFormField>

        <!-- Return Photo (camera only) -->
        <div v-if="selectedBorrowedBook">
          <label class="text-sm font-medium text-neutral-700 block mb-1.5">
            {{ $t('pages.book.returnPhoto') }} <span class="text-red-500">*</span>
          </label>
          <div v-if="returnPhotoPreview" class="relative inline-block w-full aspect-square max-w-xs">
            <img :src="returnPhotoPreview" class="w-full h-full rounded-lg object-cover border border-neutral-200" alt="Return photo" />
            <UButton icon="i-lucide-x" color="error" variant="solid" size="xs" class="absolute top-1 right-1 rounded-full" @click="removeReturnPhoto" />
          </div>
          <div
            v-else
            class="flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-neutral-200 rounded-lg cursor-pointer hover:border-primary transition-colors"
            @click="() => { showReturnCamera = true }"
          >
            <UIcon name="i-lucide-camera" class="w-10 h-10 text-neutral-300 mb-3" />
            <span class="text-sm text-neutral-500 mb-2">{{ $t('pages.book.returnPhotoHint') }}</span>
            <UButton :label="$t('pages.book.openCamera')" icon="i-lucide-camera" color="neutral" variant="outline" size="sm" @click.stop="showReturnCamera = true" />
          </div>
        </div>

        <!-- Submit -->
        <UButton
          v-if="selectedBorrowedBook"
          :label="$t('pages.book.returnBook')"
          icon="i-lucide-check-square"
          color="success"
          block
          size="lg"
          :loading="isSubmitting"
          :disabled="!canReturn"
          @click="handleReturn"
        />
      </div>
    </UCard>

    <!-- Modals -->
    <AssetScannerModal v-model="showScanner" :auto-close="true" @scanned="onScanned" />
    <CameraModal v-model="showBorrowCamera" @captured="onBorrowPhotoCaptured" />
    <CameraModal v-model="showReturnCamera" @captured="onReturnPhotoCaptured" />
  </div>
</template>

<script setup lang="ts">
import { assetService } from '~/services/asset-service'
import { bookService } from '~/services/book-service'
import { attachmentService } from '~/services/attachment-service'
import type { Asset } from '~/types/asset'
import type { AssetHolder } from '~/types/asset-holder'

const BOOK_CATEGORY_NAME = 'Buku'

const { t } = useI18n()
const toast = useToast()
const auth = useAuth()

definePageMeta({ layout: 'form' })

// ── Tabs ────────────────────────────────────────────────────────────────────
const activeTab = ref('borrow')
const tabs = computed(() => [
  { label: t('pages.book.borrow'), value: 'borrow', icon: 'i-lucide-book-open' },
  { label: t('pages.book.return'), value: 'return', icon: 'i-lucide-check-square' },
])

// ── Borrow State ────────────────────────────────────────────────────────────
const borrowForm = reactive({
  serialNumber: '',
  assignNote: '',
})
const foundAsset = ref<Asset | null>(null)
const lookupError = ref<string | null>(null)
const isLookingUp = ref(false)
const isSubmitting = ref(false)
const showScanner = ref(false)
const showBorrowCamera = ref(false)
const borrowPhotoPreview = ref<string | null>(null)
const borrowPhotoAttachmentId = ref<number | null>(null)

const canBorrow = computed(() => {
  return foundAsset.value && borrowPhotoAttachmentId.value && !isSubmitting.value
})

async function lookupAsset() {
  const serial = borrowForm.serialNumber.trim()
  if (!serial) return

  isLookingUp.value = true
  lookupError.value = null
  foundAsset.value = null

  try {
    // Step 1: Check code exists & get ID
    const checkRes = await assetService.checkCode(serial)
    if (!checkRes.success || !checkRes.data?.exists || !checkRes.data?.id) {
      lookupError.value = t('pages.book.assetNotFound')
      return
    }

    // Step 2: Get full asset details
    const assetRes = await assetService.getById(checkRes.data.id)
    if (!assetRes.success || !assetRes.data) {
      lookupError.value = t('pages.book.assetNotFound')
      return
    }

    const asset = assetRes.data

    // Validate: must be book category
    const categoryName = asset.subCategory?.category?.name || ''
    if (categoryName.toLowerCase() !== BOOK_CATEGORY_NAME.toLowerCase()) {
      lookupError.value = t('pages.book.notBookCategory')
      return
    }

    // Validate: holder feature must be enabled
    if (!asset.hasHolder) {
      lookupError.value = t('pages.book.holderNotEnabled')
      return
    }

    // Validate: must not have active holder
    if (asset.activeHolder) {
      lookupError.value = t('pages.book.alreadyBorrowed')
      return
    }

    foundAsset.value = asset
  } catch (e: any) {
    lookupError.value = e?.response?.data?.message || t('pages.book.assetNotFound')
  } finally {
    isLookingUp.value = false
  }
}

function onScanned(code: string) {
  borrowForm.serialNumber = code
  lookupAsset()
}

async function onBorrowPhotoCaptured(file: File) {
  borrowPhotoPreview.value = URL.createObjectURL(file)

  // Upload as attachment
  try {
    const res = await attachmentService.upload(file)
    if (res.success && res.data?.id) {
      borrowPhotoAttachmentId.value = res.data.id
    } else {
      toast.add({ title: t('pages.book.borrowFailed'), color: 'error', icon: 'i-lucide-circle-x' })
      removeBorrowPhoto()
    }
  } catch {
    toast.add({ title: t('pages.book.borrowFailed'), color: 'error', icon: 'i-lucide-circle-x' })
    removeBorrowPhoto()
  }
}

function removeBorrowPhoto() {
  if (borrowPhotoPreview.value) URL.revokeObjectURL(borrowPhotoPreview.value)
  if (borrowPhotoAttachmentId.value) {
    attachmentService.delete(borrowPhotoAttachmentId.value).catch(() => {})
  }
  borrowPhotoPreview.value = null
  borrowPhotoAttachmentId.value = null
}

async function handleBorrow() {
  if (!foundAsset.value || !borrowPhotoAttachmentId.value) return

  const employeeId = auth.state.user?.employee?.id
  if (!employeeId) {
    toast.add({ title: t('pages.book.noEmployeeLinked'), color: 'error', icon: 'i-lucide-circle-x' })
    return
  }

  isSubmitting.value = true
  try {
    const res = await bookService.borrow({
      assetId: foundAsset.value.id,
      assignNote: borrowForm.assignNote.trim() || undefined,
      attachmentIds: [borrowPhotoAttachmentId.value],
    })
    if (res.success) {
      toast.add({ title: t('pages.book.borrowSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
      resetBorrowForm()
    } else {
      toast.add({ title: res.message || t('pages.book.borrowFailed'), color: 'error', icon: 'i-lucide-circle-x' })
    }
  } catch (e: any) {
    toast.add({ title: e?.response?.data?.message || t('pages.book.borrowFailed'), color: 'error', icon: 'i-lucide-circle-x' })
  } finally {
    isSubmitting.value = false
  }
}

function resetBorrowForm() {
  borrowForm.serialNumber = ''
  borrowForm.assignNote = ''
  foundAsset.value = null
  lookupError.value = null
  if (borrowPhotoPreview.value) URL.revokeObjectURL(borrowPhotoPreview.value)
  borrowPhotoPreview.value = null
  borrowPhotoAttachmentId.value = null
}

// ── Return State ────────────────────────────────────────────────────────────
const returnForm = reactive({
  goodreadsLink: '',
})
const borrowedBooks = ref<AssetHolder[]>([])
const selectedBorrowedBook = ref<{ label: string; value: number } | undefined>(undefined)
const isLoadingBorrowed = ref(false)
const showReturnCamera = ref(false)
const returnPhotoPreview = ref<string | null>(null)
const returnPhotoAttachmentId = ref<number | null>(null)

const borrowedBookOptions = computed(() => {
  return borrowedBooks.value.map(h => ({
    label: `${h.asset?.name || '-'} (${h.asset?.code || '-'})`,
    value: h.id,
  }))
})

const canReturn = computed(() => {
  return selectedBorrowedBook.value && returnPhotoAttachmentId.value && !isSubmitting.value
})

async function loadBorrowedBooks() {
  const employeeId = auth.state.user?.employee?.id
  if (!employeeId) return

  isLoadingBorrowed.value = true
  try {
    const res = await bookService.getMyBooks()
    if (res.success && res.data) {
      borrowedBooks.value = res.data
    }
  } finally {
    isLoadingBorrowed.value = false
  }
}

async function onReturnPhotoCaptured(file: File) {
  returnPhotoPreview.value = URL.createObjectURL(file)

  try {
    const res = await attachmentService.upload(file)
    if (res.success && res.data?.id) {
      returnPhotoAttachmentId.value = res.data.id
    } else {
      toast.add({ title: t('pages.book.returnFailed'), color: 'error', icon: 'i-lucide-circle-x' })
      removeReturnPhoto()
    }
  } catch {
    toast.add({ title: t('pages.book.returnFailed'), color: 'error', icon: 'i-lucide-circle-x' })
    removeReturnPhoto()
  }
}

function removeReturnPhoto() {
  if (returnPhotoPreview.value) URL.revokeObjectURL(returnPhotoPreview.value)
  if (returnPhotoAttachmentId.value) {
    attachmentService.delete(returnPhotoAttachmentId.value).catch(() => {})
  }
  returnPhotoPreview.value = null
  returnPhotoAttachmentId.value = null
}

async function handleReturn() {
  if (!selectedBorrowedBook.value || !returnPhotoAttachmentId.value) return

  isSubmitting.value = true
  try {
    const returnNote = returnForm.goodreadsLink.trim() || undefined
    const res = await bookService.returnBook({
      assetHolderId: selectedBorrowedBook.value.value,
      returnNote,
      attachmentIds: [returnPhotoAttachmentId.value],
    })
    if (res.success) {
      toast.add({ title: t('pages.book.returnSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
      resetReturnForm()
      await loadBorrowedBooks()
    } else {
      toast.add({ title: res.message || t('pages.book.returnFailed'), color: 'error', icon: 'i-lucide-circle-x' })
    }
  } catch (e: any) {
    toast.add({ title: e?.response?.data?.message || t('pages.book.returnFailed'), color: 'error', icon: 'i-lucide-circle-x' })
  } finally {
    isSubmitting.value = false
  }
}

function resetReturnForm() {
  returnForm.goodreadsLink = ''
  selectedBorrowedBook.value = undefined
  if (returnPhotoPreview.value) URL.revokeObjectURL(returnPhotoPreview.value)
  returnPhotoPreview.value = null
  returnPhotoAttachmentId.value = null
}

// ── Watchers ────────────────────────────────────────────────────────────────
watch(activeTab, (tab) => {
  if (tab === 'return') {
    loadBorrowedBooks()
  }
})

// Load borrowed books on mount if starting on return tab
onMounted(() => {
  if (activeTab.value === 'return') {
    loadBorrowedBooks()
  }
})

onBeforeUnmount(() => {
  if (borrowPhotoPreview.value) URL.revokeObjectURL(borrowPhotoPreview.value)
  if (returnPhotoPreview.value) URL.revokeObjectURL(returnPhotoPreview.value)
})
</script>
