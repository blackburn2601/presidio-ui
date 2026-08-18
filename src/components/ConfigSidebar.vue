<script setup lang="ts">
import { computed } from 'vue'
import { RotateCcw } from '@lucide/vue'
import UiSection from '@/components/UiSection.vue'
import UiToggle from '@/components/UiToggle.vue'
import EntitySelector from '@/components/EntitySelector.vue'
import OperatorSettings from '@/components/OperatorSettings.vue'
import AllowListEditor from '@/components/AllowListEditor.vue'
import DenyListEditor from '@/components/DenyListEditor.vue'
import RegexEditor from '@/components/RegexEditor.vue'
import PresetRecognizers from '@/components/PresetRecognizers.vue'
import { usePresidioStore } from '@/stores/presidio'

const store = usePresidioStore()

const countsByEntity = computed(
  () => new Map(store.entityCounts.map((c) => [c.entity, c.count])),
)

const denyBadge = computed(
  () => store.denyRules.filter((r) => r.terms.trim() && r.entity.trim()).length,
)
const regexBadge = computed(
  () => store.regexRules.filter((r) => r.pattern.trim() && r.entity.trim()).length,
)
</script>

<template>
  <aside
    class="panel scroll-thin flex h-full flex-col overflow-y-auto"
    aria-label="Einstellungen zur Erkennung"
  >
    <div
      class="sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur"
      :style="{ background: 'color-mix(in oklch, var(--app-surface) 88%, transparent)' }"
    >
      <h2 class="text-sm font-semibold" :style="{ color: 'var(--app-ink)' }">Konfiguration</h2>
      <button class="btn btn-subtle px-2 py-1 text-xs" title="Auf Standardwerte zurücksetzen" @click="store.reset()">
        <RotateCcw :size="13" /> Zurücksetzen
      </button>
    </div>

    <UiSection title="Sprache & Modell" hint="Ermittelt aus der NLP-Engine des Analyzers.">
      <div class="space-y-3">
        <div>
          <label class="field-label">Sprache</label>
          <select v-model="store.language" class="input">
            <option v-for="lang in store.languages" :key="lang.code" :value="lang.code">
              {{ lang.label }} ({{ lang.code }}) — {{ lang.entities.length }} Entitäten
            </option>
          </select>
        </div>
        <div v-if="store.recognizers.length">
          <label class="field-label">Aktive Recognizer</label>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="rec in store.recognizers"
              :key="rec"
              class="rounded border px-1.5 py-0.5 font-mono text-[0.65rem]"
              :style="{ background: 'var(--app-raised)', color: 'var(--app-ink-muted)' }"
            >
              {{ rec.replace(/Recognizer$/, '') }}
            </span>
          </div>
        </div>
      </div>
    </UiSection>

    <UiSection title="Anonymisierung">
      <OperatorSettings />
    </UiSection>

    <UiSection title="Erkennungsschwelle">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <input
            v-model.number="store.scoreThreshold"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="flex-1 accent-[var(--app-brand)]"
          />
          <span
            class="w-10 rounded px-1.5 py-0.5 text-right text-xs font-semibold tabular-nums"
            :style="{ background: 'var(--app-brand-soft)', color: 'var(--app-brand-ink)' }"
          >
            {{ store.scoreThreshold.toFixed(2) }}
          </span>
        </div>
        <p class="text-[0.68rem] leading-relaxed" :style="{ color: 'var(--app-ink-faint)' }">
          Treffer unterhalb dieser Konfidenz verwirft der Analyzer. Höher stellen reduziert
          Fehlalarme, niedriger stellen findet mehr.
        </p>
      </div>
    </UiSection>

    <UiSection
      title="Entitäten"
      :badge="store.entityFilterActive ? store.selectedEntities.length : ''"
      hint="Erkennung auf bestimmte Datenarten eingrenzen. Ohne Auswahl wird nach allen gesucht."
    >
      <EntitySelector
        v-model="store.selectedEntities"
        :options="store.allEntities"
        :counts="countsByEntity"
      />
    </UiSection>

    <UiSection
      title="Adress-Erkennung"
      :badge="store.activePresets.length"
      hint="Presidio erkennt Orte, aber keine Straßen oder Postleitzahlen. Diese Regeln ergänzen das ohne Änderung am Server."
    >
      <PresetRecognizers />
    </UiSection>

    <UiSection
      title="Ausnahmeliste"
      :badge="store.allowList.length"
      :open="false"
      hint="Begriffe, die nie als personenbezogen gelten sollen — auch wenn ein Recognizer anschlägt."
    >
      <AllowListEditor v-model="store.allowList" />
    </UiSection>

    <UiSection
      title="Sperrliste"
      :badge="denyBadge"
      :open="false"
      hint="Begriffe, die immer als Treffer gelten sollen — unter einer Entität Ihrer Wahl."
    >
      <DenyListEditor />
    </UiSection>

    <UiSection
      title="Eigene Muster"
      :badge="regexBadge"
      :open="false"
      hint="Reguläre Ausdrücke, die nur für diese Anfrage als Ad-hoc-Recognizer registriert werden."
    >
      <RegexEditor />
    </UiSection>

    <UiSection title="Verhalten" :open="false">
      <div class="space-y-3">
        <UiToggle
          v-model="store.autoRun"
          label="Automatisch analysieren"
          hint="Startet die Analyse kurz nach jeder Änderung neu."
        />
        <UiToggle
          v-model="store.returnDecisionProcess"
          label="Entscheidungen erklären"
          hint="Fragt beim Analyzer nach, warum ein Treffer entstand — sichtbar in der Trefferliste."
        />
      </div>
    </UiSection>
  </aside>
</template>
