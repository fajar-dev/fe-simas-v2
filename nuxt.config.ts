// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-vue3-google-signin',
    '@nuxt/image',
    'nuxt-charts',
    '@vite-pwa/nuxt'
  ],

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