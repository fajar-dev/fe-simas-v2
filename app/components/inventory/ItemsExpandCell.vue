<template>
  <span v-if="items.length === 0" class="text-neutral-400 text-xs">-</span>

  <div v-else-if="items.length === 1" class="flex flex-col gap-1">
    <ItemLine :item="items[0]!" />
  </div>

  <div v-else>
    <div
      class="flex items-center gap-1.5 cursor-pointer select-none text-sm text-neutral-600 hover:text-neutral-900"
      @click="open = !open"
    >
      <UIcon :name="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="w-4 h-4 text-neutral-400 shrink-0" />
      <span>{{ $t('common.itemsCount', { count: items.length }) }}</span>
    </div>
    <div v-if="open" class="flex flex-col gap-1 mt-1.5 pl-5">
      <ItemLine v-for="item in items" :key="item.key" :item="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { StockCondition } from '~/types/inventory'

export interface ExpandableItem {
  key: string | number
  variantName: string
  branchName?: string | null
  condition: StockCondition
  quantityLabel: string
  quantityClass?: string
}

defineProps<{ items: ExpandableItem[] }>()
const open = ref(false)
const { t } = useI18n()

// Small inline sub-component: one item's line (variant, branch, condition, qty).
const ItemLine = (props: { item: ExpandableItem }) => {
  const { item } = props
  return h('div', { class: 'flex items-center gap-2 text-sm' }, [
    h('span', { class: 'text-neutral-900' }, item.variantName),
    item.branchName ? h('span', { class: 'text-neutral-500' }, `@ ${item.branchName}`) : null,
    h('span', { class: item.condition === 'new' ? 'text-emerald-600' : 'text-amber-600' }, item.condition === 'new' ? t('pages.inventory.condition.new') : t('pages.inventory.condition.used')),
    h('span', { class: item.quantityClass || 'font-semibold text-neutral-700' }, item.quantityLabel),
  ])
}
</script>
