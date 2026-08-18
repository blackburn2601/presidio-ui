<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, Copy, Check, Download, Table2 } from '@lucide/vue'
import { usePresidioStore } from '@/stores/presidio'
import { entityStyle, entityDescription, prettyEntity } from '@/data/entities'
import { useClipboard } from '@/composables/useClipboard'
import { downloadFile } from '@/composables/useDownload'

const store = usePresidioStore()
const props = defineProps<{ activeEntity: string | null }>()
const emit = defineEmits<{ hover: [entity: string | null] }>()

const { copied, copy } = useClipboard()
const expanded = ref<Set<number>>(new Set())

const rows = computed(() =>
  store.findings.map((finding, index) => ({
    ...finding,
    index,
    explained: Boolean(finding.analysis_explanation),
  })),
)

function toggle(index: number) {
  const next = new Set(expanded.value)
  next.has(index) ? next.delete(index) : next.add(index)
  expanded.value = next
}

function scoreColor(score: number) {
  if (score >= 0.85) return 'oklch(0.62 0.16 150)'
  if (score >= 0.5) return 'oklch(0.7 0.15 85)'
  return 'oklch(0.65 0.17 40)'
}

function exportCsv() {
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const lines = [
    ['entitaet', 'wert', 'start', 'ende', 'score', 'recognizer'].join(','),
    ...store.findings.map((f) =>
      [
        f.entity_type,
        f.text,
        f.start,
        f.end,
        f.score.toFixed(2),
        f.analysis_explanation?.recognizer ?? '',
      ]
        .map(escape)
        .join(','),
    ),
  ]
  const stamp = new Date().toISOString().slice(0, 10)
  downloadFile(`presidio-findings-${stamp}.csv`, lines.join('\n'), 'text/csv')
}
</script>

<template>
  <section class="panel flex min-h-0 flex-col">
    <header class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <Table2 :size="15" :style="{ color: 'var(--app-ink-faint)' }" />
      <h2 class="text-sm font-semibold" :style="{ color: 'var(--app-ink)' }">Treffer</h2>
      <span
        class="rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums"
        :style="{ background: 'var(--app-brand-soft)', color: 'var(--app-brand-ink)' }"
      >
        {{ rows.length }}
      </span>
      <div class="ml-auto flex items-center gap-1.5">
        <button
          class="btn btn-ghost px-2 py-1 text-xs"
          :disabled="!rows.length"
          title="Rohantwort des Analyzers kopieren"
          @click="copy(JSON.stringify(store.analyzerResults, null, 2))"
        >
          <component :is="copied ? Check : Copy" :size="13" /> JSON
        </button>
        <button class="btn btn-ghost px-2 py-1 text-xs" :disabled="!rows.length" @click="exportCsv">
          <Download :size="13" /> CSV
        </button>
      </div>
    </header>

    <div class="scroll-thin min-h-0 flex-1 overflow-auto" @mouseleave="emit('hover', null)">
      <table class="w-full border-collapse text-left text-[0.8rem]">
        <thead class="sticky top-0 z-10">
          <tr
            :style="{ background: 'var(--app-raised)', color: 'var(--app-ink-faint)' }"
            class="text-[0.68rem] font-semibold tracking-wide uppercase"
          >
            <th class="w-8 px-3 py-2"></th>
            <th class="px-3 py-2">Entität</th>
            <th class="px-3 py-2">Erkannter Wert</th>
            <th class="px-3 py-2 text-right whitespace-nowrap">Position</th>
            <th class="px-3 py-2 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in rows" :key="`${row.entity_type}-${row.start}-${row.end}`">
            <tr
              class="border-t transition-colors"
              :style="{
                background:
                  props.activeEntity === row.entity_type ? 'var(--app-raised)' : 'transparent',
              }"
              @mouseenter="emit('hover', row.entity_type)"
            >
              <td class="px-3 py-2">
                <button
                  v-if="row.explained"
                  class="rounded p-0.5 transition-transform"
                  :class="expanded.has(row.index) ? '' : '-rotate-90'"
                  :style="{ color: 'var(--app-ink-faint)' }"
                  :aria-label="`Treffer ${row.entity_type} erklären`"
                  @click="toggle(row.index)"
                >
                  <ChevronDown :size="14" />
                </button>
              </td>
              <td class="px-3 py-2">
                <span
                  class="entity-chip"
                  :style="entityStyle(row.entity_type)"
                  :title="entityDescription(row.entity_type)"
                >
                  <span class="entity-dot" />
                  {{ prettyEntity(row.entity_type) }}
                </span>
              </td>
              <td class="max-w-[22rem] truncate px-3 py-2 font-mono" :title="row.text">
                {{ row.text }}
              </td>
              <td
                class="px-3 py-2 text-right font-mono text-[0.72rem] tabular-nums whitespace-nowrap"
                :style="{ color: 'var(--app-ink-faint)' }"
              >
                {{ row.start }}–{{ row.end }}
              </td>
              <td class="px-3 py-2 text-right">
                <span
                  class="inline-block w-11 rounded px-1.5 py-0.5 text-center text-[0.72rem] font-semibold tabular-nums text-white"
                  :style="{ background: scoreColor(row.score) }"
                >
                  {{ row.score.toFixed(2) }}
                </span>
              </td>
            </tr>
            <tr v-if="expanded.has(row.index) && row.analysis_explanation">
              <td colspan="5" class="px-3 pb-3" :style="{ background: 'var(--app-raised)' }">
                <dl class="grid gap-x-6 gap-y-1.5 pt-2 text-[0.72rem] sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <dt class="field-label mb-0.5">Erklärung</dt>
                    <dd :style="{ color: 'var(--app-ink)' }">
                      {{
                        row.analysis_explanation.textual_explanation ??
                        `Erkannt durch ${row.analysis_explanation.recognizer}`
                      }}
                    </dd>
                  </div>
                  <div>
                    <dt class="field-label mb-0.5">Recognizer</dt>
                    <dd class="font-mono" :style="{ color: 'var(--app-ink)' }">
                      {{ row.analysis_explanation.recognizer }}
                    </dd>
                  </div>
                  <div>
                    <dt class="field-label mb-0.5">Score vorher → nachher</dt>
                    <dd class="font-mono tabular-nums" :style="{ color: 'var(--app-ink)' }">
                      {{ row.analysis_explanation.original_score.toFixed(2) }} →
                      {{ row.analysis_explanation.score.toFixed(2) }}
                      <span
                        v-if="row.analysis_explanation.score_context_improvement"
                        :style="{ color: 'oklch(0.62 0.16 150)' }"
                      >
                        (+{{ row.analysis_explanation.score_context_improvement.toFixed(2) }}
                        Kontext)
                      </span>
                    </dd>
                  </div>
                  <div v-if="row.analysis_explanation.supportive_context_word">
                    <dt class="field-label mb-0.5">Kontextwort</dt>
                    <dd class="font-mono" :style="{ color: 'var(--app-ink)' }">
                      {{ row.analysis_explanation.supportive_context_word }}
                    </dd>
                  </div>
                  <div v-if="row.analysis_explanation.validation_result !== null">
                    <dt class="field-label mb-0.5">Prüfsummen-Validierung</dt>
                    <dd
                      :style="{
                        color: row.analysis_explanation.validation_result
                          ? 'oklch(0.62 0.16 150)'
                          : 'oklch(0.65 0.18 30)',
                      }"
                    >
                      {{ row.analysis_explanation.validation_result ? 'bestanden' : 'fehlgeschlagen' }}
                    </dd>
                  </div>
                  <div v-if="row.analysis_explanation.pattern" class="sm:col-span-2">
                    <dt class="field-label mb-0.5">
                      Muster{{
                        row.analysis_explanation.pattern_name
                          ? ` · ${row.analysis_explanation.pattern_name}`
                          : ''
                      }}
                    </dt>
                    <dd
                      class="overflow-x-auto rounded px-2 py-1 font-mono text-[0.68rem] whitespace-pre"
                      :style="{ background: 'var(--app-bg)', color: 'var(--app-ink-muted)' }"
                    >{{ row.analysis_explanation.pattern }}</dd>
                  </div>
                </dl>
              </td>
            </tr>
          </template>
          <tr v-if="!rows.length">
            <td colspan="5" class="px-4 py-10 text-center text-sm" :style="{ color: 'var(--app-ink-faint)' }">
              Mit den aktuellen Einstellungen wurden keine personenbezogenen Daten gefunden.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer
      v-if="store.returnDecisionProcess && rows.some((r) => r.explained)"
      class="border-t px-4 py-2 text-[0.68rem]"
      :style="{ color: 'var(--app-ink-faint)' }"
    >
      Zeile aufklappen, um die Begründung des Analyzers zu sehen.
    </footer>
  </section>
</template>
