import { ref } from 'vue'

export const useFeedback = () => {
  const isOpen = useState('feedback-modal-open', () => false)
  const isCapturing = useState('feedback-capturing', () => false)
  const screenshotFile = useState<File | null>('feedback-screenshot', () => null)
  const currentUrl = useState('feedback-url', () => '')

  const triggerFeedback = async () => {
    isCapturing.value = true
    currentUrl.value = window.location.href
    
    // Give the UI a microsecond to render the loader/blur overlay before taking the screenshot
    await new Promise((resolve) => setTimeout(resolve, 150))
    
    try {
      const { domToBlob } = await import('modern-screenshot')
      const blob = await domToBlob(document.body, {
        filter: (node) => {
          if (node instanceof HTMLElement) {
            // Exclude the feedback loader itself, any Nuxt UI tooltips/toasters that might be open, or elements marked as excluded
            if (
              node.id === 'feedback-loader' || 
              node.classList.contains('feedback-exclude') ||
              node.classList.contains('u-toaster')
            ) {
              return false
            }
          }
          return true
        }
      })
      
      if (blob) {
        screenshotFile.value = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' })
      } else {
        screenshotFile.value = null
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      screenshotFile.value = null
    } finally {
      isCapturing.value = false
      isOpen.value = true
    }
  }

  return {
    isOpen,
    isCapturing,
    screenshotFile,
    currentUrl,
    triggerFeedback
  }
}
