<template>
  <UModal
    v-model:open="open"
    :title="$t('component.assetStatus.bulkModal.title')"
    :description="$t('component.assetStatus.bulkModal.description', { count: assets.length })"
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm
        id="bulk-update-status-form"
        :schema="schema"
        :state="state"
        class="space-y-4 w-full"
        @submit="onSubmit"
      >
        <UFormField
          :label="$t('common.status')"
          name="status"
          required
        >
          <USelect
            v-model="state.status"
            :items="statusOptions"
            :placeholder="$t('component.assetStatus.updateModal.selectStatus')"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="$t('common.note')"
          name="note"
        >
          <UTextarea
            v-model="state.note"
            :placeholder="$t('component.assetStatus.updateModal.notePlaceholder')"
            class="w-full"
            :rows="3"
          />
        </UFormField>

        <!-- Blocked: assets held via a handover -->
        <div
          v-if="assetsHeldViaHandover.length > 0"
          class="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2"
        >
          <div class="flex items-center gap-2 text-red-700 font-medium text-sm">
            <UIcon
              name="i-lucide-ban"
              class="size-4 shrink-0"
            />
            {{ $t('component.assetStatus.handoverHolderBlock.title') }}
          </div>
          <p class="text-xs text-red-600">
            {{ $t('component.assetStatus.handoverHolderBlock.description') }}
          </p>
          <div class="max-h-40 overflow-y-auto space-y-1.5">
            <div
              v-for="asset in assetsHeldViaHandover"
              :key="asset.id"
              class="flex items-center gap-2 text-sm text-red-700 bg-red-100/60 rounded-md px-2.5 py-1.5"
            >
              <UIcon
                name="i-lucide-box"
                class="size-3.5 shrink-0 text-red-500"
              />
              <span class="font-medium truncate">{{ asset.name }}</span>
              <span class="text-red-400 mx-0.5">→</span>
              <UIcon
                name="i-lucide-user"
                class="size-3.5 shrink-0 text-red-500"
              />
              <span class="truncate">{{ asset.activeHolder?.employee?.name }}</span>
            </div>
          </div>
        </div>

        <!-- Blocked: assets in a pending handover -->
        <div
          v-if="assetsInPendingHandover.length > 0"
          class="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2"
        >
          <div class="flex items-center gap-2 text-red-700 font-medium text-sm">
            <UIcon
              name="i-lucide-ban"
              class="size-4 shrink-0"
            />
            {{ $t('component.assetStatus.pendingHandoverBlock.title') }}
          </div>
          <p class="text-xs text-red-600">
            {{ $t('component.assetStatus.pendingHandoverBlock.description') }}
          </p>
          <div class="max-h-40 overflow-y-auto space-y-1.5">
            <div
              v-for="asset in assetsInPendingHandover"
              :key="asset.id"
              class="flex items-center gap-2 text-sm text-red-700 bg-red-100/60 rounded-md px-2.5 py-1.5"
            >
              <UIcon
                name="i-lucide-box"
                class="size-3.5 shrink-0 text-red-500"
              />
              <span class="font-medium truncate">{{ asset.name }}</span>
            </div>
          </div>
        </div>

        <!-- Active Holder Warning (manual holders — can be auto-returned) -->
        <div
          v-if="assetsWithManualHolder.length > 0"
          class="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2"
        >
          <div class="flex items-center gap-2 text-amber-700 font-medium text-sm">
            <UIcon
              name="i-lucide-alert-triangle"
              class="size-4 shrink-0"
            />
            {{ $t('component.assetStatus.holderWarning.title') }}
          </div>
          <p class="text-xs text-amber-600">
            {{ $t('component.assetStatus.holderWarning.description') }}
          </p>
          <div class="max-h-40 overflow-y-auto space-y-1.5">
            <div
              v-for="asset in assetsWithManualHolder"
              :key="asset.id"
              class="flex items-center gap-2 text-sm text-amber-700 bg-amber-100/60 rounded-md px-2.5 py-1.5"
            >
              <UIcon
                name="i-lucide-box"
                class="size-3.5 shrink-0 text-amber-500"
              />
              <span class="font-medium truncate">{{ asset.name }}</span>
              <span class="text-amber-400 mx-0.5">→</span>
              <UIcon
                name="i-lucide-user"
                class="size-3.5 shrink-0 text-amber-500"
              />
              <span class="truncate">{{ asset.activeHolder?.employee?.name }}</span>
            </div>
          </div>
          <label class="flex items-start gap-2 pt-1 cursor-pointer">
            <UCheckbox v-model="state.returnActiveHolders" />
            <span class="text-sm text-amber-700">{{ $t('component.assetStatus.holderWarning.returnCheckbox') }}</span>
          </label>
        </div>
      </UForm>
    </template>

    <template #footer>
      <UButton
        :label="$t('common.cancel')"
        color="neutral"
        variant="outline"
        :disabled="saving"
        @click="() => { open = false }"
      />
      <UButton
        :label="$t('common.save')"
        color="primary"
        type="submit"
        form="bulk-update-status-form"
        :loading="saving"
        :disabled="hasBlockedAssets"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { assetStatusService } from '~/services/asset-status-service'
import type { Asset } from '~/types/asset'

const { t } = useI18n()

const props = defineProps<{
  assets: Asset[]
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()

const statusOptions = getStatusOptions()

const { pendingAssetIds, fetchPendingAssets } = usePendingHandoverAssets()

// Assets held via a handover block the status change entirely.
const assetsHeldViaHandover = computed(() =>
  props.assets.filter(a => !!a.activeHolder?.assignHandoverId)
)
// Assets currently in a pending handover also block the status change.
const assetsInPendingHandover = computed(() =>
  props.assets.filter(a => pendingAssetIds.value.has(a.id))
)
// Manually-assigned holders can still be auto-returned during the status change.
const assetsWithManualHolder = computed(() =>
  props.assets.filter(a => a.activeHolder && !a.activeHolder.assignHandoverId)
)
const hasBlockedAssets = computed(() =>
  assetsHeldViaHandover.value.length > 0 || assetsInPendingHandover.value.length > 0
)

const schema = z.object({
  status: z.string().min(1, t('component.assetStatus.updateModal.statusRequired')),
  note: z.string().optional().nullable()
})

const state = reactive({
  status: '',
  note: '',
  returnActiveHolders: false
})

const saving = ref(false)
const toast = useToast()

const onSubmit = async () => {
  saving.value = true
  try {
    const response = await assetStatusService.bulkCreate({
      assetIds: props.assets.map(a => a.id),
      status: state.status!,
      note: state.note || null,
      returnActiveHolders: state.returnActiveHolders || undefined
    })
    if (response.success) {
      toast.add({
        title: t('component.assetStatus.bulkModal.success', { count: props.assets.length }),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('created')
      open.value = false
    }
  } finally {
    saving.value = false
  }
}

watch(open, (val) => {
  if (val) {
    state.status = ''
    state.note = ''
    state.returnActiveHolders = false
    fetchPendingAssets()
  }
})
</script>
