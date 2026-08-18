/** Gliederung der Dokumentation — steuert Inhaltsverzeichnis und Scroll-Spy. */
export interface DocSection {
  id: string
  title: string
  /** Kurzhinweis im Inhaltsverzeichnis. */
  lead: string
}

export const DOC_SECTIONS: DocSection[] = [
  { id: 'einstieg', title: 'Was ist Presidio Studio?', lead: 'Überblick in zwei Minuten' },
  { id: 'grundbegriffe', title: 'Grundbegriffe', lead: 'Entität, Recognizer, Score' },
  { id: 'ablauf', title: 'Wie eine Analyse abläuft', lead: 'Der Weg des Textes' },
  { id: 'oberflaeche', title: 'Die Oberfläche', lead: 'Jeder Bereich erklärt' },
  { id: 'verfahren', title: 'Anonymisierungsverfahren', lead: 'Die sieben Methoden' },
  { id: 'entitaeten', title: 'Entitätstypen', lead: 'Was erkannt werden kann' },
  { id: 'score', title: 'Score & Schwellenwert', lead: 'Konfidenz richtig deuten' },
  { id: 'eigene-regeln', title: 'Eigene Erkennungsregeln', lead: 'Ausnahmen, Sperrlisten, Muster' },
  { id: 'ueberlappungen', title: 'Überlappende Treffer', lead: 'Warum 19 Treffer 13 sind' },
  { id: 'api', title: 'API & Architektur', lead: 'Endpunkte, Proxy, Beispiele' },
  { id: 'server', title: 'Serverkonfiguration', lead: 'Die drei YAML-Dateien' },
  { id: 'datenschutz', title: 'Datenschutz', lead: 'Wo Ihre Daten bleiben' },
  { id: 'fehler', title: 'Fehlerbehebung', lead: 'Häufige Probleme' },
  { id: 'glossar', title: 'Glossar', lead: 'Begriffe zum Nachschlagen' },
]

export interface OperatorDoc {
  name: string
  entity: string
  before: string
  after: string
  reversible: 'ja' | 'nein'
  use: string
}

export const OPERATOR_DOCS: OperatorDoc[] = [
  {
    name: 'Hervorheben',
    entity: 'keine Änderung',
    before: 'Anna Schneider, Hauptstraße 14',
    after: 'Anna Schneider, Hauptstraße 14',
    reversible: 'ja',
    use: 'Prüfen, was überhaupt erkannt wird — der Text bleibt unverändert, Treffer werden nur eingefärbt.',
  },
  {
    name: 'Ersetzen',
    entity: 'replace',
    before: 'Anna Schneider',
    after: '<PERSON>',
    reversible: 'nein',
    use: 'Lesbare Platzhalter für Weitergabe an Dritte. Der Typ bleibt erkennbar, der Wert nicht.',
  },
  {
    name: 'Entfernen',
    entity: 'redact',
    before: 'Anna Schneider wohnt hier',
    after: ' wohnt hier',
    reversible: 'nein',
    use: 'Maximale Sparsamkeit — der Wert verschwindet ersatzlos. Achtung: der Satz wird oft unlesbar.',
  },
  {
    name: 'Maskieren',
    entity: 'mask',
    before: '4095-2609-9393-4932',
    after: '4095-26************',
    reversible: 'nein',
    use: 'Teilweise Sichtbarkeit, etwa die letzten vier Ziffern einer Karte für den Support.',
  },
  {
    name: 'Hashen',
    entity: 'hash',
    before: 'anna@example.de',
    after: '9f86d081884c7d65…',
    reversible: 'nein',
    use: 'Gleiche Werte ergeben gleiche Hashes — Auswertungen bleiben möglich, ohne den Klartext zu kennen.',
  },
  {
    name: 'Verschlüsseln',
    entity: 'encrypt',
    before: 'Anna Schneider',
    after: 'nprnHCFB1lZXJ90nVgC8…',
    reversible: 'ja',
    use: 'Der einzige umkehrbare Modus. Mit demselben AES-Schlüssel lässt sich der Originaltext wiederherstellen.',
  },
  {
    name: 'Beibehalten',
    entity: 'keep',
    before: 'Anna Schneider',
    after: 'Anna Schneider',
    reversible: 'ja',
    use: 'Erkennen, aber nicht verändern — nützlich, um einzelne Typen bewusst auszunehmen.',
  },
]

export interface GlossaryEntry {
  term: string
  text: string
}

export const GLOSSARY: GlossaryEntry[] = [
  { term: 'Analyzer', text: 'Der Presidio-Dienst, der Text liest und Fundstellen meldet. Er verändert nichts.' },
  { term: 'Anonymizer', text: 'Der zweite Dienst. Er nimmt Text plus Fundstellen und wendet ein Verfahren darauf an.' },
  { term: 'Ad-hoc-Recognizer', text: 'Eine Erkennungsregel, die nur mit einer einzelnen Anfrage mitgeschickt wird, statt dauerhaft auf dem Server zu liegen.' },
  { term: 'Entität', text: 'Eine Art personenbezogener Daten, etwa PERSON, IBAN_CODE oder DE_PLZ.' },
  { term: 'Fundstelle', text: 'Eine konkrete Textstelle mit Start- und Endposition, der eine Entität zugeordnet wurde.' },
  { term: 'Kontext-Boost', text: 'Anhebung des Scores, wenn nahe der Fundstelle ein passendes Signalwort steht — etwa „IBAN“ vor einer Kontonummer.' },
  { term: 'NER', text: 'Named Entity Recognition. Das Sprachmodell erkennt Namen, Orte und Organisationen aus dem Sprachverständnis heraus, nicht per Muster.' },
  { term: 'PII', text: 'Personally Identifiable Information — personenbezogene Daten im Sinne der DSGVO.' },
  { term: 'Recognizer', text: 'Ein einzelnes Erkennungsmodul, entweder musterbasiert (Regex) oder modellbasiert (NER).' },
  { term: 'Score', text: 'Konfidenz zwischen 0 und 1. Wie sicher ist sich der Recognizer bei dieser Fundstelle?' },
  { term: 'spaCy', text: 'Die NLP-Bibliothek, deren Sprachmodelle Presidio für die Namenserkennung nutzt.' },
]
