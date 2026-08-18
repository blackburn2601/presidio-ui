<script setup lang="ts">
import { entityStyle, prettyEntity } from '@/data/entities'
import type { RenderToken } from '@/types/presidio'

defineProps<{ tokens: RenderToken[]; activeEntity?: string | null }>()
const emit = defineEmits<{ hover: [entity: string | null] }>()
</script>

<template>
  <div
    class="font-mono text-[0.8125rem] leading-[2] break-words whitespace-pre-wrap"
    :style="{ color: 'var(--app-ink)' }"
  >
    <template v-for="(token, index) in tokens" :key="index">
      <span
        v-if="token.entity"
        class="entity-token"
        :style="entityStyle(token.entity.entity_type)"
        :data-active="activeEntity === token.entity.entity_type"
        :title="`${prettyEntity(token.entity.entity_type)} · score ${token.entity.score.toFixed(2)} · chars ${token.entity.start}–${token.entity.end}`"
        @mouseenter="emit('hover', token.entity.entity_type)"
        @mouseleave="emit('hover', null)"
      >{{ token.text }}</span>
      <span v-else>{{ token.text }}</span>
    </template>
  </div>
</template>
