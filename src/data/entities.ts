/**
 * Entity presentation metadata. Hues drive the highlight colors; anything not
 * listed here gets a stable hue derived from its name, so custom deny-list and
 * regex entities are colored consistently too.
 */
const KNOWN_HUES: Record<string, number> = {
  PERSON: 262,
  EMAIL_ADDRESS: 200,
  PHONE_NUMBER: 172,
  CREDIT_CARD: 350,
  IBAN_CODE: 322,
  IP_ADDRESS: 28,
  LOCATION: 142,
  DATE_TIME: 48,
  ORGANIZATION: 218,
  URL: 188,
  NRP: 288,
  US_SSN: 12,
  US_PASSPORT: 4,
  US_DRIVER_LICENSE: 20,
  US_BANK_NUMBER: 336,
  US_ITIN: 36,
  MEDICAL_LICENSE: 158,
  CRYPTO: 66,
  AGE: 96,
  DE_TAX_ID: 308,
  DE_ID_CARD: 246,
  DE_LICENSE_PLATE: 82,
  DE_STREET_ADDRESS: 300,
  DE_PLZ: 108,
  STREET_ADDRESS: 300,
  US_ZIP_CODE: 108,
  AU_ABN: 128,
  AU_ACN: 116,
  AU_TFN: 104,
  AU_MEDICARE: 168,
  UK_NHS: 178,
  SG_NRIC_FIN: 232,
  IN_PAN: 344,
  IN_AADHAAR: 8,
}

const DESCRIPTIONS: Record<string, string> = {
  PERSON: 'Vollständiger Personenname, inklusive Vor-, Zwischen- und Nachname',
  EMAIL_ADDRESS: 'E-Mail-Adresse eines Postfachs',
  PHONE_NUMBER: 'Telefonnummer',
  CREDIT_CARD: 'Zahlungskartennummer (Visa, Mastercard, Amex, …)',
  IBAN_CODE: 'Internationale Bankkontonummer (IBAN)',
  IP_ADDRESS: 'IPv4- oder IPv6-Adresse',
  LOCATION: 'Geografischer Ort: Land, Stadt, Straße oder Wahrzeichen',
  DATE_TIME: 'Absolutes oder relatives Datum, Uhrzeit oder Zeitraum',
  ORGANIZATION: 'Name eines Unternehmens, einer Behörde oder Einrichtung',
  URL: 'Webadresse',
  NRP: 'Nationalität, religiöse oder politische Gruppe',
  US_SSN: 'US-Sozialversicherungsnummer',
  US_PASSPORT: 'US-Reisepassnummer',
  US_DRIVER_LICENSE: 'US-Führerscheinnummer',
  US_BANK_NUMBER: 'US-Bankkontonummer',
  US_ITIN: 'US-Steueridentifikationsnummer für Einzelpersonen',
  MEDICAL_LICENSE: 'Approbations- oder Berufszulassungsnummer im Gesundheitswesen',
  CRYPTO: 'Wallet-Adresse einer Kryptowährung',
  AGE: 'Alter einer Person',
  DE_TAX_ID: 'Deutsche Steuer-Identifikationsnummer',
  DE_ID_CARD: 'Nummer eines deutschen Personalausweises',
  DE_LICENSE_PLATE: 'Deutsches Kfz-Kennzeichen',
  DE_STREET_ADDRESS: 'Deutscher Straßenname mit Hausnummer',
  DE_PLZ: 'Deutsche fünfstellige Postleitzahl',
  STREET_ADDRESS: 'Straßenadresse mit Hausnummer',
  US_ZIP_CODE: 'US-Postleitzahl',
}

/** Stable hue for entity types not in the known list. */
function hashHue(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360
  }
  return hash
}

export function entityHue(entityType: string): number {
  return KNOWN_HUES[entityType] ?? hashHue(entityType)
}

export function entityDescription(entityType: string): string {
  return DESCRIPTIONS[entityType] ?? 'Eigene Entität aus dieser Sitzung'
}

/** Inline CSS custom property consumed by the .entity-* classes in style.css. */
export function entityStyle(entityType: string): Record<string, string> {
  return { '--ent-h': String(entityHue(entityType)) }
}

export function prettyEntity(entityType: string): string {
  return entityType.replace(/_/g, ' ')
}
