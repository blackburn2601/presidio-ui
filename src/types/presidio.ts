/** Shapes exchanged with the Presidio Analyzer and Anonymizer REST services. */

export interface AnalysisExplanation {
  recognizer: string
  pattern_name: string | null
  pattern: string | null
  original_score: number
  score: number
  textual_explanation: string | null
  score_context_improvement: number
  supportive_context_word: string
  validation_result: boolean | null
  regex_flags?: number
}

export interface RecognizerResult {
  entity_type: string
  start: number
  end: number
  score: number
  analysis_explanation?: AnalysisExplanation | null
  /** Added client-side: the substring of the input this result covers. */
  text?: string
}

export interface PatternDefinition {
  name: string
  regex: string
  score: number
}

export interface AdHocRecognizer {
  name: string
  supported_entity: string
  supported_language: string
  deny_list?: string[]
  patterns?: PatternDefinition[]
  context?: string[]
  deny_list_score?: number
  global_regex_flags?: number
}

export interface AnalyzeRequest {
  text: string
  language: string
  entities?: string[]
  score_threshold?: number
  return_decision_process?: boolean
  allow_list?: string[]
  ad_hoc_recognizers?: AdHocRecognizer[]
  correlation_id?: string
}

export type OperatorType =
  | 'replace'
  | 'redact'
  | 'mask'
  | 'hash'
  | 'encrypt'
  | 'keep'
  | 'custom'

export interface OperatorConfig {
  type: OperatorType
  new_value?: string
  masking_char?: string
  chars_to_mask?: number
  from_end?: boolean
  hash_type?: 'md5' | 'sha256' | 'sha512'
  key?: string
}

export interface AnonymizeRequest {
  text: string
  analyzer_results: Array<Pick<RecognizerResult, 'entity_type' | 'start' | 'end' | 'score'>>
  anonymizers?: Record<string, OperatorConfig>
}

export interface AnonymizedItem {
  start: number
  end: number
  entity_type: string
  text: string
  operator: string
}

export interface AnonymizeResponse {
  text: string
  items: AnonymizedItem[]
}

export interface DeanonymizeRequest {
  text: string
  anonymizer_results: Array<Pick<AnonymizedItem, 'start' | 'end' | 'entity_type'>>
  deanonymizers: Record<string, { type: 'decrypt'; key: string }>
}

export type ServiceState = 'unknown' | 'checking' | 'online' | 'offline'

export interface ServiceHealth {
  state: ServiceState
  message: string
  latencyMs: number | null
  checkedAt: number | null
}

/** A token of the rendered output: either plain text or a detected entity. */
export interface RenderToken {
  text: string
  entity: RecognizerResult | null
}
