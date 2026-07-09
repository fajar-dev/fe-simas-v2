<template>
  <div class="space-y-6">
    <Header :title="$t('pages.assetHandover.createTitle')" :description="$t('pages.assetHandover.createDescription')" />

    <UCard class="w-full">
      <div class="w-full mb-4">
        <UButton :label="$t('common.back')" to="/handover" color="neutral" icon="i-lucide-arrow-left" variant="link" />
      </div>

      <UForm id="create-handover-form" :schema="schema" :state="form" @submit="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <!-- ═══ Column 1: Document Metadata ═══ -->
          <div class="space-y-4">
            <!-- Handed Over By Employee Select -->
            <UFormField :label="$t('pages.assetHandover.form.handedOverBy')" name="handedOverById" required>
              <USelectMenu
                v-model="selectedHandingOverEmployee"
                :items="employeeOptions"
                :avatar="selectedHandingOverEmployee?.avatar"
                searchable
                :searchable-placeholder="$t('pages.assetHandover.itemForm.searchEmployees')"
                :placeholder="$t('pages.assetHandover.form.handedOverByPlaceholder')"
                :loading="isLoadingEmployees"
                class="w-full"
              >
                <template #item="{ item }">
                  <UAvatar :src="item.avatar?.src" :alt="item.label" size="2xs" loading="lazy" />
                  <span>{{ item.label }}</span>
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Received By Employee Select -->
            <UFormField :label="$t('pages.assetHandover.form.receivedBy')" name="receivedById" required>
              <USelectMenu
                v-model="selectedEmployee"
                :items="employeeOptions"
                :avatar="selectedEmployee?.avatar"
                searchable
                :searchable-placeholder="$t('pages.assetHandover.itemForm.searchEmployees')"
                :placeholder="$t('pages.assetHandover.form.receivedByPlaceholder')"
                :loading="isLoadingEmployees"
                class="w-full"
              >
                <template #item="{ item }">
                  <UAvatar :src="item.avatar?.src" :alt="item.label" size="2xs" loading="lazy" />
                  <span>{{ item.label }}</span>
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Transaction Type -->
            <UFormField :label="$t('pages.assetHandover.form.transactionType')" name="transactionType" required>
              <USelect
                v-model="form.transactionType"
                :items="transactionTypeOptions"
                class="w-full"
              />
            </UFormField>

            <!-- Category -->
            <UFormField :label="$t('pages.assetHandover.form.category')" name="category" required>
              <USelect
                v-model="form.category"
                :items="categoryOptions"
                class="w-full"
              />
            </UFormField>

            <!-- Purpose -->
            <UFormField :label="$t('pages.assetHandover.form.purpose')" name="note">
              <UTextarea v-model="form.note" :placeholder="$t('pages.assetHandover.form.purposePlaceholder')" class="w-full" :rows="3" />
            </UFormField>

            <!-- Estimated Return Date -->
            <UFormField :label="$t('pages.assetHandover.form.estimatedReturnDate')" name="estimatedReturnDate">
              <UInputDate v-model="estimatedReturnDateVal" class="w-full">
                <template #trailing>
                  <UPopover>
                    <UButton icon="i-lucide-calendar" color="neutral" variant="ghost" size="sm" square />
                    <template #content>
                      <UCalendar v-model="estimatedReturnDateVal" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
            </UFormField>
          </div>

          <!-- ═══ Column 2 & 3: Items Listing ═══ -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 class="text-md font-semibold text-neutral-800 flex items-center gap-1.5">
                <UIcon name="i-lucide-box" class="text-primary w-5 h-5" />
                {{ $t('pages.assetHandover.form.items') }}
              </h3>

              <UButton
                type="button"
                color="primary"
                variant="soft"
                icon="i-lucide-scan-line"
                size="sm"
                :loading="isLookingUp"
                @click="() => { showScanner = true }"
              >
                {{ $t('pages.assetHandover.scan.button') }}
              </UButton>
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

            <!-- Empty state -->
            <div
              v-if="form.items.length === 0"
              class="flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-neutral-200 rounded-lg"
            >
              <UIcon name="i-lucide-scan-line" class="w-10 h-10 text-neutral-300 mb-3" />
              <span class="text-sm text-neutral-500 mb-3">{{ $t('pages.assetHandover.scan.empty') }}</span>
              <UButton
                type="button"
                :label="$t('pages.assetHandover.scan.button')"
                icon="i-lucide-scan-line"
                color="neutral"
                variant="outline"
                size="sm"
                :loading="isLookingUp"
                @click="() => { showScanner = true }"
              />
            </div>

            <!-- Scanned Items Rows -->
            <div v-else class="space-y-3">
              <div
                v-for="(item, index) in form.items"
                :key="item.assetId"
                class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 space-y-3"
              >
                <!-- Header of Row -->
                <div class="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wider shrink-0">Item {{ index + 1 }}</span>
                    <UBadge color="neutral" variant="subtle" size="sm">{{ item.code }}</UBadge>
                  </div>
                  <UButton
                    type="button"
                    color="error"
                    variant="soft"
                    icon="i-lucide-trash"
                    size="sm"
                    square
                    @click="removeItemRow(index)"
                  />
                </div>

                <!-- Asset info -->
                <div class="flex items-start gap-2.5">
                  <NuxtImg
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.name"
                    class="w-9 h-9 object-cover rounded-lg border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors shadow-2xs shrink-0"
                    @click="item.image && openLightbox(item.image)"
                  />
                  <div v-else class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <UIcon name="i-lucide-box" class="w-5 h-5 text-primary" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <span class="text-sm font-semibold text-neutral-800 block truncate">{{ item.name }}</span>
                    <span class="text-xs text-neutral-500 block truncate">{{ item.code }}</span>
                  </div>
                </div>

                <!-- Note (Keterangan) -->
                <UFormField :label="$t('pages.assetHandover.itemForm.note')">
                  <UTextarea v-model="item.note" :placeholder="$t('pages.assetHandover.itemForm.notePlaceholder')" class="w-full bg-white" :rows="3" />
                </UFormField>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-2 pt-4 mt-6 border-t border-neutral-100">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            to="/handover"
          >
            {{ $t('common.cancel') }}
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
          >
            {{ $t('pages.assetHandover.form.submit') }}
          </UButton>
        </div>
      </UForm>
    </UCard>

    <!-- Asset Scanner Modal -->
    <AssetScannerModal v-model="showScanner" :auto-close="true" @scanned="onScanned" />

    <!-- Lightbox Modal -->
    <Lightbox />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { parseDate } from '@internationalized/date'
import { assetHandoverService } from '~/services/asset-handover-service'
import { assetService } from '~/services/asset-service'
import { employeeService } from '~/services/employee-service'

definePageMeta({
  layout: 'dashboard'
})

const { t } = useI18n()
const toast = useToast()
const { openLightbox } = useLightbox()

// Options structures
const transactionTypeOptions = computed(() => [
  { label: t('pages.assetHandover.types.serah_terima'), value: 'serah_terima' },
  { label: t('pages.assetHandover.types.peminjaman'), value: 'peminjaman' },
  { label: t('pages.assetHandover.types.pengembalian'), value: 'pengembalian' },
])

const categoryOptions = computed(() => [
  { label: t('pages.assetHandover.types.inventaris_kantor'), value: 'inventaris_kantor' },
  { label: t('pages.assetHandover.types.aset_program_cicilan'), value: 'aset_program_cicilan' },
])

// Form state
const form = reactive({
  transactionType: 'serah_terima' as const,
  category: 'inventaris_kantor' as const,
  estimatedReturnDate: '',
  note: '',
  receivedById: undefined as unknown as number,
  handedOverById: undefined as unknown as number,
  items: [] as { assetId: number; name: string; code: string; image: string | null; note: string }[]
})

const estimatedReturnDateVal = computed({
  get: () => {
    if (!form.estimatedReturnDate) return undefined
    try { return parseDate(form.estimatedReturnDate.slice(0, 10)) } catch { return undefined }
  },
  set: (val) => {
    form.estimatedReturnDate = val ? val.toString() : ''
  }
})

// Visual bindings for select menu states
const selectedEmployee = ref<{ label: string; value: number; avatar?: any } | undefined>(undefined)
const selectedHandingOverEmployee = ref<{ label: string; value: number; avatar?: any } | undefined>(undefined)

// Monitor employee selections and sync
watch(selectedEmployee, (val) => {
  form.receivedById = val?.value ?? (undefined as any)
})

watch(selectedHandingOverEmployee, (val) => {
  form.handedOverById = val?.value ?? (undefined as any)
})

// ── Scan flow ─────────────────────────────────────────────────────────────
const showScanner = ref(false)
const isLookingUp = ref(false)
const lookupError = ref<string | null>(null)

const onScanned = (code: string) => {
  lookupAndAddAsset(code)
}

const lookupAndAddAsset = async (rawCode: string) => {
  const serial = rawCode.trim()
  if (!serial || isLookingUp.value) return

  isLookingUp.value = true
  lookupError.value = null

  try {
    // Step 1: Check code exists & get ID
    const checkRes = await assetService.checkCode(serial)
    if (!checkRes.success || !checkRes.data?.exists || !checkRes.data?.id) {
      lookupError.value = t('pages.assetHandover.scan.notFound')
      return
    }

    // Step 2: Get full asset details
    const assetRes = await assetService.getById(checkRes.data.id)
    if (!assetRes.success || !assetRes.data) {
      lookupError.value = t('pages.assetHandover.scan.notFound')
      return
    }

    const asset = assetRes.data

    // Validate: holder feature must be enabled
    if (!asset.hasHolder) {
      lookupError.value = t('pages.assetHandover.scan.holderNotEnabled')
      return
    }

    // Validate: must not have active holder
    if (asset.activeHolder) {
      lookupError.value = t('pages.assetHandover.scan.alreadyHasHolder')
      return
    }

    // Validate: last status must be active
    if (asset.lastStatus?.status !== 'active') {
      lookupError.value = t('pages.assetHandover.scan.notActive')
      return
    }

    // Validate: not already added in this form
    if (form.items.some((i) => i.assetId === asset.id)) {
      lookupError.value = t('pages.assetHandover.scan.alreadyAdded')
      return
    }

    // Validate: not tied to a pending handover
    if (pendingHandoverAssetIds.value.has(asset.id)) {
      lookupError.value = t('pages.assetHandover.scan.inPendingHandover')
      return
    }

    form.items.push({
      assetId: asset.id,
      name: asset.name,
      code: asset.code,
      image: asset.image,
      note: ''
    })

    toast.add({
      title: t('pages.assetHandover.scan.added'),
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
  } finally {
    isLookingUp.value = false
  }
}

const removeItemRow = (index: number) => {
  form.items.splice(index, 1)
}

// Zod schema for form validation
const schema = z.object({
  transactionType: z.enum(['serah_terima', 'peminjaman', 'pengembalian']),
  category: z.enum(['inventaris_kantor', 'aset_program_cicilan']),
  estimatedReturnDate: z.string().optional().or(z.literal('')),
  note: z.string().optional().or(z.literal('')),
  receivedById: z.number().int().positive(t('pages.assetHandover.form.validation.receivedByRequired')),
  handedOverById: z.number().int().positive(t('pages.assetHandover.form.validation.handedOverByRequired')),
  items: z.array(
    z.object({
      assetId: z.number().int().positive(t('pages.assetHandover.form.validation.assetRequired')),
      note: z.string().optional().nullable(),
    })
  ).min(1, t('pages.assetHandover.form.validation.itemsRequired'))
})

// Dropdown data sourcing
const employeeOptions = ref<{ label: string; value: number; avatar?: any }[]>([])
const pendingHandoverAssetIds = ref<Set<number>>(new Set())

const isLoadingEmployees = ref(false)
const isSubmitting = ref(false)

// Fetch master options
const loadMasterData = async () => {
  isLoadingEmployees.value = true
  try {
    // 1. Fetch pending handover asset IDs to block them
    const pendingHandoversRes = await assetHandoverService.getAll(1, 200, '', '', '', 'pending')
    if (pendingHandoversRes.success && pendingHandoversRes.data) {
      const ids = new Set<number>()
      pendingHandoversRes.data.forEach((h) => {
        h.items.forEach((item) => {
          if (item.asset) ids.add(item.asset.id)
        })
      })
      pendingHandoverAssetIds.value = ids
    }

    // 2. Fetch active employees
    const empRes = await employeeService.getList(true)
    if (empRes.success && empRes.data) {
      employeeOptions.value = empRes.data.map(e => ({
        label: `${e.name} (${e.employeeId})`,
        value: e.id,
        avatar: e.photo ? {
          src: e.photo,
          alt: e.name,
          loading: 'lazy' as const
        } : undefined
      }))
    }
  } finally {
    isLoadingEmployees.value = false
  }
}

// Handle form submit
const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      receivedById: form.receivedById,
      handedOverById: form.handedOverById,
      transactionType: form.transactionType,
      category: form.category,
      estimatedReturnDate: form.estimatedReturnDate || null,
      note: form.note || null,
      items: form.items.map(item => ({
        assetId: item.assetId,
        note: item.note || null,
      }))
    }

    const response = await assetHandoverService.create(payload)
    if (response.success) {
      toast.add({
        title: t('pages.assetHandover.form.successCreate'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      navigateTo('/handover')
    } else {
      toast.add({
        title: response.message || 'Error occurred',
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    }
  } catch (error: any) {
    console.error('Handover creation error:', error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadMasterData()
})
</script>
