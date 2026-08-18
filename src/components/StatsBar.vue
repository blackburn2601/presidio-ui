<script setup lang="ts">
import { computed } from 'vue'
import { usePresidioStore } from '@/stores/presidio'
import { entityStyle, prettyEntity } from '@/data/entities'

const store = usePresidioStore()
const emit = defineEmits<{ hover: [entity: string | null] }>()
defineProps<{ activeEntity?: string | null }>()

const total = computed(() => store.visibleSpans.length)
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <span
      class="rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
      :style="{ background: 'var(--app-brand-soft)', color: 'var(--app-brand-ink)' }"
    >
      {{ total }} {{ total === 1 ? 'Treffer' : 'Treffer' }}
    </span>
    <button
      v-for="stat in store.entityCounts"
      :key="stat.entity"
      class="entity-chip transition-transform hover:scale-[1.04]"
      :style="entityStyle(stat.entity)"
      :data-active="activeEntity === stat.entity"
      @mouseenter="emit('hover', stat.entity)"
      @mouseleave="emit('hover', null)"
    >
      <span class="entity-dot" />
      {{ prettyEntity(stat.entity) }}
      <span class="tabular-nums opacity-75">{{ stat.count }}</span>
    </button>
    <span
      v-if="store.supersededCount"
      class="text-xs"
      :style="{ color: 'var(--app-ink-faint)' }"
      :title="'Presidio liefert überlappende Fundstellen; je Bereich wird die stärkste angezeigt.'"
    >
      +{{ store.supersededCount }} überlappend
    </span>
  </div>
</template>
