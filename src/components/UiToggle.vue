<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
defineProps<{ label: string; hint?: string }>()
</script>

<template>
  <label class="flex cursor-pointer items-start gap-3 select-none">
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      class="relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      :style="{
        background: model ? 'var(--app-brand)' : 'var(--app-line-strong)',
        outlineColor: 'var(--app-brand)',
      }"
      @click="model = !model"
    >
      <span
        class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
        :class="model ? 'translate-x-4' : 'translate-x-0'"
      />
    </button>
    <span class="min-w-0">
      <span class="block text-[0.8125rem] font-medium leading-tight" :style="{ color: 'var(--app-ink)' }">
        {{ label }}
      </span>
      <span
        v-if="hint"
        class="mt-0.5 block text-xs leading-snug"
        :style="{ color: 'var(--app-ink-faint)' }"
      >
        {{ hint }}
      </span>
    </span>
  </label>
</template>
