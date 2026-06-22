import { authService } from "~/services/auth-service"

export const useAuth = () => {
    const hasPermission = (...keys: string[]) => {
        const user = authService.user.value
        if (!user?.role) return false
        if (user.role.isSuperAdmin) return true
        const userPerms = user.role.permissions?.map(p => p.key) || []
        return keys.some(key => userPerms.includes(key))
    }

    return {
        state: {
            get token() {
                return authService.token.value
            },
            get user() {
                return authService.user.value
            }
        },
        hasPermission,
        service: authService
    }
}