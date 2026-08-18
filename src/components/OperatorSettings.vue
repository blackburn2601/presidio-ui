<script setup lang="ts">
import { computed } from 'vue'
import UiToggle from '@/components/UiToggle.vue'
import { Eye, EyeOff, Hash, Lock, PenLine, Scissors, SquareAsterisk, KeyRound } from '@lucide/vue'
import type { OutputMode } from '@/stores/presidio'
import { usePresidioStore } from '@/stores/presidio'

const store = usePresidioStore()

interface ModeMeta {
  id: OutputMode
  label: string
  icon: typeof Eye
  blurb: string
}

const MODES: ModeMeta[] = [
  { id: 'highlight', label: 'Hervorheben', icon: Eye, blurb: 'Text behalten, Treffer färben' },
  { id: 'replace', label: 'Ersetzen', icon: PenLine, blurb: 'Durch Platzhalter austauschen' },
  { id: 'redact', label: 'Entfernen', icon: Scissors, blurb: 'Wert vollständig löschen' },
  { id: 'mask', label: 'Maskieren', icon: SquareAsterisk, blurb: 'Zeichen mit Symbol überdecken' },
  { id: 'hash', label: 'Hashen', icon: Hash, blurb: 'Einweg-Prüfsumme des Werts' },
  { id: 'encrypt', label: 'Verschlüsseln', icon: Lock, blurb: 'Umkehrbare AES-Verschlüsselung' },
  { id: 'keep', label: 'Beibehalten', icon: EyeOff, blurb: 'Wert unverändert lassen' },
]

const available = computed(() =>
  MODES.filter(
    (m) =>
      m.id === 'highlight' ||
      !store.availableOperators.length ||
      store.availableOperators.includes(m.id),
  ),
)

const keyLengthHint = computed(() => {
  const bytes = new TextEncoder().encode(store.operatorParams.key).length
  if ([16, 24, 32].includes(bytes)) return { ok: true, text: `AES-Schlüssel mit ${bytes} Byte` }
  return { ok: false, text: `${bytes} Byte — AES benötigt 16, 24 oder 32` }
})
</script>

<template>
  <div class="space-y-3">
    <div class="grid grid-cols-2 gap-1.5">
      <button
        v-for="mode in available"
        :key="mode.id"
        type="button"
        class="flex flex-col gap-1 rounded-lg border px-2.5 py-2 text-left transition-colors"
        :style="{
          background: store.outputMode === mode.id ? 'var(--app-brand-soft)' : 'transparent',
          borderColor:
            store.outputMode === mode.id ? 'var(--app-brand)' : 'var(--app-line-strong)',
        }"
        @click="store.outputMode = mode.id"
      >
        <span class="flex items-center gap-1.5">
          <component
            :is="mode.icon"
            :size="14"
            :style="{
              color:
                store.outputMode === mode.id ? 'var(--app-brand-ink)' : 'var(--app-ink-faint)',
            }"
          />
          <span
            class="text-[0.78rem] font-semibold"
            :style="{
              color: store.outputMode === mode.id ? 'var(--app-brand-ink)' : 'var(--app-ink)',
            }"
          >
            {{ mode.label }}
          </span>
        </span>
        <span class="text-[0.66rem] leading-tight" :style="{ color: 'var(--app-ink-faint)' }">
          {{ mode.blurb }}
        </span>
      </button>
    </div>

    <div
      v-if="store.outputMode === 'replace'"
      class="rounded-lg border p-3"
      :style="{ background: 'var(--app-raised)' }"
    >
      <label class="field-label">Ersatzwert</label>
      <input
        v-model="store.operatorParams.new_value"
        class="input font-mono"
        placeholder="<ENTITY_TYPE>"
      />
      <p class="mt-1.5 text-[0.68rem]" :style="{ color: 'var(--app-ink-faint)' }">
        Leer lassen für Presidios Standard: die Entität in spitzen Klammern.
      </p>
    </div>

    <div
      v-if="store.outputMode === 'mask'"
      class="space-y-3 rounded-lg border p-3"
      :style="{ background: 'var(--app-raised)' }"
    >
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="field-label">Maskierzeichen</label>
          <input v-model="store.operatorParams.masking_char" maxlength="1" class="input font-mono text-center" />
        </div>
        <div>
          <label class="field-label">Anzahl Zeichen</label>
          <input
            v-model.number="store.operatorParams.chars_to_mask"
            type="number"
            min="1"
            max="200"
            class="input tabular-nums"
          />
        </div>
      </div>
      <UiToggle v-model="store.operatorParams.from_end" label="Vom Ende des Werts maskieren" />
    </div>

    <div
      v-if="store.outputMode === 'hash'"
      class="rounded-lg border p-3"
      :style="{ background: 'var(--app-raised)' }"
    >
      <label class="field-label">Hash-Verfahren</label>
      <div class="flex gap-1.5">
        <button
          v-for="algo in (['md5', 'sha256', 'sha512'] as const)"
          :key="algo"
          type="button"
          class="btn flex-1 font-mono text-xs"
          :class="store.operatorParams.hash_type === algo ? 'btn-primary' : 'btn-ghost'"
          @click="store.operatorParams.hash_type = algo"
        >
          {{ algo }}
        </button>
      </div>
    </div>

    <div
      v-if="store.outputMode === 'encrypt'"
      class="rounded-lg border p-3"
      :style="{ background: 'var(--app-raised)' }"
    >
      <label class="field-label">AES-Schlüssel</label>
      <input v-model="store.operatorParams.key" class="input font-mono text-xs" />
      <p
        class="mt-1.5 flex items-center gap-1 text-[0.68rem]"
        :style="{ color: keyLengthHint.ok ? 'var(--app-ink-faint)' : 'oklch(0.6 0.2 25)' }"
      >
        <KeyRound :size="11" /> {{ keyLengthHint.text }}
      </p>
      <p class="mt-1 text-[0.68rem]" :style="{ color: 'var(--app-ink-faint)' }">
        Verschlüsselte Werte lassen sich mit demselben Schlüssel im Ausgabefeld wiederherstellen.
      </p>
    </div>
  </div>
</template>
