export function useNfcReader() {
  const isSupported = ref(false)
  const isScanning = ref(false)
  const error = ref('')
  let abortController: AbortController | null = null

  onMounted(() => {
    isSupported.value = 'NDEFReader' in window
  })

  async function startScan(onRead: (serialNumber: string, text?: string) => void) {
    if (!isSupported.value) {
      error.value = 'NFC is not supported on this device/browser.'
      return
    }

    error.value = ''
    isScanning.value = true
    abortController = new AbortController()

    try {
      const ndef = new (window as any).NDEFReader()
      await ndef.scan({ signal: abortController.signal })

      ndef.onreadingerror = () => {
        error.value = 'Cannot read data from NFC tag.'
      }

      ndef.onreading = (event: any) => {
        const serial = event.serialNumber || ''
        let text = ''

        if (event.message?.records) {
          for (const record of event.message.records) {
            if (record.recordType === 'text') {
              const decoder = new TextDecoder(record.encoding || 'utf-8')
              text = decoder.decode(record.data)
              break
            }
            if (record.recordType === 'url') {
              const decoder = new TextDecoder()
              text = decoder.decode(record.data)
              break
            }
          }
        }

        onRead(serial, text || undefined)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      if (err.name === 'NotAllowedError') {
        error.value = 'NFC permission denied. Please allow access.'
      } else if (err.name === 'NotSupportedError') {
        error.value = 'NFC is not supported on this device.'
      } else {
        error.value = `NFC error: ${err.message || err.name}`
      }
      isScanning.value = false
    }
  }

  function stopScan() {
    abortController?.abort()
    abortController = null
    isScanning.value = false
  }

  onBeforeUnmount(() => {
    stopScan()
  })

  return {
    isSupported,
    isScanning,
    error,
    startScan,
    stopScan,
  }
}
