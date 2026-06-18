import { authService } from "~/services/auth-service"

export const useAuth = () => {
    return {
        state: {
            get token() {
                return authService.token.value
            },
            get user() {
                return authService.user.value
            }
        },
        service: authService
    }
}