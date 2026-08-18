<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { LoaderCircle, PanelLeftClose, PanelLeftOpen, TriangleAlert } from '@lucide/vue'
import AppHeader from '@/components/AppHeader.vue'
import ConfigSidebar from '@/components/ConfigSidebar.vue'
import InputPanel from '@/components/InputPanel.vue'
import OutputPanel from '@/components/OutputPanel.vue'
import FindingsTable from '@/components/FindingsTable.vue'
import ApiInspector from '@/components/ApiInspector.vue'
import StatsBar from '@/components/StatsBar.vue'
import DocsPage from '@/components/DocsPage.vue'
import { usePresidioStore } from '@/stores/presidio'
import { useHashRoute } from '@/composables/useHashRoute'

const store = usePresidioStore()
const { view } = useHashRoute()

/** Entity type hovered anywhere in the UI; cross-highlighted in every panel. */
const activeEntity = ref<string | null>(null)
const sidebarOpen = ref(true)
const bottomTab = ref<'findings' | 'api'>('findings')

onMounted(() => store.bootstrap())
</script>

<template>
  <!--
    From `lg` up the app is pinned to the viewport and never scrolls as a whole:
    each panel owns its scrollbar instead. Below that breakpoint there is not
    enough height to make panels usable, so the page falls back to normal flow.
  -->
  <div
    class="flex min-h-dvh flex-col"
    :class="view === 'studio' ? 'lg:h-dvh lg:min-h-0 lg:overflow-hidden' : ''"
    :style="{ background: 'var(--app-bg)' }"
  >
    <AppHeader class="sticky top-0 z-30 shrink-0" />

    <DocsPage v-if="view === 'docs'" />

    <div
      v-if="view === 'studio' && store.bootstrapError"
      class="flex shrink-0 items-start gap-2 border-b px-4 py-2.5 text-sm sm:px-6"
      :style="{
        background: 'oklch(0.96 0.045 60)',
        borderColor: 'oklch(0.84 0.1 60)',
        color: 'oklch(0.44 0.12 55)',
      }"
    >
      <TriangleAlert :size="16" class="mt-0.5 shrink-0" />
      <div>
        <p class="font-medium">Die Analyzer-Konfiguration konnte nicht geladen werden.</p>
        <p class="text-[0.8rem] opacity-90">{{ store.bootstrapError }}</p>
      </div>
      <button class="btn btn-ghost ml-auto px-2 py-1 text-xs" @click="store.bootstrap()">
        Erneut versuchen
      </button>
    </div>

    <main
      v-if="view === 'studio'"
      class="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:min-h-0 lg:flex-row"
    >
      <!-- Ordered after the workspace on narrow screens, beside it on wide ones. -->
      <div
        class="order-2 shrink-0 overflow-hidden transition-[width] duration-200 lg:order-1 lg:h-full"
        :class="sidebarOpen ? 'lg:w-[21rem]' : 'lg:w-0'"
      >
        <ConfigSidebar v-show="sidebarOpen" class="max-h-[36rem] lg:max-h-none lg:h-full" />
      </div>

      <div class="order-1 flex min-w-0 flex-1 flex-col gap-4 lg:order-2 lg:min-h-0">
        <div class="flex shrink-0 items-center gap-3">
          <button
            class="btn btn-ghost hidden shrink-0 px-2 py-1.5 lg:inline-flex"
            :title="sidebarOpen ? 'Konfiguration ausblenden' : 'Konfiguration einblenden'"
            @click="sidebarOpen = !sidebarOpen"
          >
            <component :is="sidebarOpen ? PanelLeftClose : PanelLeftOpen" :size="15" />
          </button>
          <StatsBar :active-entity="activeEntity" @hover="activeEntity = $event" />
          <LoaderCircle
            v-if="store.isRunning"
            :size="15"
            class="ml-auto shrink-0 animate-spin"
            :style="{ color: 'var(--app-brand)' }"
          />
        </div>

        <!-- Editor and findings split the remaining height evenly … -->
        <div class="flex flex-col gap-4 xl:flex-row lg:min-h-[14rem] lg:flex-1 lg:basis-0">
          <InputPanel
            class="h-[22rem] flex-1 lg:h-auto lg:min-h-0"
            :active-entity="activeEntity"
            @hover="activeEntity = $event"
          />
          <OutputPanel
            class="h-[22rem] flex-1 lg:h-auto lg:min-h-0"
            :active-entity="activeEntity"
            @hover="activeEntity = $event"
          />
        </div>

        <!-- … each scrolling inside its own box, never the page. -->
        <div class="flex flex-col lg:min-h-[14rem] lg:flex-1 lg:basis-0">
          <div class="mb-2 flex shrink-0 items-center gap-1.5">
            <button
              class="btn px-2.5 py-1 text-xs"
              :class="bottomTab === 'findings' ? 'btn-primary' : 'btn-subtle'"
              @click="bottomTab = 'findings'"
            >
              Treffer
            </button>
            <button
              class="btn px-2.5 py-1 text-xs"
              :class="bottomTab === 'api' ? 'btn-primary' : 'btn-subtle'"
              @click="bottomTab = 'api'"
            >
              API-Inspektor
            </button>
          </div>
          <FindingsTable
            v-if="bottomTab === 'findings'"
            class="h-[20rem] lg:h-auto lg:min-h-0 lg:flex-1"
            :active-entity="activeEntity"
            @hover="activeEntity = $event"
          />
          <ApiInspector v-else class="h-[20rem] lg:h-auto lg:min-h-0 lg:flex-1" />
        </div>
      </div>
    </main>
  </div>
</template>
