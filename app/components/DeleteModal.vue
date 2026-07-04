<template>
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-sm', overlay: 'bg-black/40' }">
    <template #content>
      <UCard :ui="{ body: 'flex flex-col gap-4 relative' }">

        <!-- Modal Header -->
        <div class="flex flex-col items-center text-center select-none space-y-3">
          <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
            <UIcon name="i-lucide-triangle-alert" class="w-6 h-6 text-error" />
          </div>
          <div class="space-y-1.5">
            <h3 class="text-base font-medium text-neutral-900">
              {{ title }}
            </h3>
            <p class="text-sm text-neutral-600">
              <slot name="description">
                {{ $t('component.deleteModal.description', { name: itemName }) }} <br>{{ $t('component.deleteModal.undone') }}
              </slot>
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3">
          <UButton
            color="neutral"
            variant="outline"
            
            class="flex-1 justify-center"
            @click="() => { open = false }"
          >
            {{ $t('common.cancel') }}
          </UButton>
          <UButton
            color="error"
            
            :loading="loading"
            class="flex-1 justify-center"
            @click="$emit('confirm')"
          >
            {{ $t('common.delete') }}
          </UButton>
        </div>

      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { t } = useI18n()
const open = defineModel<boolean>({ default: false })

withDefaults(defineProps<{
  title?: string
  itemName?: string
  loading?: boolean
}>(), {
  title: 'Delete Confirmation',
  itemName: '',
  loading: false
})

defineEmits<{ confirm: [] }>()
</script>
