import { useRoute } from 'vue-router'

export interface NavItem {
  label: string
  to: string
  icon: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const useNavigation = () => {
  const route = useRoute()
  const isCollapsed = useState('sidebar-collapsed', () => false)

  const navGroups: NavGroup[] = [
    {
      title: 'Dashboard',
      items: [
        {
          label: 'Dashboard',
          to: '/',
          icon: 'i-lucide-layout-dashboard'
        },
        {
          label: 'Assets',
          to: '/asset',
          icon: 'i-lucide-box'
        },
        {
          label: 'Users',
          to: '/user',
          icon: 'i-lucide-user'
        }
      ]
    },
    {
      title: 'Setting',
      items: [
        {
          label: 'Category',
          to: '/category',
          icon: 'i-lucide-list'
        },
        {
          label: 'Sub Category',
          to: '/sub-category',
          icon: 'i-lucide-list'
        },
        {
          label: 'Location',
          to: '/location',
          icon: 'i-lucide-map-pin'
        }
      ]
    }
  ]

  const bottomNavItems: NavItem[] = []

  const isItemActive = (item: NavItem) => {
    if (item.to === '/') {
      return route.path === '/'
    }
    return route.path.startsWith(item.to)
  }

  return {
    isCollapsed,
    navGroups,
    bottomNavItems,
    isItemActive
  }
}
