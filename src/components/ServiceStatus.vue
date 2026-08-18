<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw } from '@lucide/vue'
import { usePresidioStore } from '@/stores/presidio'
import type { ServiceHealth } from '@/types/presidio'

const store = usePresidioStore()

const services = computed(() => [
  { name: 'Analyzer', health: store.analyzerHealth as ServiceHealth },
  { name: 'Anonymizer', health: store.anonymizerHealth as ServiceHealth },
])

function color(health: ServiceHealth) {
  if (health.state === 'online') return 'oklch(0.68 0.17 150)'
  if (health.state === 'offline') return 'oklch(0.63 0.21 25)'
  if (health.state === 'checking') return 'oklch(0.75 0.15 85)'
  return 'var(--app-ink-faint)'
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div
      v-for="service in services"
      :key="service.name"
      class="flex items-center gap-1.5"
      :title="`${service.name}: ${service.health.message || service.health.state}${
        service.health.latencyMs !== null ? ` (${service.health.latencyMs} ms)` : ''
      }`"
    >
      <span
        class="h-2 w-2 rounded-full"
        :class="service.health.state === 'checking' ? 'animate-pulse' : ''"
        :style="{ background: color(service.health) }"
      />
      <span class="text-xs font-medium" :style="{ color: 'var(--app-ink-muted)' }">
        {{ service.name }}
      </span>
    </div>
    <button
      class="btn btn-subtle px-1.5 py-1"
      title="Dienststatus erneut prüfen"
      @click="store.checkHealth()"
    >
      <RefreshCw
        :size="13"
        :class="store.analyzerHealth.state === 'checking' ? 'animate-spin' : ''"
      />
    </button>
  </div>
</template>
