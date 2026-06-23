<template>
  <UPopover v-model:open="popoverOpen" v-bind="popoverProps">
    <!-- Trigger: use slot or default avatar -->
    <slot>
      <UAvatar
        :src="authState.user?.photo"
        :alt="authState.user?.name"
        size="lg"
        class="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
      />
    </slot>

    <template #content>
      <div class="p-3 w-56 space-y-3 select-none">
        <!-- User Info -->
        <div class="flex items-center gap-3">
          <UAvatar
            :src="authState.user?.photo"
            :alt="authState.user?.name"
            size="md"
            class="ring-2 ring-primary/10 shrink-0"
            loading="lazy"
          />
          <div class="min-w-0 flex-1">
            <h2 class="text-sm font-medium truncate text-neutral-900">
              {{ authState.user?.name }}
            </h2>
            <p class="text-xs text-neutral-500 truncate">
              {{ authState.user?.email }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="pt-2 border-t border-neutral-200 space-y-0.5">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-user"
            class="w-full justify-start"
            to="/profile"
            @click="popoverOpen = false"
          >
            {{ $t('component.userPopover.profile') }}
          </UButton>
          <ULocaleSelect v-model="locale" :locales="[en, id]" />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-message-square"
            class="w-full justify-start"
            to="/feedback"
            @click="popoverOpen = false"
          >
            {{ $t('component.userPopover.myFeedback') }}
          </UButton>
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-log-out"
            class="w-full justify-start"
            @click="handleLogout"
          >
            {{ $t('component.userPopover.logout') }}
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { state: authState, service: authService } = useAuth()
const toast = useToast()
const popoverOpen = ref(false)

import { en, id } from '@nuxt/ui/locale'
const locale = ref('en')

interface Props {
  popoverProps?: Record<string, any>
}

withDefaults(defineProps<Props>(), {
  popoverProps: () => ({})
})

const handleLogout = async () => {
  await authService.logout()
  toast.add({
    title: t('component.userPopover.logoutSuccess'),
    icon: 'i-lucide-circle-check',
    color: 'success'
  })
}
</script>
