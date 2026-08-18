import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { discoverLanguages, presidio, PresidioError } from '@/api/presidio'
import type {
  AdHocRecognizer,
  AnalyzeRequest,
  AnonymizedItem,
  AnonymizeResponse,
  OperatorConfig,
  OperatorType,
  PatternDefinition,
  RecognizerResult,
  RenderToken,
  ServiceHealth,
} from '@/types/presidio'
import { SAMPLES } from '@/data/samples'
import {
  DEFAULT_ENABLED_PRESETS,
  presetsForLanguage,
  presetToRecognizer,
} from '@/data/recognizerPresets'

export type OutputMode = 'highlight' | OperatorType

export interface DenyListRule {
  id: string
  entity: string
  terms: string
}

export interface RegexRule {
  id: string
  entity: string
  pattern: string
  score: number
}

export interface LanguageOption {
  code: string
  label: string
  entities: string[]
}

const STORAGE_KEY = 'presidio-ui:config'

const newId = () => Math.random().toString(36).slice(2, 10)

function emptyHealth(): ServiceHealth {
  return { state: 'unknown', message: '', latencyMs: null, checkedAt: null }
}

/**
 * Presidio may return overlapping spans (an IBAN also matching ORGANIZATION,
 * an email also matching URL). Rendering needs a flat, non-overlapping set, so
 * pick the strongest span for each region: higher score first, then longer.
 */
function resolveOverlaps(results: RecognizerResult[]): RecognizerResult[] {
  const ranked = results.slice().sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.end - b.start - (a.end - a.start)
  })

  const kept: RecognizerResult[] = []
  for (const candidate of ranked) {
    const clashes = kept.some((k) => candidate.start < k.end && k.start < candidate.end)
    if (!clashes) kept.push(candidate)
  }
  return kept.sort((a, b) => a.start - b.start)
}

/** Splits text into alternating plain / entity tokens for rendering. */
function buildTokens(text: string, spans: RecognizerResult[]): RenderToken[] {
  const tokens: RenderToken[] = []
  let cursor = 0
  for (const span of spans) {
    if (span.start > cursor) {
      tokens.push({ text: text.slice(cursor, span.start), entity: null })
    }
    tokens.push({ text: text.slice(span.start, span.end), entity: span })
    cursor = span.end
  }
  if (cursor < text.length) tokens.push({ text: text.slice(cursor), entity: null })
  return tokens
}

export const usePresidioStore = defineStore('presidio', () => {
  // ── Service discovery ────────────────────────────────────────────────────
  const analyzerHealth = reactive<ServiceHealth>(emptyHealth())
  const anonymizerHealth = reactive<ServiceHealth>(emptyHealth())
  const languages = ref<LanguageOption[]>([])
  const recognizers = ref<string[]>([])
  const availableOperators = ref<string[]>([])
  const bootstrapped = ref(false)
  const bootstrapError = ref<string | null>(null)

  // ── Configuration ────────────────────────────────────────────────────────
  const text = ref(SAMPLES[0].text)
  const language = ref('en')
  const selectedEntities = ref<string[]>([])
  const scoreThreshold = ref(0.35)
  const returnDecisionProcess = ref(true)
  const allowList = ref<string[]>([])
  const denyRules = ref<DenyListRule[]>([])
  const regexRules = ref<RegexRule[]>([])
  const enabledPresets = ref<string[]>([...DEFAULT_ENABLED_PRESETS])
  const autoRun = ref(true)

  const outputMode = ref<OutputMode>('highlight')
  const operatorParams = reactive({
    new_value: '',
    masking_char: '*',
    chars_to_mask: 12,
    from_end: true,
    hash_type: 'sha256' as 'md5' | 'sha256' | 'sha512',
    key: 'WmZq4t7w!z%C&F)J@NcRfUjXn2r5u8x/',
  })

  // ── Results ──────────────────────────────────────────────────────────────
  const analyzerResults = ref<RecognizerResult[]>([])
  const anonymized = ref<AnonymizeResponse | null>(null)
  const analyzedText = ref('')
  const isRunning = ref(false)
  const error = ref<string | null>(null)
  const lastRunMs = ref<number | null>(null)
  const hasRun = ref(false)

  const entitiesForLanguage = computed(
    () => languages.value.find((l) => l.code === language.value)?.entities ?? [],
  )

  /** Built-in presets that apply to the current language and are switched on. */
  const availablePresets = computed(() => presetsForLanguage(language.value))
  const activePresets = computed(() =>
    availablePresets.value.filter((preset) => enabledPresets.value.includes(preset.id)),
  )

  /** Entity types added through presets, deny lists or regex rules. */
  const customEntities = computed(() => {
    const names = new Set<string>()
    for (const rule of denyRules.value) {
      if (rule.entity.trim() && rule.terms.trim()) names.add(rule.entity.trim().toUpperCase())
    }
    for (const rule of regexRules.value) {
      if (rule.entity.trim() && rule.pattern.trim()) names.add(rule.entity.trim().toUpperCase())
    }
    for (const preset of activePresets.value) names.add(preset.entity)
    return [...names].sort()
  })

  const allEntities = computed(() =>
    [...new Set([...entitiesForLanguage.value, ...customEntities.value])].sort(),
  )

  /** Results enriched with the matched substring, strongest first. */
  const findings = computed<RecognizerResult[]>(() =>
    analyzerResults.value
      .map((r) => ({ ...r, text: analyzedText.value.slice(r.start, r.end) }))
      .sort((a, b) => b.score - a.score || a.start - b.start),
  )

  const visibleSpans = computed(() => resolveOverlaps(analyzerResults.value))

  const supersededCount = computed(
    () => analyzerResults.value.length - visibleSpans.value.length,
  )

  const inputTokens = computed(() => buildTokens(analyzedText.value, visibleSpans.value))

  /** Output tokens: entity spans reported by the anonymizer over its own text. */
  const outputTokens = computed<RenderToken[]>(() => {
    const result = anonymized.value
    if (!result) return []
    const spans = result.items
      .slice()
      .sort((a, b) => a.start - b.start)
      .map<RecognizerResult>((item: AnonymizedItem) => ({
        entity_type: item.entity_type,
        start: item.start,
        end: item.end,
        score: 1,
      }))
    return buildTokens(result.text, resolveOverlaps(spans))
  })

  const entityCounts = computed(() => {
    const counts = new Map<string, number>()
    for (const span of visibleSpans.value) {
      counts.set(span.entity_type, (counts.get(span.entity_type) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([entity, count]) => ({ entity, count }))
      .sort((a, b) => b.count - a.count || a.entity.localeCompare(b.entity))
  })

  const isEncrypting = computed(() => outputMode.value === 'encrypt')

  /** True when the user narrowed the entity list rather than accepting all. */
  const entityFilterActive = computed(
    () =>
      selectedEntities.value.length > 0 &&
      selectedEntities.value.length < allEntities.value.length,
  )

  function buildAdHocRecognizers(): AdHocRecognizer[] {
    const recognizerList: AdHocRecognizer[] = activePresets.value.map((preset) =>
      presetToRecognizer(preset, language.value),
    )

    for (const rule of denyRules.value) {
      const terms = rule.terms
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
      const entity = rule.entity.trim().toUpperCase()
      if (!terms.length || !entity) continue
      recognizerList.push({
        name: `DenyList_${entity}`,
        supported_entity: entity,
        supported_language: language.value,
        deny_list: terms,
      })
    }

    const byEntity = new Map<string, PatternDefinition[]>()
    for (const rule of regexRules.value) {
      const entity = rule.entity.trim().toUpperCase()
      if (!entity || !rule.pattern.trim()) continue
      const patterns = byEntity.get(entity) ?? []
      patterns.push({
        name: `${entity}_pattern_${patterns.length + 1}`,
        regex: rule.pattern,
        score: rule.score,
      })
      byEntity.set(entity, patterns)
    }
    for (const [entity, patterns] of byEntity) {
      recognizerList.push({
        name: `Regex_${entity}`,
        supported_entity: entity,
        supported_language: language.value,
        patterns,
      })
    }

    return recognizerList
  }

  function buildOperator(): OperatorConfig {
    switch (outputMode.value) {
      case 'highlight':
        return { type: 'keep' }
      case 'replace':
        return {
          type: 'replace',
          new_value: operatorParams.new_value.trim() || undefined,
        }
      case 'mask':
        return {
          type: 'mask',
          masking_char: operatorParams.masking_char.slice(0, 1) || '*',
          chars_to_mask: Math.max(1, Math.round(operatorParams.chars_to_mask)),
          from_end: operatorParams.from_end,
        }
      case 'hash':
        return { type: 'hash', hash_type: operatorParams.hash_type }
      case 'encrypt':
        return { type: 'encrypt', key: operatorParams.key }
      default:
        return { type: outputMode.value }
    }
  }

  function buildAnalyzeRequest(body: string): AnalyzeRequest {
    const request: AnalyzeRequest = {
      text: body,
      language: language.value,
      score_threshold: scoreThreshold.value,
      return_decision_process: returnDecisionProcess.value,
    }
    if (entityFilterActive.value) request.entities = selectedEntities.value
    if (allowList.value.length) request.allow_list = allowList.value

    const adHoc = buildAdHocRecognizers()
    if (adHoc.length) request.ad_hoc_recognizers = adHoc

    return request
  }

  let runToken = 0

  async function run() {
    const body = text.value
    if (!body.trim()) {
      analyzerResults.value = []
      anonymized.value = null
      analyzedText.value = ''
      error.value = null
      hasRun.value = false
      return
    }

    const token = ++runToken
    isRunning.value = true
    error.value = null
    const started = performance.now()

    try {
      const results = await presidio.analyze(buildAnalyzeRequest(body))
      if (token !== runToken) return

      analyzerResults.value = results
      analyzedText.value = body

      const anonymizeInput = resolveOverlaps(results).map((r) => ({
        entity_type: r.entity_type,
        start: r.start,
        end: r.end,
        score: r.score,
      }))

      if (!anonymizeInput.length) {
        anonymized.value = { text: body, items: [] }
      } else {
        const response = await presidio.anonymize({
          text: body,
          analyzer_results: anonymizeInput,
          anonymizers: { DEFAULT: buildOperator() },
        })
        if (token !== runToken) return
        anonymized.value = response
      }

      hasRun.value = true
      lastRunMs.value = Math.round(performance.now() - started)
    } catch (e) {
      if (token !== runToken) return
      error.value =
        e instanceof PresidioError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Unerwarteter Fehler bei der Kommunikation mit Presidio.'
      anonymized.value = null
    } finally {
      if (token === runToken) isRunning.value = false
    }
  }

  async function deanonymize(): Promise<AnonymizeResponse> {
    const result = anonymized.value
    if (!result) throw new PresidioError('Es wurde noch nichts anonymisiert.')
    return presidio.deanonymize({
      text: result.text,
      anonymizer_results: result.items.map((i) => ({
        start: i.start,
        end: i.end,
        entity_type: i.entity_type,
      })),
      deanonymizers: { DEFAULT: { type: 'decrypt', key: operatorParams.key } },
    })
  }

  async function checkHealth() {
    const probe = async (
      target: ServiceHealth,
      call: () => Promise<string>,
    ) => {
      target.state = 'checking'
      const started = performance.now()
      try {
        const message = await call()
        target.state = 'online'
        target.message = typeof message === 'string' ? message : 'Dienst läuft'
      } catch (e) {
        target.state = 'offline'
        target.message = e instanceof Error ? e.message : 'Nicht erreichbar'
      } finally {
        target.latencyMs = Math.round(performance.now() - started)
        target.checkedAt = Date.now()
      }
    }

    await Promise.all([
      probe(analyzerHealth, presidio.analyzerHealth),
      probe(anonymizerHealth, presidio.anonymizerHealth),
    ])
  }

  async function bootstrap() {
    bootstrapError.value = null
    await checkHealth()

    try {
      const discovered = await discoverLanguages()
      if (!discovered.length) {
        throw new PresidioError(
          'Der Analyzer meldet keine nutzbaren Sprachen. Ist ein NLP-Modell geladen?',
        )
      }
      languages.value = discovered
      if (!discovered.some((l) => l.code === language.value)) {
        language.value = discovered[0].code
      }
    } catch (e) {
      bootstrapError.value = e instanceof Error ? e.message : String(e)
    }

    const [recognizerList, operatorList] = await Promise.allSettled([
      presidio.recognizers(language.value),
      presidio.anonymizerOperators(),
    ])
    if (recognizerList.status === 'fulfilled') recognizers.value = recognizerList.value
    if (operatorList.status === 'fulfilled') availableOperators.value = operatorList.value

    bootstrapped.value = true
    if (autoRun.value && !bootstrapError.value) await run()
  }

  function addDenyRule() {
    denyRules.value.push({ id: newId(), entity: 'CUSTOM_TERM', terms: '' })
  }
  function removeDenyRule(id: string) {
    denyRules.value = denyRules.value.filter((r) => r.id !== id)
  }
  function addRegexRule() {
    regexRules.value.push({ id: newId(), entity: 'CUSTOM_PATTERN', pattern: '', score: 0.8 })
  }
  function removeRegexRule(id: string) {
    regexRules.value = regexRules.value.filter((r) => r.id !== id)
  }

  function loadSample(id: string) {
    const sample = SAMPLES.find((s) => s.id === id)
    if (!sample) return
    text.value = sample.text
    if (languages.value.some((l) => l.code === sample.language)) {
      language.value = sample.language
    }
  }

  function reset() {
    selectedEntities.value = []
    scoreThreshold.value = 0.35
    allowList.value = []
    denyRules.value = []
    regexRules.value = []
    enabledPresets.value = [...DEFAULT_ENABLED_PRESETS]
    outputMode.value = 'highlight'
    operatorParams.new_value = ''
    operatorParams.masking_char = '*'
    operatorParams.chars_to_mask = 12
    operatorParams.from_end = true
    operatorParams.hash_type = 'sha256'
  }

  // ── Persistence ──────────────────────────────────────────────────────────
  function persist() {
    const snapshot = {
      language: language.value,
      selectedEntities: selectedEntities.value,
      scoreThreshold: scoreThreshold.value,
      returnDecisionProcess: returnDecisionProcess.value,
      allowList: allowList.value,
      denyRules: denyRules.value,
      regexRules: regexRules.value,
      enabledPresets: enabledPresets.value,
      outputMode: outputMode.value,
      operatorParams: { ...operatorParams },
      autoRun: autoRun.value,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    } catch {
      /* storage may be unavailable; config is not critical */
    }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (typeof saved.language === 'string') language.value = saved.language
      if (Array.isArray(saved.selectedEntities)) selectedEntities.value = saved.selectedEntities
      if (typeof saved.scoreThreshold === 'number') scoreThreshold.value = saved.scoreThreshold
      if (typeof saved.returnDecisionProcess === 'boolean') {
        returnDecisionProcess.value = saved.returnDecisionProcess
      }
      if (Array.isArray(saved.allowList)) allowList.value = saved.allowList
      if (Array.isArray(saved.denyRules)) denyRules.value = saved.denyRules
      if (Array.isArray(saved.regexRules)) regexRules.value = saved.regexRules
      if (Array.isArray(saved.enabledPresets)) enabledPresets.value = saved.enabledPresets
      if (typeof saved.outputMode === 'string') outputMode.value = saved.outputMode
      if (typeof saved.autoRun === 'boolean') autoRun.value = saved.autoRun
      if (saved.operatorParams) Object.assign(operatorParams, saved.operatorParams)
    } catch {
      /* ignore malformed saved state */
    }
  }

  restore()

  async function refreshRecognizers() {
    try {
      recognizers.value = await presidio.recognizers(language.value)
    } catch {
      recognizers.value = []
    }
  }

  // Each language loads its own recognizer set, and entity selections that the
  // new language cannot produce would silently filter everything out.
  watch(language, () => {
    selectedEntities.value = selectedEntities.value.filter((e) =>
      allEntities.value.includes(e),
    )
    void refreshRecognizers()
  })

  let debounce: ReturnType<typeof setTimeout> | undefined
  watch(
    [
      text,
      language,
      selectedEntities,
      scoreThreshold,
      returnDecisionProcess,
      allowList,
      denyRules,
      regexRules,
      enabledPresets,
      outputMode,
      operatorParams,
    ],
    () => {
      persist()
      if (!autoRun.value || !bootstrapped.value) return
      clearTimeout(debounce)
      debounce = setTimeout(run, 450)
    },
    { deep: true },
  )
  watch(autoRun, persist)

  return {
    // discovery
    analyzerHealth,
    anonymizerHealth,
    languages,
    recognizers,
    availableOperators,
    bootstrapped,
    bootstrapError,
    // config
    text,
    language,
    selectedEntities,
    scoreThreshold,
    returnDecisionProcess,
    allowList,
    denyRules,
    regexRules,
    enabledPresets,
    availablePresets,
    activePresets,
    autoRun,
    outputMode,
    operatorParams,
    // results
    analyzerResults,
    anonymized,
    analyzedText,
    isRunning,
    error,
    lastRunMs,
    hasRun,
    // derived
    entitiesForLanguage,
    customEntities,
    allEntities,
    findings,
    visibleSpans,
    supersededCount,
    inputTokens,
    outputTokens,
    entityCounts,
    isEncrypting,
    entityFilterActive,
    // actions
    buildAnalyzeRequest,
    buildOperator,
    run,
    deanonymize,
    checkHealth,
    bootstrap,
    addDenyRule,
    removeDenyRule,
    addRegexRule,
    removeRegexRule,
    loadSample,
    reset,
  }
})

// Without this the store is re-created on every dev hot update, which resets
// configuration mid-session.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePresidioStore, import.meta.hot))
}
