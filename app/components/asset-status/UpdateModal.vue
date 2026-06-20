<template>
  <UModal
    v-model:open="open"
    title="Update Asset Status"
    description="Change the current status of this asset."
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
        <UFormField label="Status" name="status" required>
          <USelect
            v-model="state.status"
            :items="statusOptions"
            placeholder="Select status..."
            class="w-full"
          />
        </UFormField>

        <UFormField label="Date" name="date" required>
          <UInput v-model="state.date" type="date" class="w-full" />
        </UFormField>

        <UFormField label="Note" name="note">
          <UTextarea
            v-model="state.note"
            placeholder="Optional note about this status change..."
            class="w-full"
            :rows="3"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="outline"
        :disabled="saving"
        @click="open = false"
      />
      <UButton
        label="Update Status"
        color="primary"
        type="submit"
        form="update-status-form"
        :loading="saving"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { assetStatusService } from '~/services/asset-status-service'

const props = defineProps<{
  assetId: number
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
  status: z.string().min(1, 'Status is required'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional().nullable(),
})

const state = reactive({
  status: '',
  date: new Date().toISOString().split('T')[0],
  note: '',
})

const saving = ref(false)
const toast = useToast()

const onSubmit = async () => {
  saving.value = true
  try {
    const response = await assetStatusService.create({
      assetId: props.assetId,
      status: state.status!,
      note: state.note || null,
      date: state.date!,
    })
    if (response.success) {
      toast.add({ title: 'Status updated successfully!', color: 'success', icon: 'i-lucide-circle-check' })
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
    state.date = new Date().toISOString().split('T')[0]
    state.note = ''
  }
})
</script>
