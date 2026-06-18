<template>
  <div class="relative h-full shrink-0">
    <aside
      class="flex flex-col h-full bg-white border-r border-neutral-200 shrink-0 justify-between select-none transition-all duration-300"
      :class="[isCollapsed ? 'w-20 p-3' : 'w-68 p-4']"
    >
      <!-- Top Section -->
      <div class="space-y-4">
        <!-- App/Brand Logo Header -->
        <div 
          class="flex border-b border-neutral-200 pb-4" 
          :class="[isCollapsed ? 'justify-center' : 'items-center justify-between']"
        >
          <BrandLogo :is-collapsed="isCollapsed" />

          <!-- Inline Toggle Button (visible only when expanded) -->
          <UButton
            v-if="!isCollapsed"
            color="neutral"
            variant="ghost"
            icon="i-lucide-panel-left-close"
            class="hidden lg:inline-flex text-neutral-400 hover:text-neutral-700"
            @click="isCollapsed = true"
            aria-label="Collapse sidebar"
          />
        </div>

      <!-- Navigation Menus -->
      <nav class="space-y-4">
        <div :class="[isCollapsed ? 'flex justify-center' : '']">
          <UTooltip
            text="Search Asset"
            :disabled="!isCollapsed"
            :content="{ align: 'center', side: 'right', sideOffset: 8 }"
          >
            <UButton
              :label="isCollapsed ? undefined : 'Search Asset'"
              color="primary"
              :square="isCollapsed"
              :class="[isCollapsed ? '' : 'w-full']"
              icon="i-lucide-scan"
              variant="subtle"
            />
          </UTooltip>
        </div>
        <div v-for="group in navGroups" :key="group.title" class="space-y-1">
          <!-- Group Title -->
          <h3
            v-if="!isCollapsed"
            class="px-1 text-sm font-medium text-neutral-600"
          >
            {{ group.title }}
          </h3>

          <!-- Group Items -->
          <div class="space-y-1">
            <template v-for="item in group.items" :key="item.label">
              <!-- Reusable NavLink with conditional tooltip wrapping -->
              <UTooltip
                :text="item.label"
                :disabled="!isCollapsed"
                :content="{ align: 'center', side: 'right', sideOffset: 8 }"
              >
                <NuxtLink
                  :to="item.to"
                  class="flex items-center transition-colors group"
                  :class="[
                    isCollapsed ? 'w-10 h-10 mx-auto justify-center rounded-md' : 'w-full gap-3 px-3 py-2 text-sm rounded-md font-medium',
                    isItemActive(item)
                      ? 'bg-primary text-white'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  ]"
                >
                  <UIcon
                    :name="item.icon"
                    class="w-5 h-5 shrink-0 transition-colors"
                    :class="[
                      isItemActive(item)
                        ? 'text-white'
                        : 'text-neutral-600 group-hover:text-neutral-900'
                    ]"
                  />
                  <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
                </NuxtLink>
              </UTooltip>
            </template>
          </div>
        </div>
      </nav>
    </div>

    <!-- Bottom Section -->
    <div>
      <!-- Bottom Nav Items -->
      <div class="pb-2 space-y-1">
        <template v-for="item in bottomNavItems" :key="item.label">
          <UTooltip
            :text="item.label"
            :disabled="!isCollapsed"
            :content="{ align: 'center', side: 'right', sideOffset: 8 }"
          >
            <NuxtLink
              :to="item.to"
              class="flex items-center transition-colors group"
              :class="[
                isCollapsed ? 'w-10 h-10 mx-auto justify-center rounded-md' : 'w-full gap-3 px-3 py-2 text-sm rounded-md font-medium',
                isItemActive(item)
                  ? 'bg-primary text-white'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              ]"
            >
              <UIcon
                :name="item.icon"
                class="w-5 h-5 shrink-0 transition-colors"
                :class="[
                  isItemActive(item)
                    ? 'text-white'
                    : 'text-neutral-600 group-hover:text-neutral-900'
                ]"
              />
              <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
            </NuxtLink>
          </UTooltip>
        </template>
      </div>

      <!-- User Profile with Popover -->
      <div class="pt-2 border-t border-neutral-200">
      <UserPopover :popover-props="{ content: { side: 'right', sideOffset: 12, align: 'end' } }">
        <button
          class="flex w-full items-center cursor-pointer rounded-md transition-colors hover:bg-neutral-50"
          :class="[isCollapsed ? 'justify-center p-2' : 'gap-3 px-2 py-2']"
        >
          <UAvatar
            :src="authState.user?.photo"
            :alt="authState.user?.name"
            size="sm"
            class="ring-2 ring-primary/10 shrink-0"
          />
          <div v-if="!isCollapsed" class="min-w-0 flex-1 text-left">
            <h2 class="text-sm font-medium truncate text-neutral-900">
              {{ authState.user?.name }}
            </h2>
            <p class="text-xs text-neutral-500 truncate">
              {{ authState.user?.email }}
            </p>
          </div>
          <UIcon
            v-if="!isCollapsed"
            name="i-lucide-chevrons-up-down"
            class="w-4 h-4 text-neutral-400 shrink-0"
          />
        </button>
      </UserPopover>
      </div>
    </div>
    </aside>

    <!-- Floating Toggle Sidebar Button on the Border (visible only when collapsed) -->
    <button
      v-if="isCollapsed"
      class="hidden lg:flex absolute top-4.5 -right-3 z-30 w-7 h-7 rounded-full border border-neutral-200 bg-white shadow-sm items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-all cursor-pointer focus:outline-none"
      @click="isCollapsed = false"
      aria-label="Expand sidebar"
    >
      <UIcon
        name="i-lucide-panel-left-open"
        class="w-4 h-4"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
const { state: authState } = useAuth()
const { isCollapsed, navGroups, bottomNavItems, isItemActive } = useNavigation()
</script>
