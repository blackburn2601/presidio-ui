<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, Copy, Download, LoaderCircle, ShieldCheck, Unlock } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import { usePresidioStore } from '@/stores/presidio'
import { useClipboard } from '@/composables/useClipboard'
import { downloadFile } from '@/composables/useDownload'

const store = usePresidioStore()
const props = defineProps<{ activeEntity: string | null }>()
const emit = defineEmits<{ hover: [entity: string | null] }>()

const { copied, copy } = useClipboard()

const decrypted = ref<string | null>(null)
const decryptError = ref<string | null>(null)
const decrypting = ref(false)

const outputText = computed(() => store.anonymized?.text ?? '')

const MODE_LABELS: Record<string, string> = {
  highlight: 'Erkannte Entitäten',
  replace: 'Ersetzte Ausgabe',
  redact: 'Bereinigte Ausgabe',
  mask: 'Maskierte Ausgabe',
  hash: 'Gehashte Ausgabe',
  encrypt: 'Verschlüsselte Ausgabe',
  keep: 'Originaltext (Werte beibehalten)',
}

const modeLabel = computed(() => MODE_LABELS[store.outputMode] ?? 'Anonymisierte Ausgabe')

// A fresh run invalidates any previously restored text.
watch(
  () => store.anonymized,
  () => {
    decrypted.value = null
    decryptError.value = null
  },
)

async function restore() {
  decrypting.value = true
  decryptError.value = null
  try {
    const result = await store.deanonymize()
    decrypted.value = result.text
  } catch (e) {
    decryptError.value = e instanceof Error ? e.message : 'Text konnte nicht entschlüsselt werden.'
  } finally {
    decrypting.value = false
  }
}

function save() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  downloadFile(`presidio-${store.outputMode}-${stamp}.txt`, outputText.value)
}
</script>

<template>
  <section class="panel flex min-h-0 flex-col">
    <header class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <ShieldCheck :size="15" :style="{ color: 'var(--app-ink-faint)' }" />
      <h2 class="text-sm font-semibold" :style="{ color: 'var(--app-ink)' }">{{ modeLabel }}</h2>
      <LoaderCircle
        v-if="store.isRunning"
        :size="14"
        class="animate-spin"
        :style="{ color: 'var(--app-brand)' }"
      />

      <div class="ml-auto flex items-center gap-1.5">
        <button
          v-if="store.isEncrypting && store.anonymized?.items.length"
          class="btn btn-ghost px-2 py-1 text-xs"
          :disabled="decrypting"
          title="Mit demselben AES-Schlüssel entschlüsseln"
          @click="restore"
        >
          <Unlock :size="13" /> Entschlüsseln
        </button>
        <button
          class="btn btn-ghost px-2 py-1 text-xs"
          :disabled="!outputText"
          @click="copy(outputText)"
        >
          <component :is="copied ? Check : Copy" :size="13" />
          {{ copied ? 'Kopiert' : 'Kopieren' }}
        </button>
        <button class="btn btn-ghost px-2 py-1 text-xs" :disabled="!outputText" @click="save">
          <Download :size="13" /> Speichern
        </button>
      </div>
    </header>

    <div
      class="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-3"
      @mouseleave="emit('hover', null)"
    >
      <div
        v-if="store.error"
        class="rounded-lg border px-3 py-2.5 text-sm"
        :style="{
          background: 'oklch(0.96 0.04 25)',
          borderColor: 'oklch(0.8 0.12 25)',
          color: 'oklch(0.44 0.16 25)',
        }"
      >
        {{ store.error }}
      </div>

      <template v-else-if="store.anonymized">
        <HighlightedText
          :tokens="
            store.outputMode === 'highlight'
              ? store.inputTokens
              : store.outputTokens
          "
          :active-entity="props.activeEntity"
          @hover="emit('hover', $event)"
        />

        <div
          v-if="decrypted !== null"
          class="mt-4 rounded-lg border p-3"
          :style="{ background: 'var(--app-raised)' }"
        >
          <p class="field-label mb-2">Wieder entschlüsselt</p>
          <p
            class="font-mono text-[0.8125rem] leading-[1.9] break-words whitespace-pre-wrap"
            :style="{ color: 'var(--app-ink)' }"
          >
            {{ decrypted }}
          </p>
        </div>
        <p
          v-if="decryptError"
          class="mt-3 text-xs"
          :style="{ color: 'oklch(0.62 0.19 25)' }"
        >
          {{ decryptError }}
        </p>
      </template>

      <p
        v-else-if="!store.isRunning"
        class="py-10 text-center text-sm"
        :style="{ color: 'var(--app-ink-faint)' }"
      >
        Text eingeben, um das anonymisierte Ergebnis zu sehen.
      </p>
    </div>
  </section>
</template>
