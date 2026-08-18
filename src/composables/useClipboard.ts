import { ref } from 'vue'

export function useClipboard(resetAfterMs = 1800) {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard API needs a secure context; fall back to a hidden textarea.
      const area = document.createElement('textarea')
      area.value = value
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), resetAfterMs)
  }

  return { copied, copy }
}
