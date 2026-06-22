import { useRoute } from 'vue-router'

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
  const isCollapsed = useState('sidebar-collapsed', () => false)
  const { hasPermission } = useAuth()

  const navGroups: NavGroup[] = [
    {
      title: 'Dashboard',
      items: [
        {
          label: 'Dashboard',
          to: '/',
          icon: 'i-lucide-layout-dashboard',
          permission: 'dashboard:read'
        },
        {
          label: 'Assets',
          to: '/asset',
          icon: 'i-lucide-box',
          permission: 'asset:read'
        },
      ]
    },
    {
      title: 'Setting',
      items: [
        {
          label: 'Category',
          to: '/category',
          icon: 'i-lucide-list',
          permission: 'category:read'
        },
        {
          label: 'Sub Category',
          to: '/sub-category',
          icon: 'i-lucide-list-tree',
          permission: 'sub-category:read'
        },
        {
          label: 'Location',
          to: '/location',
          icon: 'i-lucide-map-pin',
          permission: 'location:read'
        },
        {
          label: 'Branch',
          to: '/branch',
          icon: 'i-lucide-git-branch',
          permission: 'branch:read'
        },
        {
          label: 'Employees',
          to: '/employee',
          icon: 'i-lucide-users',
          permission: 'employee:read'
        },
        {
          label: 'Users',
          to: '/user',
          icon: 'i-lucide-user',
          permission: 'user:read'
        },
        {
          label: 'Roles',
          to: '/role',
          icon: 'i-lucide-shield',
          permission: 'role:read'
        }
      ]
    }
  ]

  const filteredNavGroups = computed(() =>
    navGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => !item.permission || hasPermission(item.permission))
      }))
      .filter(group => group.items.length > 0)
  )

  const bottomNavItems: NavItem[] = []

  const isItemActive = (item: NavItem) => {
    if (item.to === '/') {
      return route.path === '/'
    }
    return route.path.startsWith(item.to)
  }

  return {
    isCollapsed,
    navGroups: filteredNavGroups,
    bottomNavItems,
    isItemActive
  }
}
