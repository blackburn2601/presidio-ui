<script setup lang="ts">
import { BookOpen, Moon, Shield, Sun } from '@lucide/vue'
import ServiceStatus from '@/components/ServiceStatus.vue'
import { useTheme } from '@/composables/useTheme'
import { useHashRoute } from '@/composables/useHashRoute'

const { isDark, toggle } = useTheme()
const { view, go } = useHashRoute()
</script>

<template>
  <header
    class="flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-6"
    :style="{ background: 'var(--app-surface)' }"
  >
    <button
      class="flex items-center gap-2.5 rounded-lg text-left"
      title="Zurück zum Studio"
      @click="go('studio')"
    >
      <span
        class="flex h-8 w-8 items-center justify-center rounded-lg"
        :style="{ background: 'var(--app-brand)' }"
      >
        <Shield :size="17" class="text-white" />
      </span>
      <div class="leading-tight">
        <h1 class="text-[0.95rem] font-semibold" :style="{ color: 'var(--app-ink)' }">
          Presidio Studio
        </h1>
        <p class="text-[0.7rem]" :style="{ color: 'var(--app-ink-faint)' }">
          Personenbezogene Daten erkennen &amp; anonymisieren
        </p>
      </div>
    </button>

    <div class="ml-auto flex items-center gap-3">
      <ServiceStatus class="hidden sm:flex" />
      <button
        class="btn px-2 py-1.5"
        :class="view === 'docs' ? 'btn-primary' : 'btn-ghost'"
        title="Dokumentation öffnen"
        @click="go(view === 'docs' ? 'studio' : 'docs')"
      >
        <BookOpen :size="15" />
        <span class="hidden sm:inline">Dokumentation</span>
      </button>
      <button
        class="btn btn-ghost px-2 py-1.5"
        :title="isDark ? 'Zu hellem Design wechseln' : 'Zu dunklem Design wechseln'"
        @click="toggle"
      >
        <component :is="isDark ? Sun : Moon" :size="15" />
      </button>
    </div>
    <ServiceStatus class="w-full sm:hidden" />
  </header>
</template>
