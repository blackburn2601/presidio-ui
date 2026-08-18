<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Trash2, TriangleAlert } from '@lucide/vue'
import { usePresidioStore } from '@/stores/presidio'

const store = usePresidioStore()

/** Presidio compiles patterns with Python `re`; this only catches gross typos. */
const invalidIds = computed(() => {
  const bad = new Set<string>()
  for (const rule of store.regexRules) {
    if (!rule.pattern.trim()) continue
    try {
      new RegExp(rule.pattern)
    } catch {
      bad.add(rule.id)
    }
  }
  return bad
})
</script>

<template>
  <div class="space-y-2.5">
    <div
      v-for="rule in store.regexRules"
      :key="rule.id"
      class="space-y-2 rounded-lg border p-2.5"
      :style="{ background: 'var(--app-raised)' }"
    >
      <div class="flex gap-1.5">
        <input
          v-model="rule.entity"
          class="input font-mono text-xs uppercase"
          placeholder="ENTITAETSNAME"
        />
        <button
          class="btn btn-subtle px-2"
          :aria-label="`Muster ${rule.entity} entfernen`"
          @click="store.removeRegexRule(rule.id)"
        >
          <Trash2 :size="14" />
        </button>
      </div>
      <input
        v-model="rule.pattern"
        class="input font-mono text-xs"
        placeholder="[A-Z]{3}-\d{4}"
        spellcheck="false"
      />
      <p
        v-if="invalidIds.has(rule.id)"
        class="flex items-center gap-1 text-[0.68rem]"
        :style="{ color: 'oklch(0.62 0.19 25)' }"
      >
        <TriangleAlert :size="11" /> Dieses Muster lässt sich im Browser nicht übersetzen — Presidio
        akzeptiert es womöglich trotzdem, wenn es Python-spezifische Syntax nutzt.
      </p>
      <div class="flex items-center gap-2">
        <label class="field-label mb-0 shrink-0">Score</label>
        <input
          v-model.number="rule.score"
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          class="flex-1 accent-[var(--app-brand)]"
        />
        <span
          class="w-8 text-right text-xs tabular-nums"
          :style="{ color: 'var(--app-ink-muted)' }"
        >
          {{ rule.score.toFixed(2) }}
        </span>
      </div>
    </div>
    <button class="btn btn-ghost w-full" @click="store.addRegexRule()">
      <Plus :size="14" /> Muster hinzufügen
    </button>
  </div>
</template>
