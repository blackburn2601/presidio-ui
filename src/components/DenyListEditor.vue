<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import { usePresidioStore } from '@/stores/presidio'

const store = usePresidioStore()
</script>

<template>
  <div class="space-y-2.5">
    <div
      v-for="rule in store.denyRules"
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
          :aria-label="`Regel ${rule.entity} entfernen`"
          @click="store.removeDenyRule(rule.id)"
        >
          <Trash2 :size="14" />
        </button>
      </div>
      <textarea
        v-model="rule.terms"
        rows="3"
        class="input resize-y font-mono text-xs"
        placeholder="Ein Begriff pro Zeile&#10;Falcon&#10;Projekt Aurora"
      />
    </div>
    <button class="btn btn-ghost w-full" @click="store.addDenyRule()">
      <Plus :size="14" /> Sperrliste hinzufügen
    </button>
  </div>
</template>
