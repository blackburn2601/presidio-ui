<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, X } from '@lucide/vue'
import { entityStyle, prettyEntity } from '@/data/entities'

const props = defineProps<{ options: string[]; counts: Map<string, number> }>()
const model = defineModel<string[]>({ required: true })

const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.toLowerCase().includes(q))
})

const allSelected = computed(() => model.value.length === 0)

/** Entity types that actually turned up in the most recent run. */
const detected = computed(() =>
  props.options.filter((option) => (props.counts.get(option) ?? 0) > 0),
)

function toggle(entity: string) {
  // An empty selection means "everything", so materialise the full list on the
  // first deselect instead of silently widening the filter.
  if (allSelected.value) {
    model.value = props.options.filter((o) => o !== entity)
    return
  }
  model.value = model.value.includes(entity)
    ? model.value.filter((e) => e !== entity)
    : [...model.value, entity]
}

const isOn = (entity: string) => allSelected.value || model.value.includes(entity)
</script>

<template>
  <div class="space-y-2.5">
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <Search
          :size="14"
          class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
          :style="{ color: 'var(--app-ink-faint)' }"
        />
        <input v-model="query" class="input pl-8" placeholder="Entitäten filtern…" />
        <button
          v-if="query"
          class="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5"
          :style="{ color: 'var(--app-ink-faint)' }"
          @click="query = ''"
        >
          <X :size="13" />
        </button>
      </div>
    </div>

    <div class="flex gap-1.5 text-xs">
      <button
        class="btn btn-ghost px-2 py-1 text-xs"
        :disabled="allSelected"
        title="Nach allen unterstützten Entitäten suchen"
        @click="model = []"
      >
        Alle
      </button>
      <button
        class="btn btn-ghost px-2 py-1 text-xs"
        :disabled="!detected.length"
        title="Auf die im aktuellen Text gefundenen Arten eingrenzen"
        @click="model = detected"
      >
        Nur gefundene
      </button>
      <span class="ml-auto self-center" :style="{ color: 'var(--app-ink-faint)' }">
        {{ allSelected ? options.length : model.length }} / {{ options.length }}
      </span>
    </div>

    <div class="scroll-thin max-h-64 space-y-1 overflow-y-auto pr-1">
      <button
        v-for="entity in filtered"
        :key="entity"
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors"
        :style="{
          background: isOn(entity) ? 'var(--app-raised)' : 'transparent',
          opacity: isOn(entity) ? 1 : 0.55,
        }"
        @click="toggle(entity)"
      >
        <span
          class="flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-bold text-white"
          :style="{
            background: isOn(entity) ? 'var(--app-brand)' : 'transparent',
            borderColor: isOn(entity) ? 'var(--app-brand)' : 'var(--app-line-strong)',
          }"
        >
          <span v-if="isOn(entity)">✓</span>
        </span>
        <span class="entity-dot" :style="entityStyle(entity)" />
        <span
          class="flex-1 truncate text-[0.78rem] font-medium"
          :style="{ color: 'var(--app-ink)' }"
          :title="entity"
        >
          {{ prettyEntity(entity) }}
        </span>
        <span
          v-if="counts.get(entity)"
          class="rounded-full px-1.5 text-[0.65rem] font-semibold tabular-nums"
          :style="{ background: 'var(--app-brand-soft)', color: 'var(--app-brand-ink)' }"
        >
          {{ counts.get(entity) }}
        </span>
      </button>
      <p
        v-if="!filtered.length"
        class="px-2 py-3 text-center text-xs"
        :style="{ color: 'var(--app-ink-faint)' }"
      >
        Keine Entität passt zu „{{ query }}“.
      </p>
    </div>
  </div>
</template>
