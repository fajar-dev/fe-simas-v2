<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.inventory.variant.manageTitle')"
    :description="product?.name || ''"
    :ui="{ content: 'sm:max-w-lg', overlay: 'bg-black/40' }"
  >
    <template #body>
      <!-- Existing variants -->
      <div v-if="isLoading" class="space-y-2">
        <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
      </div>
      <div v-else class="space-y-2">
        <div v-if="variants.length === 0" class="text-center text-sm text-neutral-400 py-4">
          {{ $t('pages.inventory.variant.empty') }}
        </div>
        <div
          v-for="variant in variants"
          :key="variant.id"
          class="flex items-center gap-2 border border-neutral-200 rounded-lg px-3 py-2"
        >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-neutral-900 truncate">{{ variant.name }}</div>
            <div class="text-xs text-neutral-500">{{ variant.code || '-' }} · {{ variant.unit }}</div>
          </div>
          <UButton color="error" variant="ghost" icon="i-lucide-trash-2" square size="sm" :loading="deletingId === variant.id" @click="remove(variant.id)" />
        </div>
      </div>

      <!-- Add form -->
      <UForm :schema="schema" :state="form" class="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end" @submit="add">
        <UFormField :label="$t('common.name')" name="name" class="sm:col-span-1" required>
          <UInput v-model="form.name" class="w-full" />
        </UFormField>
        <UFormField :label="$t('common.code')" name="code">
          <UInput v-model="form.code" class="w-full" />
        </UFormField>
        <UFormField :label="$t('pages.inventory.variant.unit')" name="unit">
          <UInput v-model="form.unit" placeholder="pcs" class="w-full" />
        </UFormField>
        <UButton :label="$t('pages.inventory.variant.add')" color="primary" icon="i-lucide-plus" type="submit" :loading="adding" class="sm:col-span-3 justify-center" />
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { inventoryVariantService } from '~/services/inventory-variant-service'
import type { Inventory, InventoryVariant } from '~/types/inventory'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{ product?: Inventory | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ changed: [] }>()

const variants = ref<InventoryVariant[]>([])
const isLoading = ref(false)
const adding = ref(false)
const deletingId = ref<number | null>(null)

const schema = z.object({
  name: z.string().trim().min(1, t('common.nameRequired')),
  code: z.string().optional().or(z.literal('')),
  unit: z.string().optional().or(z.literal(''))
})
const form = reactive({ name: '', code: '', unit: '' })

const fetchVariants = async () => {
  if (!props.product) return
  isLoading.value = true
  try {
    const res = await inventoryVariantService.getByProduct(props.product.id)
    variants.value = res.success && res.data ? res.data : []
  } finally {
    isLoading.value = false
  }
}

const add = async () => {
  if (!props.product) return
  adding.value = true
  try {
    const res = await inventoryVariantService.create({ productId: props.product.id, name: form.name, code: form.code || null, unit: form.unit || 'pcs' })
    if (res.success) {
      form.name = ''; form.code = ''; form.unit = ''
      await fetchVariants()
      emit('changed')
    } else {
      toast.add({ title: res.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    adding.value = false
  }
}

const remove = async (id: number) => {
  deletingId.value = id
  try {
    const res = await inventoryVariantService.remove(id)
    if (res.success) {
      await fetchVariants()
      emit('changed')
    } else {
      toast.add({ title: res.message || 'Error occurred', color: 'error', icon: 'i-lucide-circle-alert' })
    }
  } finally {
    deletingId.value = null
  }
}

watch(open, (val) => { if (val) fetchVariants() })
</script>
