const lightboxOpen = ref(false)
const lightboxImage = ref('')

export const useLightbox = () => {
  const openLightbox = (url: string) => {
    lightboxImage.value = url
    lightboxOpen.value = true
  }

  const closeLightbox = () => {
    lightboxOpen.value = false
  }

  return {
    lightboxOpen,
    lightboxImage,
    openLightbox,
    closeLightbox
  }
}
