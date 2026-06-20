import { z } from 'zod'
import { parseDate } from '@internationalized/date'
import { assetService } from '~/services/asset-service'
import { categoryService } from '~/services/category-service'
import { subCategoryService } from '~/services/sub-category-service'
import type { AssetPayload, AssetLabel } from '~/types/asset'

export const assetSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  categoryId: z.number().int().positive('Category is required').optional(),
  name: z.string().min(1, 'Name is required'),
  subCategoryId: z.number().int().positive('Sub category is required'),
  brand: z.string().optional().nullable().or(z.literal('')),
  model: z.string().optional().nullable().or(z.literal('')),
  price: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number().int().nullable().optional()
  ),
  purchaseDate: z.string().optional().nullable().or(z.literal('')),
  description: z.string().optional().nullable().or(z.literal('')),
})

export function useAssetForm() {
  const toast = useToast()
  const isUploading = ref(false)
  const previewUrl = ref<string | null>(null)

  // ── Labels ──────────────────────────────────────────────────────────────
  const labels = ref<AssetLabel[]>([])
  const addLabel = () => { labels.value.push({ key: '', value: '' }) }
  const removeLabel = (index: number) => { labels.value.splice(index, 1) }
  const getFilteredLabels = () =>
    labels.value
      .filter(l => l.key.trim() && l.value.trim())
      .map(l => ({ key: l.key.trim(), value: l.value.trim() }))

  // ── Category & Sub Category ─────────────────────────────────────────────
  const selectedCategoryId = ref<number | undefined>(undefined)
  const categoryOptions = ref<{ label: string; value: number }[]>([])
  const subCategoryOptions = ref<{ label: string; value: number }[]>([])
  const isLoadingSubCategories = ref(false)
  const lastFetchedCategoryId = ref<number | undefined>(undefined)
  const showAddCategory = ref(false)
  const showAddSubCategory = ref(false)

  const fetchCategories = async () => {
    const res = await categoryService.getAll(1, 999)
    if (res.success) {
      categoryOptions.value = res.data.map((c) => ({ label: c.name, value: c.id }))
    }
  }

  const fetchSubCategories = async (categoryId: number) => {
    isLoadingSubCategories.value = true
    try {
      const res = await subCategoryService.getByCategoryId(categoryId)
      if (res.success) {
        subCategoryOptions.value = res.data.map((s) => ({ label: s.name, value: s.id }))
        lastFetchedCategoryId.value = categoryId
      }
    } finally {
      isLoadingSubCategories.value = false
    }
  }

  const onCategoryCreated = async () => {
    await fetchCategories()
    const last = categoryOptions.value[categoryOptions.value.length - 1]
    if (last) selectedCategoryId.value = last.value
  }

  const onSubCategoryCreated = async (form: { subCategoryId: number }) => {
    if (!selectedCategoryId.value) return
    await fetchSubCategories(Number(selectedCategoryId.value))
    const last = subCategoryOptions.value[subCategoryOptions.value.length - 1]
    if (last) form.subCategoryId = last.value
  }

  // ── Image Upload ────────────────────────────────────────────────────────
  const fileInput = ref<HTMLInputElement | null>(null)

  const triggerFileInput = () => { fileInput.value?.click() }

  const onFileChange = async (e: Event, form: { image?: string | null }) => {
    const file = (e.target as HTMLInputElement)?.files?.[0]
    if (!file) return
    previewUrl.value = URL.createObjectURL(file)
    isUploading.value = true
    try {
      const response = await assetService.uploadImage(file)
      if (response.success && response.data?.path) {
        form.image = response.data.path
        toast.add({ title: 'Image uploaded successfully!', color: 'success', icon: 'i-lucide-circle-check' })
      }
    } finally {
      isUploading.value = false
    }
  }

  const removeImage = (form: { image?: string | null }) => {
    form.image = null
    previewUrl.value = null
    if (fileInput.value) fileInput.value.value = ''
  }

  // ── Computed Helpers ────────────────────────────────────────────────────
  const makePurchaseDateComputed = (form: { purchaseDate?: string }) => computed({
    get: () => {
      if (!form.purchaseDate) return undefined
      try { return parseDate(form.purchaseDate) } catch { return undefined }
    },
    set: (val) => { form.purchaseDate = val ? val.toString() : '' }
  })

  const makePriceDisplayComputed = (form: { price?: number }) => computed({
    get: () => formatIndonesianNumber(form.price),
    set: (val) => { form.price = parseIndonesianNumber(val) as any }
  })

  const availableLabelKeys = ref<string[]>([])
  const fetchLabelKeys = async () => {
    const res = await assetService.getLabelKeys()
    if (res.success) {
      availableLabelKeys.value = res.data
    }
  }

  return {
    toast,
    isUploading,
    previewUrl,
    // Labels
    labels,
    addLabel,
    removeLabel,
    getFilteredLabels,
    availableLabelKeys,
    fetchLabelKeys,
    // Category
    selectedCategoryId,
    categoryOptions,
    subCategoryOptions,
    isLoadingSubCategories,
    lastFetchedCategoryId,
    showAddCategory,
    showAddSubCategory,
    fetchCategories,
    fetchSubCategories,
    onCategoryCreated,
    onSubCategoryCreated,
    // Image
    fileInput,
    triggerFileInput,
    onFileChange,
    removeImage,
    // Helpers
    makePurchaseDateComputed,
    makePriceDisplayComputed,
  }
}
