import { ref } from 'vue'

export type View = 'studio' | 'docs'

const DOCS_HASH = '#/doku'

function readView(): View {
  return window.location.hash.startsWith(DOCS_HASH) ? 'docs' : 'studio'
}

const view = ref<View>(readView())

// Keeps the browser's back button working across the two views.
window.addEventListener('hashchange', () => {
  view.value = readView()
})

export function useHashRoute() {
  function go(next: View) {
    if (next === 'docs') {
      window.location.hash = DOCS_HASH.slice(1)
    } else {
      // replaceState avoids leaving a bare "#" behind in the address bar.
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    view.value = next
    window.scrollTo({ top: 0 })
  }

  return { view, go }
}
