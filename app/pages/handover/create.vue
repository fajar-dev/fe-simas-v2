<template>
  <div class="space-y-6">
    <Header
      :title="$t('pages.handover.createTitle')"
      :description="$t('pages.handover.createDescription')"
    />

    <UCard class="w-full">
      <div class="w-full mb-4">
        <UButton
          :label="$t('common.back')"
          to="/handover"
          color="neutral"
          icon="i-lucide-arrow-left"
          variant="link"
        />
      </div>

      <UForm
        id="create-handover-form"
        :schema="schema"
        :state="form"
        @submit="handleSubmit"
      >
        <!-- Transaction Type: top-level radio (Penetapan / Pengembalian) -->
        <UFormField
          :label="$t('pages.handover.form.transactionType')"
          name="transactionType"
          required
          class="mb-6"
        >
          <URadioGroup
            v-model="form.transactionType"
            :items="transactionTypeOptions"
            orientation="horizontal"
          />
        </UFormField>

        <!-- ═══ Document Metadata — full width, employee pickers paired side by side ═══ -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-4">
          <!-- Handed Over By Employee Select -->
          <UFormField
            :label="$t('pages.handover.form.handedOverBy')"
            name="handedOverById"
            required
          >
            <USelectMenu
              v-model="selectedHandingOverEmployee"
              :items="employeeOptions"
              :avatar="selectedHandingOverEmployee?.avatar"
              searchable
              :searchable-placeholder="$t('pages.handover.itemForm.searchEmployees')"
              :placeholder="$t('pages.handover.form.handedOverByPlaceholder')"
              :loading="isLoadingEmployees"
              class="w-full"
            >
              <template #item="{ item }">
                <UAvatar
                  :src="item.avatar?.src"
                  :alt="item.label"
                  size="2xs"
                  loading="lazy"
                />
                <span>{{ item.label }}</span>
              </template>
            </USelectMenu>
          </UFormField>

          <!-- Received By Employee Select -->
          <UFormField
            :label="$t('pages.handover.form.receivedBy')"
            name="receivedById"
            required
          >
            <USelectMenu
              v-model="selectedEmployee"
              :items="employeeOptions"
              :avatar="selectedEmployee?.avatar"
              searchable
              :searchable-placeholder="$t('pages.handover.itemForm.searchEmployees')"
              :placeholder="$t('pages.handover.form.receivedByPlaceholder')"
              :loading="isLoadingEmployees"
              class="w-full"
            >
              <template #item="{ item }">
                <UAvatar
                  :src="item.avatar?.src"
                  :alt="item.label"
                  size="2xs"
                  loading="lazy"
                />
                <span>{{ item.label }}</span>
              </template>
            </USelectMenu>
          </UFormField>
        </div>

        <!-- Note -->
        <UFormField
          :label="$t('pages.handover.form.note')"
          name="note"
          class="mb-4"
        >
          <UTextarea
            v-model="form.note"
            :placeholder="$t('pages.handover.form.notePlaceholder')"
            class="w-full"
            :rows="2"
          />
        </UFormField>

        <!-- Configurable custom fields for the selected type -->
        <HandoverCustomFields
          v-model="form.customFields"
          :fields="customFieldDefs"
          class="mb-4"
        />

        <!-- Supporting documents, alongside the auto-generated signing form -->
        <AttachmentManager
          v-model="attachments"
          class="mb-6"
          @change="(ids: number[]) => { attachmentIds = ids }"
        />

        <!-- ═══ Items: asset items and stock items side by side ═══ -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-6 pt-6 border-t border-neutral-100">
          <!-- Asset items -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 class="text-md font-semibold text-neutral-800 flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-box"
                  class="text-primary w-5 h-5"
                />
                {{ $t('pages.handover.form.assetItems') }}
              </h3>

              <UButton
                v-if="form.transactionType === 'return'"
                type="button"
                color="primary"
                variant="soft"
                icon="i-lucide-plus"
                size="sm"
                @click="() => { showAssetPicker = true }"
              >
                {{ $t('pages.handover.stock.addItem') }}
              </UButton>
              <UButton
                v-else
                type="button"
                color="primary"
                variant="soft"
                icon="i-lucide-scan-line"
                size="sm"
                :loading="isLookingUp"
                @click="() => { showScanner = true }"
              >
                {{ $t('pages.handover.scan.button') }}
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
              <UIcon
                :name="form.transactionType === 'return' ? 'i-lucide-box' : 'i-lucide-scan-line'"
                class="w-10 h-10 text-neutral-300 mb-3"
              />
              <span class="text-sm text-neutral-500 mb-3">{{ form.transactionType === 'return' ? $t('pages.handover.form.assetItemsEmptyReturn') : $t('pages.handover.scan.empty') }}</span>
              <UButton
                v-if="form.transactionType === 'return'"
                type="button"
                :label="$t('pages.handover.stock.addItem')"
                icon="i-lucide-plus"
                color="neutral"
                variant="outline"
                size="sm"
                @click="() => { showAssetPicker = true }"
              />
              <UButton
                v-else
                type="button"
                :label="$t('pages.handover.scan.button')"
                icon="i-lucide-scan-line"
                color="neutral"
                variant="outline"
                size="sm"
                :loading="isLookingUp"
                @click="() => { showScanner = true }"
              />
            </div>

            <!-- Scanned Items Rows -->
            <div
              v-else
              class="space-y-3"
            >
              <div
                v-for="(item, index) in form.items"
                :key="item.assetId"
                class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 space-y-3"
              >
                <!-- Header of Row -->
                <div class="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wider shrink-0">Item {{ index + 1 }}</span>
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
                  <div
                    v-else
                    class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
                  >
                    <UIcon
                      name="i-lucide-box"
                      class="w-5 h-5 text-primary"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <span class="text-sm font-semibold text-neutral-800 block truncate">{{ item.name }}</span>
                    <span class="text-xs text-neutral-500 block truncate">{{ item.code }}</span>
                  </div>
                </div>

                <!-- Note (Keterangan) -->
                <UFormField :label="$t('pages.handover.itemForm.note')">
                  <UTextarea
                    v-model="item.note"
                    :placeholder="$t('pages.handover.itemForm.notePlaceholder')"
                    class="w-full bg-white"
                    :rows="3"
                  />
                </UFormField>
              </div>
            </div>
          </div>

          <!-- Stock items -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 class="text-md font-semibold text-neutral-800 flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-layers"
                  class="text-primary w-5 h-5"
                />
                {{ $t('pages.handover.form.stockItems') }}
              </h3>

              <UButton
                type="button"
                color="primary"
                variant="soft"
                icon="i-lucide-plus"
                size="sm"
                @click="() => { showStockModal = true }"
              >
                {{ $t('pages.handover.stock.addItem') }}
              </UButton>
            </div>

            <!-- Empty state -->
            <div
              v-if="form.stockItems.length === 0"
              class="flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-neutral-200 rounded-lg"
            >
              <UIcon
                name="i-lucide-layers"
                class="w-10 h-10 text-neutral-300 mb-3"
              />
              <span class="text-sm text-neutral-500 mb-3">{{ $t('pages.handover.stock.empty') }}</span>
              <UButton
                type="button"
                :label="$t('pages.handover.stock.addItem')"
                icon="i-lucide-plus"
                color="neutral"
                variant="outline"
                size="sm"
                @click="() => { showStockModal = true }"
              />
            </div>

            <!-- Added rows -->
            <div
              v-else
              class="space-y-3"
            >
              <div
                v-for="(item, index) in form.stockItems"
                :key="index"
                class="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50 space-y-3"
              >
                <!-- Header of Row -->
                <div class="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wider shrink-0">Item {{ index + 1 }}</span>
                  <UButton
                    type="button"
                    color="error"
                    variant="soft"
                    icon="i-lucide-trash"
                    size="sm"
                    square
                    @click="removeStockRow(index)"
                  />
                </div>

                <!-- Stock info -->
                <div class="flex items-start gap-2.5">
                  <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <UIcon
                      name="i-lucide-layers"
                      class="w-5 h-5 text-primary"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <span class="text-sm font-semibold text-neutral-800 block truncate">{{ item.inventoryName }} — {{ item.variantName }}</span>
                    <span class="text-xs text-neutral-500 block truncate">
                      {{ item.branchName }} ·
                      <span v-if="form.transactionType === 'assign'">{{ item.condition === 'new' ? $t('pages.inventory.condition.new') : $t('pages.inventory.condition.used') }} · </span>
                      {{ item.quantity }}
                    </span>
                  </div>
                </div>

                <!-- Note (Keterangan) -->
                <UFormField :label="$t('pages.handover.itemForm.note')">
                  <UTextarea
                    v-model="item.note"
                    :placeholder="$t('pages.handover.itemForm.notePlaceholder')"
                    class="w-full bg-white"
                    :rows="3"
                  />
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
            {{ $t('pages.handover.form.submit') }}
          </UButton>
        </div>
      </UForm>
    </UCard>

    <!-- Asset Scanner Modal (assign) -->
    <AssetScannerModal
      v-model="showScanner"
      :auto-close="true"
      @scanned="onScanned"
    />

    <!-- Asset Picker Modal (return) -->
    <HandoverAssetPicker
      v-model="showAssetPicker"
      :employee-id="form.transactionType === 'return' ? form.handedOverById : undefined"
      :exclude-asset-ids="excludeAssetIds"
      @select="onAssetPicked"
    />

    <!-- Stock Item Modal -->
    <HandoverStockItems
      v-model:open="showStockModal"
      v-model:rows="form.stockItems"
      :transaction-type="form.transactionType"
      :employee-id="form.transactionType === 'return' ? form.handedOverById : undefined"
    />

    <!-- Lightbox Modal -->
    <Lightbox />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { handoverService } from '~/services/handover-service'
import { handoverFieldService } from '~/services/handover-field-service'
import { assetService } from '~/services/asset-service'
import { employeeService } from '~/services/employee-service'
import type { HandoverField } from '~/types/handover-field'
import type { HandoverStockRow } from '~/components/handover/StockItems.vue'
import type { Attachment } from '~/types/attachment'

definePageMeta({
  layout: 'dashboard'
})

const { t } = useI18n()
const toast = useToast()
const { openLightbox } = useLightbox()

// Options structures
const transactionTypeOptions = computed(() =>
  HANDOVER_TRANSACTION_TYPES.map(v => ({ label: t(`pages.handover.types.${v}`), value: v }))
)

// Form state
const form = reactive({
  transactionType: 'assign' as TransactionType,
  note: '',
  receivedById: undefined as unknown as number,
  handedOverById: undefined as unknown as number,
  customFields: {} as Record<string, string | null>,
  items: [] as { assetId: number, name: string, code: string, image: string | null, note: string }[],
  stockItems: [] as HandoverStockRow[]
})

// Supporting documents uploaded by the user (the signing form is generated server-side).
const attachments = ref<Attachment[]>([])
const attachmentIds = ref<number[]>([])

// Custom fields configured for the selected transaction type.
const customFieldDefs = ref<HandoverField[]>([])
const fetchCustomFields = async (type: TransactionType) => {
  const res = await handoverFieldService.getByType(type)
  customFieldDefs.value = res.success && res.data ? res.data : []
}

// Visual bindings for select menu states
const selectedEmployee = ref<{ label: string, value: number, avatar?: any } | undefined>(undefined)
const selectedHandingOverEmployee = ref<{ label: string, value: number, avatar?: any } | undefined>(undefined)

// Monitor employee selections and sync
watch(selectedEmployee, (val) => {
  form.receivedById = val?.value ?? (undefined as any)
})

watch(selectedHandingOverEmployee, (val) => {
  form.handedOverById = val?.value ?? (undefined as any)
})

// ── Scan flow ─────────────────────────────────────────────────────────────
const showScanner = ref(false)
const showAssetPicker = ref(false)
const showStockModal = ref(false)
const isLookingUp = ref(false)
const lookupError = ref<string | null>(null)

const excludeAssetIds = computed(() => [
  ...form.items.map(i => i.assetId),
  ...Array.from(pendingHandoverAssetIds.value)
])

const onAssetPicked = (asset: { id: number, name: string, code: string }) => {
  form.items.push({
    assetId: asset.id,
    name: asset.name,
    code: asset.code,
    image: null,
    note: ''
  })
}

const onScanned = (code: string) => {
  lookupAndAddAsset(code)
}

// Scanned assets depend on the transaction type and (for returns) the returning
// employee, so reset the item list whenever either changes to avoid mismatches.
watch(() => form.transactionType, (type) => {
  form.items = []
  form.stockItems = []
  lookupError.value = null
  form.customFields = {}
  fetchCustomFields(type)
})
watch(() => form.handedOverById, () => {
  if (form.transactionType === 'return') {
    form.items = []
    form.stockItems = []
    lookupError.value = null
  }
})

const lookupAndAddAsset = async (rawCode: string) => {
  const serial = rawCode.trim()
  if (!serial || isLookingUp.value) return

  isLookingUp.value = true
  lookupError.value = null

  try {
    // Step 1: Check code exists & get ID
    const checkRes = await assetService.checkCode(serial)
    if (!checkRes.success || !checkRes.data?.exists || !checkRes.data?.id) {
      lookupError.value = t('pages.handover.scan.notFound')
      return
    }

    // Step 2: Get full asset details
    const assetRes = await assetService.getById(checkRes.data.id)
    if (!assetRes.success || !assetRes.data) {
      lookupError.value = t('pages.handover.scan.notFound')
      return
    }

    const asset = assetRes.data

    // Validate: holder feature must be enabled
    if (!asset.hasHolder) {
      lookupError.value = t('pages.handover.scan.holderNotEnabled')
      return
    }

    if (form.transactionType === 'return') {
      // Return: only assets currently held by the returning employee can be scanned.
      if (!form.handedOverById) {
        lookupError.value = t('pages.handover.scan.selectHandedOverFirst')
        return
      }
      if (!asset.activeHolder) {
        lookupError.value = t('pages.handover.scan.notHeld')
        return
      }
      if (asset.activeHolder.employee?.id !== form.handedOverById) {
        lookupError.value = t('pages.handover.scan.notHeldByEmployee')
        return
      }
    } else {
      // Assign: only free, active assets can be scanned.
      if (asset.activeHolder) {
        lookupError.value = t('pages.handover.scan.alreadyHasHolder')
        return
      }
      if (asset.lastStatus?.status !== 'active') {
        lookupError.value = t('pages.handover.scan.notActive')
        return
      }
    }

    // Validate: not already added in this form
    if (form.items.some(i => i.assetId === asset.id)) {
      lookupError.value = t('pages.handover.scan.alreadyAdded')
      return
    }

    // Validate: not tied to a pending handover
    if (pendingHandoverAssetIds.value.has(asset.id)) {
      lookupError.value = t('pages.handover.scan.inPendingHandover')
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
      title: t('pages.handover.scan.added'),
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

const removeStockRow = (index: number) => {
  form.stockItems.splice(index, 1)
}

// Zod schema for form validation
const schema = z.object({
  transactionType: z.enum(HANDOVER_TRANSACTION_TYPES),
  note: z.string().optional().or(z.literal('')),
  receivedById: z.number().int().positive(t('pages.handover.form.validation.receivedByRequired')),
  handedOverById: z.number().int().positive(t('pages.handover.form.validation.handedOverByRequired')),
  items: z.array(z.object({ assetId: z.number().int().positive(), note: z.string().optional().nullable() })).optional(),
  stockItems: z.array(z.object({ variantId: z.number(), branchId: z.number(), condition: z.enum(['new', 'used']), quantity: z.number().int().min(1) })).optional()
}).superRefine((data, ctx) => {
  if ((!data.items || data.items.length === 0) && (!data.stockItems || data.stockItems.length === 0)) {
    ctx.addIssue({ code: 'custom', path: ['items'], message: t('pages.handover.form.validation.itemsRequired') })
  }
})

// Dropdown data sourcing
const employeeOptions = ref<{ label: string, value: number, avatar?: any }[]>([])
const pendingHandoverAssetIds = ref<Set<number>>(new Set())

const isLoadingEmployees = ref(false)
const isSubmitting = ref(false)

// Fetch master options
const loadMasterData = async () => {
  isLoadingEmployees.value = true
  try {
    // 1. Fetch pending handover asset IDs to block them
    const pendingHandoversRes = await handoverService.getAll(1, 200, '', '', '', 'pending')
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
        avatar: e.photo
          ? {
              src: e.photo,
              alt: e.name,
              loading: 'lazy' as const
            }
          : undefined
      }))
    }
  } finally {
    isLoadingEmployees.value = false
  }
}

// Handle form submit
const handleSubmit = async () => {
  // Client-side check for required custom fields (server enforces too).
  const missing = customFieldDefs.value.find(f => f.required && !form.customFields[f.key])
  if (missing) {
    toast.add({ title: t('pages.handover.fieldSettings.requiredMissing', { label: missing.label }), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }

  isSubmitting.value = true
  try {
    const payload: any = {
      receivedById: form.receivedById,
      handedOverById: form.handedOverById,
      transactionType: form.transactionType,
      note: form.note || null,
      customFields: form.customFields,
      attachmentIds: attachmentIds.value
    }
    if (form.items.length > 0) {
      payload.items = form.items.map(item => ({ assetId: item.assetId, note: item.note || null }))
    }
    if (form.stockItems.length > 0) {
      payload.stockItems = form.stockItems.map(r => ({ variantId: r.variantId, branchId: r.branchId, condition: r.condition, quantity: r.quantity, note: r.note || null }))
    }

    const response = await handoverService.create(payload)
    if (response.success) {
      toast.add({
        title: t('pages.handover.form.successCreate'),
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
  fetchCustomFields(form.transactionType)
})
</script>
