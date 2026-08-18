<script setup lang="ts">
import { computed, ref } from 'vue'
import { Braces, Check, Copy } from '@lucide/vue'
import { usePresidioStore } from '@/stores/presidio'
import { useClipboard } from '@/composables/useClipboard'

const store = usePresidioStore()
const { copied, copy } = useClipboard()

type Tab = 'request' | 'response' | 'anonymize' | 'curl'
const tab = ref<Tab>('request')

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'request', label: 'Analyse-Anfrage' },
  { id: 'response', label: 'Analyzer-Antwort' },
  { id: 'anonymize', label: 'Anonymisierungs-Anfrage' },
  { id: 'curl', label: 'cURL' },
]

/** The exact payload the store posts, truncated only so the panel stays readable. */
const requestBody = computed(() => {
  const request = store.buildAnalyzeRequest(store.text)
  return {
    ...request,
    text: request.text.length > 240 ? `${request.text.slice(0, 240)}…` : request.text,
  }
})

const anonymizeBody = computed(() => ({
  text: '<derselbe Text>',
  analyzer_results: '<die Analyzer-Ergebnisse von oben>',
  anonymizers: { DEFAULT: store.buildOperator() },
}))

const content = computed(() => {
  if (tab.value === 'request') return JSON.stringify(requestBody.value, null, 2)
  if (tab.value === 'response') return JSON.stringify(store.analyzerResults, null, 2)
  if (tab.value === 'anonymize') return JSON.stringify(anonymizeBody.value, null, 2)
  return [
    `curl -X POST "$PRESIDIO_ANALYZER/analyze" \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d '${JSON.stringify(requestBody.value)}'`,
  ].join('\n')
})
</script>

<template>
  <section class="panel flex min-h-0 flex-col">
    <header class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <Braces :size="15" :style="{ color: 'var(--app-ink-faint)' }" />
      <h2 class="text-sm font-semibold" :style="{ color: 'var(--app-ink)' }">API-Inspektor</h2>
      <div class="ml-auto flex items-center gap-1">
        <button
          v-for="entry in TABS"
          :key="entry.id"
          class="btn px-2 py-1 text-[0.7rem]"
          :class="tab === entry.id ? 'btn-primary' : 'btn-subtle'"
          @click="tab = entry.id"
        >
          {{ entry.label }}
        </button>
        <button class="btn btn-ghost ml-1 px-2 py-1 text-xs" @click="copy(content)">
          <component :is="copied ? Check : Copy" :size="13" />
        </button>
      </div>
    </header>
    <pre
      class="scroll-thin min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[0.72rem] leading-relaxed"
      :style="{ color: 'var(--app-ink-muted)' }"
    >{{ content }}</pre>
  </section>
</template>
