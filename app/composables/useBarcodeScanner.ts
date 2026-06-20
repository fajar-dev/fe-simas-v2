import { QrcodeStream } from 'vue-qrcode-reader'
import type { DetectedBarcode } from 'vue-qrcode-reader'

export function useBarcodeScanner() {
  const error = ref('')

  const formats = [
    'qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8',
    'upc_a', 'upc_e', 'itf', 'codabar', 'code_93', 'data_matrix',
  ] as any

  function paintBoundingBox(detectedCodes: DetectedBarcode[], ctx: CanvasRenderingContext2D) {
    for (const code of detectedCodes) {
      const box = code.boundingBox
      if (!box) continue
      ctx.lineWidth = 3
      ctx.strokeStyle = '#22c55e'
      ctx.strokeRect(box.x, box.y, box.width, box.height)
    }
  }

  function onCameraError(err: Error) {
    if (err.name === 'NotAllowedError') {
      error.value = 'Camera permission denied. Please allow access in your browser settings.'
    } else if (err.name === 'NotFoundError') {
      error.value = 'No camera found on this device.'
    } else if (err.name === 'NotReadableError') {
      error.value = 'Camera is already in use by another app.'
    } else {
      error.value = `Camera error: ${err.message || err.name}`
    }
  }

  function reset() {
    error.value = ''
  }

  return {
    QrcodeStream,
    error,
    formats,
    paintBoundingBox,
    onCameraError,
    reset,
  }
}
