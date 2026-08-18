<script setup lang="ts">
import { MapPin } from '@lucide/vue'
import { usePresidioStore } from '@/stores/presidio'
import { entityStyle, prettyEntity } from '@/data/entities'

const store = usePresidioStore()

function toggle(id: string) {
  store.enabledPresets = store.enabledPresets.includes(id)
    ? store.enabledPresets.filter((p) => p !== id)
    : [...store.enabledPresets, id]
}
</script>

<template>
  <div class="space-y-2">
    <label
      v-for="preset in store.availablePresets"
      :key="preset.id"
      class="flex cursor-pointer gap-2.5 rounded-lg border p-2.5 transition-colors"
      :style="{
        background: store.enabledPresets.includes(preset.id)
          ? 'var(--app-brand-soft)'
          : 'var(--app-raised)',
        borderColor: store.enabledPresets.includes(preset.id)
          ? 'var(--app-brand)'
          : 'var(--app-line-strong)',
      }"
    >
      <input
        type="checkbox"
        class="mt-0.5 h-4 w-4 shrink-0 accent-[var(--app-brand)]"
        :checked="store.enabledPresets.includes(preset.id)"
        @change="toggle(preset.id)"
      />
      <span class="min-w-0">
        <span class="flex flex-wrap items-center gap-1.5">
          <span class="text-[0.8rem] font-semibold" :style="{ color: 'var(--app-ink)' }">
            {{ preset.label }}
          </span>
          <span class="entity-chip" :style="entityStyle(preset.entity)">
            <span class="entity-dot" />
            {{ prettyEntity(preset.entity) }}
          </span>
        </span>
        <span
          class="mt-1 block text-[0.68rem] leading-snug"
          :style="{ color: 'var(--app-ink-faint)' }"
        >
          {{ preset.description }}
        </span>
      </span>
    </label>

    <p
      v-if="!store.availablePresets.length"
      class="flex items-center gap-1.5 px-1 py-2 text-xs"
      :style="{ color: 'var(--app-ink-faint)' }"
    >
      <MapPin :size="13" /> Für diese Sprache sind noch keine Regeln hinterlegt.
    </p>
  </div>
</template>
