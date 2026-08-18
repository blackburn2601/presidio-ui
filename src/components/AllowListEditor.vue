<script setup lang="ts">
import { ref } from 'vue'
import { Plus, X } from '@lucide/vue'

const model = defineModel<string[]>({ required: true })
const draft = ref('')

function add() {
  const value = draft.value.trim()
  if (!value || model.value.includes(value)) {
    draft.value = ''
    return
  }
  model.value = [...model.value, value]
  draft.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex gap-1.5">
      <input
        v-model="draft"
        class="input"
        placeholder="Begriff, der nie markiert wird…"
        @keydown.enter.prevent="add"
      />
      <button class="btn btn-ghost px-2.5" :disabled="!draft.trim()" @click="add">
        <Plus :size="15" />
      </button>
    </div>
    <div v-if="model.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="phrase in model"
        :key="phrase"
        class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs"
        :style="{ background: 'var(--app-raised)', color: 'var(--app-ink)' }"
      >
        {{ phrase }}
        <button
          class="opacity-50 transition-opacity hover:opacity-100"
          :aria-label="`${phrase} entfernen`"
          @click="model = model.filter((p) => p !== phrase)"
        >
          <X :size="12" />
        </button>
      </span>
    </div>
  </div>
</template>
