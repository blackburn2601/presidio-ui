<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eraser, FileText, Play, Scan, Upload } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import { usePresidioStore } from '@/stores/presidio'
import { SAMPLES } from '@/data/samples'

const store = usePresidioStore()
const props = defineProps<{ activeEntity: string | null }>()
const emit = defineEmits<{ hover: [entity: string | null] }>()

const showPreview = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const samplesForLanguage = computed(() => {
  const forLang = SAMPLES.filter((s) => s.language === store.language)
  return forLang.length ? forLang : SAMPLES
})

const charCount = computed(() => store.text.length)
const wordCount = computed(() => (store.text.trim() ? store.text.trim().split(/\s+/).length : 0))

/** The preview only lines up while the analyzed text still matches the editor. */
const previewStale = computed(() => store.analyzedText !== store.text)

async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  store.text = await file.text()
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <section class="panel flex min-h-0 flex-col">
    <header class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <FileText :size="15" :style="{ color: 'var(--app-ink-faint)' }" />
      <h2 class="text-sm font-semibold" :style="{ color: 'var(--app-ink)' }">Eingabetext</h2>

      <div class="ml-auto flex flex-wrap items-center gap-1.5">
        <button
          class="btn btn-ghost px-2 py-1 text-xs"
          :style="showPreview ? { borderColor: 'var(--app-brand)', color: 'var(--app-brand-ink)' } : {}"
          :title="showPreview ? 'Zurück zum Bearbeiten' : 'Erkannte Entitäten im Text anzeigen'"
          @click="showPreview = !showPreview"
        >
          <Scan :size="13" /> {{ showPreview ? 'Bearbeiten' : 'Vorschau' }}
        </button>
        <button class="btn btn-ghost px-2 py-1 text-xs" @click="fileInput?.click()">
          <Upload :size="13" /> Laden
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".txt,.md,.csv,.json,.log,text/*"
          class="hidden"
          @change="onFile"
        />
        <button
          class="btn btn-ghost px-2 py-1 text-xs"
          :disabled="!store.text"
          @click="store.text = ''"
        >
          <Eraser :size="13" /> Leeren
        </button>
      </div>
    </header>

    <div class="flex flex-wrap gap-1.5 border-b px-4 py-2">
      <span class="self-center text-[0.68rem] font-semibold uppercase" :style="{ color: 'var(--app-ink-faint)' }">
        Beispiele
      </span>
      <button
        v-for="sample in samplesForLanguage"
        :key="sample.id"
        class="btn btn-subtle px-2 py-0.5 text-[0.7rem]"
        :style="{ background: 'var(--app-raised)' }"
        @click="store.loadSample(sample.id)"
      >
        {{ sample.label }}
      </button>
    </div>

    <div class="relative min-h-0 flex-1">
      <div
        v-if="showPreview"
        class="scroll-thin h-full overflow-y-auto px-4 py-3"
        @mouseleave="emit('hover', null)"
      >
        <p
          v-if="previewStale"
          class="mb-2 rounded-md px-2 py-1 text-[0.7rem]"
          :style="{ background: 'var(--app-raised)', color: 'var(--app-ink-faint)' }"
        >
          Zeigt die zuletzt analysierte Fassung — der Text hat sich seitdem geändert.
        </p>
        <HighlightedText
          :tokens="store.inputTokens"
          :active-entity="props.activeEntity"
          @hover="emit('hover', $event)"
        />
        <p
          v-if="!store.inputTokens.length"
          class="py-8 text-center text-sm"
          :style="{ color: 'var(--app-ink-faint)' }"
        >
          Noch nichts analysiert.
        </p>
      </div>

      <textarea
        v-else
        v-model="store.text"
        spellcheck="false"
        class="scroll-thin h-full w-full resize-none bg-transparent px-4 py-3 font-mono text-[0.8125rem] leading-[1.9] outline-none"
        :style="{ color: 'var(--app-ink)' }"
        placeholder="Text einfügen oder tippen, der auf personenbezogene Daten geprüft werden soll…"
      />
    </div>

    <footer
      class="flex items-center gap-3 border-t px-4 py-2 text-[0.7rem] tabular-nums"
      :style="{ color: 'var(--app-ink-faint)' }"
    >
      <span>{{ charCount.toLocaleString('de-DE') }} Zeichen</span>
      <span>{{ wordCount.toLocaleString('de-DE') }} Wörter</span>
      <button
        v-if="!store.autoRun"
        class="btn btn-primary ml-auto px-3 py-1 text-xs"
        :disabled="store.isRunning || !store.text.trim()"
        @click="store.run()"
      >
        <Play :size="12" /> Analysieren
      </button>
      <span v-else-if="store.lastRunMs !== null" class="ml-auto">
        in {{ store.lastRunMs }} ms fertig
      </span>
    </footer>
  </section>
</template>
