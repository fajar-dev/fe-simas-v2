<template>
  <UModal
    v-model:open="open"
    :title="$t('component.assetStatus.bulkModal.title')"
    :description="$t('component.assetStatus.bulkModal.description', { count: assetIds.length })"
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

const { t } = useI18n()

const props = defineProps<{
  assetIds: number[]
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Idle', value: 'idle' },
  { label: 'Under Repair', value: 'under_repair' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Lost', value: 'lost' },
  { label: 'Sold', value: 'sold' },
  { label: 'Disposed', value: 'disposed' },
]

const schema = z.object({
  status: z.string().min(1, t('component.assetStatus.updateModal.statusRequired')),
  note: z.string().optional().nullable(),
})

const state = reactive({
  status: '',
  note: '',
})

const saving = ref(false)
const toast = useToast()

const onSubmit = async () => {
  saving.value = true
  try {
    const response = await assetStatusService.bulkCreate({
      assetIds: props.assetIds,
      status: state.status!,
      note: state.note || null,
    })
    if (response.success) {
      toast.add({
        title: t('component.assetStatus.bulkModal.success', { count: props.assetIds.length }),
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
  }
})
</script>
