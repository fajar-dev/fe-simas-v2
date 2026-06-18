import { authService } from '~/services/auth-service'

export default defineNuxtRouteMiddleware(() => {
    if (authService.token.value) {
        return navigateTo('/')
    }
})