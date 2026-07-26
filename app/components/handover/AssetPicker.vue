<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.handover.form.assetItems')"
    :ui="{ content: 'sm:max-w-lg', overlay: 'bg-black/40', footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-if="isLoading"
          class="space-y-2"
        >
          <USkeleton
            v-for="i in 3"
            :key="i"
            class="h-14 w-full"
          />
        </div>
        <div
          v-else-if="!employeeId"
          class="text-sm text-neutral-400 py-8 text-center border-2 border-dashed border-neutral-200 rounded-lg"
        >
          {{ $t('pages.handover.scan.selectHandedOverFirst') }}
        </div>
        <div
          v-else-if="availableAssets.length === 0"
          class="text-sm text-neutral-400 py-8 text-center border-2 border-dashed border-neutral-200 rounded-lg"
        >
          {{ $t('pages.handover.scan.noHeldAssets') }}
        </div>
        <div
          v-else
          class="space-y-2"
        >
          <div
            v-for="asset in availableAssets"
            :key="asset.id"
            class="flex items-center gap-2 p-3 rounded-lg border border-neutral-100 bg-neutral-50/50"
          >
            <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon
                name="i-lucide-box"
                class="w-5 h-5 text-primary"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium text-neutral-900 truncate">
                {{ asset.name }}
              </div>
              <div class="text-xs text-neutral-500 truncate">
                {{ asset.code }}
              </div>
            </div>
            <UButton
              type="button"
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              size="sm"
              @click="() => select(asset)"
            >
              {{ $t('common.add') }}
            </UButton>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        :label="$t('common.close')"
        color="neutral"
        variant="outline"
        @click="() => { open = false }"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { assetHolderService } from '~/services/asset-holder-service'

export interface HeldAssetOption {
  id: number
  name: string
  code: string
}

const props = defineProps<{ employeeId?: number | null, excludeAssetIds: number[] }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ select: [HeldAssetOption] }>()

const isLoading = ref(false)
const heldAssets = ref<HeldAssetOption[]>([])

const availableAssets = computed(() => heldAssets.value.filter(a => !props.excludeAssetIds.includes(a.id)))

const load = async () => {
  heldAssets.value = []
  if (!props.employeeId) return
  isLoading.value = true
  try {
    const res = await assetHolderService.getAll(1, 200, '', '', '', undefined, props.employeeId)
    if (res.success && res.data) {
      heldAssets.value = res.data
        .filter(h => !h.returnedDate && h.asset)
        .map(h => ({ id: h.asset!.id, name: h.asset!.name, code: h.asset!.code }))
    }
  } finally {
    isLoading.value = false
  }
}

const select = (asset: HeldAssetOption) => {
  emit('select', asset)
  open.value = false
}

watch(() => props.employeeId, load)
watch(open, (val) => {
  if (val) load()
})
</script>
