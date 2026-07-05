import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

export interface NavItem {
  label: string
  to: string
  icon: string
  permission?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const useNavigation = () => {
  const route = useRoute()
  const { t } = useI18n()
  const isCollapsed = useState('sidebar-collapsed', () => false)
  const { hasPermission } = useAuth()

  const navGroups = computed<NavGroup[]>(() => [
    {
      title: t('nav.dashboard'),
      items: [
        {
          label: t('nav.dashboard'),
          to: '/',
          icon: 'i-lucide-layout-dashboard',
          permission: 'dashboard:read'
        },
        {
          label: t('nav.assets'),
          to: '/asset?status=active',
          icon: 'i-lucide-box',
          permission: 'asset:read'
        },
      ]
    },
    {
      title: t('nav.setting'),
      items: [
        {
          label: t('nav.category'),
          to: '/category',
          icon: 'i-lucide-list',
          permission: 'category:read'
        },
        {
          label: t('nav.subCategory'),
          to: '/sub-category',
          icon: 'i-lucide-list-tree',
          permission: 'sub-category:read'
        },
        {
          label: t('nav.location'),
          to: '/location',
          icon: 'i-lucide-map-pin',
          permission: 'location:read'
        },
        {
          label: t('nav.branch'),
          to: '/branch',
          icon: 'i-lucide-git-branch',
          permission: 'branch:read'
        },
        {
          label: t('nav.employees'),
          to: '/employee',
          icon: 'i-lucide-users',
          permission: 'employee:read'
        },
        {
          label: t('nav.users'),
          to: '/user',
          icon: 'i-lucide-user',
          permission: 'user:read'
        },
        {
          label: t('nav.roles'),
          to: '/role',
          icon: 'i-lucide-shield',
          permission: 'role:read'
        }
      ]
    }
  ])

  const filteredNavGroups = computed(() =>
    navGroups.value
      .map(group => ({
        ...group,
        items: group.items.filter(item => !item.permission || hasPermission(item.permission))
      }))
      .filter(group => group.items.length > 0)
  )

  const bottomNavItems: NavItem[] = []

  const isItemActive = (item: NavItem) => {
    const itemPath = item.to.split('?')[0] ?? item.to
    if (itemPath === '/') {
      return route.path === '/'
    }
    return route.path.startsWith(itemPath)
  }

  return {
    isCollapsed,
    navGroups: filteredNavGroups,
    bottomNavItems,
    isItemActive
  }
}
