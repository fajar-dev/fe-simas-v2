<template>
  <UModal
    v-model:open="open"
    :title="$t('component.assetStatus.updateModal.title')"
    :description="$t('component.assetStatus.updateModal.description')"
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm
        id="update-status-form"
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

        <!-- Blocked: asset is held via a handover -->
        <UAlert
          v-if="isHeldViaHandover"
          color="error"
          variant="soft"
          icon="i-lucide-ban"
          :title="$t('component.assetStatus.handoverHolderBlock.title')"
          :description="$t('component.assetStatus.handoverHolderBlock.description')"
        />

        <!-- Blocked: asset is in a pending handover -->
        <UAlert
          v-else-if="isInPendingHandover"
          color="error"
          variant="soft"
          icon="i-lucide-ban"
          :title="$t('component.assetStatus.pendingHandoverBlock.title')"
          :description="$t('component.assetStatus.pendingHandoverBlock.description')"
        />

        <!-- Active Holder Warning (manual holder — can be auto-returned) -->
        <div
          v-if="hasManualHolder"
          class="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2"
        >
          <div class="flex items-center gap-2 text-amber-700 font-medium text-sm">
            <UIcon
              name="i-lucide-alert-triangle"
              class="size-4 shrink-0"
            />
            {{ $t('component.assetStatus.holderWarning.title') }}
          </div>
          <div class="text-sm text-amber-600">
            <div class="flex items-center gap-2 pl-1">
              <UIcon
                name="i-lucide-user"
                class="size-3.5 shrink-0 text-amber-500"
              />
              <span>
                <span class="font-medium">{{ asset.activeHolder?.employee?.name }}</span>
                <span
                  v-if="asset.activeHolder?.employee?.jobPosition"
                  class="text-amber-500"
                > — {{ asset.activeHolder.employee.jobPosition }}</span>
              </span>
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
        form="update-status-form"
        :loading="saving"
        :disabled="isBlocked"
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
  asset: Asset
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()

const statusOptions = getStatusOptions()

const { pendingAssetIds, fetchPendingAssets } = usePendingHandoverAssets()

const hasActiveHolder = computed(() => !!props.asset.activeHolder)
// Assets tied to a handover cannot have their status changed here: a holder created
// from a handover must be returned via a return handover, and an asset in a pending
// handover must have that handover completed or cancelled first.
const isHeldViaHandover = computed(() => !!props.asset.activeHolder?.assignHandoverId)
const isInPendingHandover = computed(() => pendingAssetIds.value.has(props.asset.id))
const isBlocked = computed(() => isHeldViaHandover.value || isInPendingHandover.value)
const hasManualHolder = computed(() => hasActiveHolder.value && !isHeldViaHandover.value)

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
    const response = await assetStatusService.create({
      assetId: props.asset.id,
      status: state.status!,
      note: state.note || null,
      returnActiveHolders: state.returnActiveHolders || undefined
    })
    if (response.success) {
      toast.add({ title: t('component.assetStatus.updateModal.success'), color: 'success', icon: 'i-lucide-circle-check' })
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
