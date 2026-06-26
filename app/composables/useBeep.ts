/**
 * Composable to play a short beep sound using Web Audio API.
 * No audio file needed — generates a tone programmatically.
 */
export function useBeep() {
  const playBeep = (frequency = 1200, duration = 150) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.value = 0.3

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start()
      oscillator.stop(ctx.currentTime + duration / 1000)

      oscillator.onended = () => ctx.close()
    } catch {
      // Silently fail if AudioContext is not available
    }
  }

  return { playBeep }
}
