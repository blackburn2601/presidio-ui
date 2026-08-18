import type {
  AnalyzeRequest,
  AnonymizeRequest,
  AnonymizeResponse,
  DeanonymizeRequest,
  RecognizerResult,
} from '@/types/presidio'

/**
 * Presidio sends no CORS headers, so every call is routed through a
 * same-origin proxy prefix (Vite dev server locally, nginx in the container).
 */
export const ANALYZER_BASE = '/api/analyzer'
export const ANONYMIZER_BASE = '/api/anonymizer'

export class PresidioError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly service?: 'analyzer' | 'anonymizer',
  ) {
    super(message)
    this.name = 'PresidioError'
  }
}

async function request<T>(
  base: string,
  path: string,
  service: 'analyzer' | 'anonymizer',
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const { timeoutMs = 60_000, ...rest } = init ?? {}
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(`${base}${path}`, { ...rest, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new PresidioError(
        `Der ${service} hat nicht innerhalb von ${Math.round(timeoutMs / 1000)} s geantwortet.`,
        undefined,
        service,
      )
    }
    throw new PresidioError(
      `Der ${service} ist nicht erreichbar. Läuft der Dienst, und stimmt das Proxy-Ziel?`,
      undefined,
      service,
    )
  } finally {
    clearTimeout(timer)
  }

  const raw = await response.text()
  let parsed: unknown = raw
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      /* Health endpoints answer in plain text. */
    }
  }

  if (!response.ok) {
    const detail =
      typeof parsed === 'object' && parsed !== null && 'error' in parsed
        ? String((parsed as { error: unknown }).error)
        : raw || response.statusText
    throw new PresidioError(detail, response.status, service)
  }

  // Presidio answers 200 with an `error` body for some validation failures.
  if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
    throw new PresidioError(String((parsed as { error: unknown }).error), 200, service)
  }

  return parsed as T
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const presidio = {
  analyzerHealth: () =>
    request<string>(ANALYZER_BASE, '/health', 'analyzer', { timeoutMs: 8000 }),

  anonymizerHealth: () =>
    request<string>(ANONYMIZER_BASE, '/health', 'anonymizer', { timeoutMs: 8000 }),

  supportedEntities: (language: string) =>
    request<string[]>(
      ANALYZER_BASE,
      `/supportedentities?language=${encodeURIComponent(language)}`,
      'analyzer',
      { timeoutMs: 10_000 },
    ),

  recognizers: (language: string) =>
    request<string[]>(
      ANALYZER_BASE,
      `/recognizers?language=${encodeURIComponent(language)}`,
      'analyzer',
      { timeoutMs: 10_000 },
    ),

  analyze: (body: AnalyzeRequest) =>
    request<RecognizerResult[]>(ANALYZER_BASE, '/analyze', 'analyzer', json(body)),

  anonymize: (body: AnonymizeRequest) =>
    request<AnonymizeResponse>(ANONYMIZER_BASE, '/anonymize', 'anonymizer', json(body)),

  deanonymize: (body: DeanonymizeRequest) =>
    request<AnonymizeResponse>(ANONYMIZER_BASE, '/deanonymize', 'anonymizer', json(body)),

  anonymizerOperators: () =>
    request<string[]>(ANONYMIZER_BASE, '/anonymizers', 'anonymizer', { timeoutMs: 10_000 }),
}

/** Candidate locales probed at startup to discover what this deployment loaded. */
export const CANDIDATE_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'Englisch' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Spanisch' },
  { code: 'fr', label: 'Französisch' },
  { code: 'it', label: 'Italienisch' },
  { code: 'nl', label: 'Niederländisch' },
  { code: 'pl', label: 'Polnisch' },
  { code: 'pt', label: 'Portugiesisch' },
  { code: 'zh', label: 'Chinesisch' },
]

/** Returns the subset of candidate languages this analyzer actually serves. */
export async function discoverLanguages() {
  const probes = await Promise.all(
    CANDIDATE_LANGUAGES.map(async (lang) => {
      try {
        const entities = await presidio.supportedEntities(lang.code)
        return Array.isArray(entities) && entities.length
          ? { ...lang, entities: entities.slice().sort() }
          : null
      } catch {
        return null
      }
    }),
  )
  return probes.filter((p): p is typeof p & object => p !== null)
}
