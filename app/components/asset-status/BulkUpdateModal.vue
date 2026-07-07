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
        <UFormField :label="$t('common.status')" name="status" required>
          <USelect
            v-model="state.status"
            :items="statusOptions"
            :placeholder="$t('component.assetStatus.updateModal.selectStatus')"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('common.note')" name="note">
          <UTextarea
            v-model="state.note"
            :placeholder="$t('component.assetStatus.updateModal.notePlaceholder')"
            class="w-full"
            :rows="3"
          />
        </UFormField>

        <!-- Active Holder Warning -->
        <div v-if="assetsWithHolder.length > 0" class="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <div class="flex items-center gap-2 text-amber-700 font-medium text-sm">
            <UIcon name="i-lucide-alert-triangle" class="size-4 shrink-0" />
            {{ $t('component.assetStatus.holderWarning.title') }}
          </div>
          <p class="text-xs text-amber-600">
            {{ $t('component.assetStatus.holderWarning.description') }}
          </p>
          <div class="max-h-40 overflow-y-auto space-y-1.5">
            <div
              v-for="asset in assetsWithHolder"
              :key="asset.id"
              class="flex items-center gap-2 text-sm text-amber-700 bg-amber-100/60 rounded-md px-2.5 py-1.5"
            >
              <UIcon name="i-lucide-box" class="size-3.5 shrink-0 text-amber-500" />
              <span class="font-medium truncate">{{ asset.name }}</span>
              <span class="text-amber-400 mx-0.5">→</span>
              <UIcon name="i-lucide-user" class="size-3.5 shrink-0 text-amber-500" />
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
        :label="$t('component.assetStatus.bulkModal.submit')"
        color="primary"
        type="submit"
        form="bulk-update-status-form"
        :loading="saving"
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

const assetsWithHolder = computed(() =>
  props.assets.filter(a => !!a.activeHolder)
)

const schema = z.object({
  status: z.string().min(1, t('component.assetStatus.updateModal.statusRequired')),
  note: z.string().optional().nullable(),
})

const state = reactive({
  status: '',
  note: '',
  returnActiveHolders: false,
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
      returnActiveHolders: state.returnActiveHolders || undefined,
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
  }
})
</script>
