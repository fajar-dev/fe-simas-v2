// This app has no dark mode design — force light regardless of system preference or a
// stale "nuxt-color-mode" value left over in localStorage from before this was enforced.
export default defineNuxtPlugin(() => {
  const colorMode = useColorMode()
  colorMode.preference = 'light'
  colorMode.value = 'light'
})
