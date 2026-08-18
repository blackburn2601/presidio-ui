import { ref, watch } from 'vue'

const STORAGE_KEY = 'presidio-ui:theme'
const isDark = ref(document.documentElement.classList.contains('dark'))

watch(isDark, (dark) => {
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  } catch {
    /* private mode; theme simply won't persist */
  }
})

export function useTheme() {
  return { isDark, toggle: () => (isDark.value = !isDark.value) }
}
