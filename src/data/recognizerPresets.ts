import type { AdHocRecognizer, PatternDefinition } from '@/types/presidio'

/**
 * Presidio's NLP models recognise cities as LOCATION but ship no recognizer for
 * street addresses or postal codes in any language. These presets close that gap
 * as ad-hoc recognizers, so they work against an unmodified Presidio deployment.
 *
 * Presidio compiles patterns with Python `re` and defaults to
 * DOTALL|MULTILINE|IGNORECASE (26). Address patterns depend on capitalisation,
 * so they pass 24 (DOTALL|MULTILINE) to drop IGNORECASE.
 */
export interface RecognizerPreset {
  id: string
  label: string
  entity: string
  languages: string[]
  description: string
  /** Enabled unless the user turns it off; addresses are the common blind spot. */
  defaultOn: boolean
  score: number
  regexFlags: number
  patterns: PatternDefinition[]
  context?: string[]
}

const DE_STREET =
  '\\b(?:[A-ZÄÖÜ][\\wäöüß]*[-\\s]|[a-zäöü]{2,5}-)*[A-ZÄÖÜ]?[\\wäöüß]*?' +
  '(?:[Ss]tra(?:ß|ss)e|[Ss]tr\\.|[Ww]eg|[Gg]asse|[Aa]llee|[Pp]latz|[Rr]ing|[Dd]amm|' +
  '[Uu]fer|[Cc]haussee|[Ss]teig|[Mm]arkt|[Pp]romenade)' +
  '\\s+\\d{1,4}(?:\\s*[-/]\\s*\\d{1,4})?[a-zA-Z]?\\b'

// A bare five-digit number is far too common; require a following city-like word.
const DE_PLZ = '\\b\\d{5}(?=\\s+[A-ZÄÖÜ][a-zäöüß]{2,})'

const EN_STREET =
  "\\b\\d{1,5}\\s+(?:[A-Z][\\w.'-]*\\s){0,3}" +
  '(?:Street|St\\.|Avenue|Ave\\.?|Road|Rd\\.?|Boulevard|Blvd\\.?|Lane|Ln\\.?|Drive|Dr\\.?|' +
  'Court|Ct\\.?|Way|Place|Pl\\.?|Terrace|Parkway|Pkwy\\.?|Circle|Highway|Hwy\\.?)\\b' +
  '(?:\\s+(?:Apt|Suite|Ste|Unit|#)\\.?\\s*[\\w-]+)?'

// Anchored to a preceding state code so invoice and order numbers are not swept up.
const US_ZIP = '(?<=\\b[A-Z]{2}\\s)\\d{5}(?:-\\d{4})?\\b'

export const RECOGNIZER_PRESETS: RecognizerPreset[] = [
  {
    id: 'de-street',
    label: 'Straße & Hausnummer',
    entity: 'DE_STREET_ADDRESS',
    languages: ['de'],
    description:
      'Deutsche Straßennamen mit Hausnummer — zusammengesetzt, mit Bindestrich und zweiteilig (Hauptstraße 14, Von-der-Tann-Str. 5a, Am Markt 3).',
    defaultOn: true,
    score: 0.75,
    regexFlags: 24,
    patterns: [{ name: 'de_street_address', regex: DE_STREET, score: 0.75 }],
    context: ['wohnhaft', 'Anschrift', 'Adresse', 'Lieferung', 'Wohnsitz', 'ansässig'],
  },
  {
    id: 'de-plz',
    label: 'Postleitzahl',
    entity: 'DE_PLZ',
    languages: ['de'],
    description:
      'Fünfstellige Postleitzahlen mit direkt folgendem Ortsnamen — Rechnungs- und Artikelnummern bleiben unberührt.',
    defaultOn: true,
    score: 0.6,
    regexFlags: 24,
    patterns: [{ name: 'de_plz', regex: DE_PLZ, score: 0.6 }],
    context: ['PLZ', 'Postleitzahl', 'wohnhaft', 'Anschrift', 'Adresse'],
  },
  {
    id: 'en-street',
    label: 'Straßenadresse (EN)',
    entity: 'STREET_ADDRESS',
    languages: ['en'],
    description:
      'Hausnummer mit Straßenname und -typ, optional mit Wohnungsangabe (1600 Pennsylvania Avenue, 742 Evergreen Terrace Apt 3B).',
    defaultOn: true,
    score: 0.75,
    regexFlags: 24,
    patterns: [{ name: 'en_street_address', regex: EN_STREET, score: 0.75 }],
    context: ['address', 'street', 'live', 'ship', 'deliver', 'residence'],
  },
  {
    id: 'us-zip',
    label: 'US-ZIP-Code',
    entity: 'US_ZIP_CODE',
    languages: ['en'],
    description:
      'Fünf- oder neunstellige ZIP-Codes nach einem zweibuchstabigen Bundesstaats-Kürzel (… Springfield IL 62704).',
    defaultOn: true,
    score: 0.6,
    regexFlags: 24,
    patterns: [{ name: 'us_zip_code', regex: US_ZIP, score: 0.6 }],
    context: ['zip', 'postal', 'address', 'mail'],
  },
]

export function presetsForLanguage(language: string): RecognizerPreset[] {
  return RECOGNIZER_PRESETS.filter((preset) => preset.languages.includes(language))
}

export function presetToRecognizer(
  preset: RecognizerPreset,
  language: string,
): AdHocRecognizer {
  return {
    name: `Preset_${preset.entity}`,
    supported_entity: preset.entity,
    supported_language: language,
    global_regex_flags: preset.regexFlags,
    patterns: preset.patterns,
    ...(preset.context ? { context: preset.context } : {}),
  }
}

export const DEFAULT_ENABLED_PRESETS = RECOGNIZER_PRESETS.filter((p) => p.defaultOn).map(
  (p) => p.id,
)
