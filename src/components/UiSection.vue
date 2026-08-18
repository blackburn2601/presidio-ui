<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from '@lucide/vue'

const props = withDefaults(
  defineProps<{ title: string; hint?: string; open?: boolean; badge?: string | number }>(),
  { open: true },
)

const expanded = ref(props.open)
</script>

<template>
  <section class="border-b last:border-b-0" :style="{ borderColor: 'var(--app-line)' }">
    <button
      type="button"
      class="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--app-raised)]"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <ChevronDown
        :size="15"
        class="shrink-0 transition-transform"
        :class="expanded ? '' : '-rotate-90'"
        :style="{ color: 'var(--app-ink-faint)' }"
      />
      <span class="text-[0.8125rem] font-semibold" :style="{ color: 'var(--app-ink)' }">
        {{ title }}
      </span>
      <span
        v-if="badge !== undefined && badge !== '' && badge !== 0"
        class="rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold"
        :style="{ background: 'var(--app-brand-soft)', color: 'var(--app-brand-ink)' }"
      >
        {{ badge }}
      </span>
    </button>
    <div v-show="expanded" class="px-4 pb-4">
      <p v-if="hint" class="mb-3 text-xs leading-relaxed" :style="{ color: 'var(--app-ink-faint)' }">
        {{ hint }}
      </p>
      <slot />
    </div>
  </section>
</template>
