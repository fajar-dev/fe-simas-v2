// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-vue3-google-signin',
    '@nuxt/image',
    'nuxt-charts',
    '@vite-pwa/nuxt',
    '@nuxtjs/i18n'
  ],

  i18n: {
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json' },
      { code: 'id', language: 'id-ID', file: 'id.json' }
    ],
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      alwaysRedirect: true,
      fallbackLocale: 'en'
    }
  },

  devtools: {
    enabled: true
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    componentName: 'ColorScheme',
    classSuffix: ''
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  runtimeConfig: {
    public: {
      apiUrl: process.env.API_BASE_URL,
    }
  },

  googleSignIn: {
    clientId: process.env.GOOGLE_CLIENT_ID
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      // With `ssr: false` + full static generate, the precache manifest is
      // built before Nitro finishes prerendering, so `/` never ends up in
      // it. The module then defaults `navigateFallback` to `/` anyway,
      // which makes the SW throw `non-precached-url` trying to bind a
      // NavigationRoute to a URL that was never cached. Explicitly
      // disabling it (rather than leaving it unset, which re-triggers the
      // same default) avoids registering that broken route.
      navigateFallback: undefined,
    },
    manifest: {
      name: "SIMAS",
      short_name: "SIMAS",
      description: "Asset Management System",
      lang: 'id',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#009838',
      icons: [
        {
          src: '/icons/icon_64x64.png',
          sizes: '64x64',
          type: 'image/png',
        },
        {
          src: '/icons/icon_144x144.png',
          sizes: '144x144',
          type: 'image/png',
        },
        {
          src: '/icons/icon_192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {

          src: '/icons/icon_384x384.png',
          sizes: '384x384',
          type: 'image/png',
        },
        {
          src: '/icons/icon_512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    }
  }
})