<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, ExternalLink, List, X } from '@lucide/vue'
import { DOC_SECTIONS, GLOSSARY, OPERATOR_DOCS } from '@/docs/sections'
import { entityDescription, entityStyle, prettyEntity } from '@/data/entities'
import { usePresidioStore } from '@/stores/presidio'
import { useHashRoute } from '@/composables/useHashRoute'

const store = usePresidioStore()
const { go } = useHashRoute()

const activeId = ref(DOC_SECTIONS[0].id)
const tocOpen = ref(false)
let observer: IntersectionObserver | undefined

/** Entitäten kommen live vom Analyzer, damit die Referenz nie veraltet. */
const entityReference = computed(() =>
  store.languages.map((lang) => ({
    ...lang,
    rows: lang.entities.map((entity) => ({
      entity,
      description: entityDescription(entity),
    })),
  })),
)

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  tocOpen.value = false
}

onMounted(() => {
  // The callback only reports sections whose state *changed*, so the current
  // intersection of every section is tracked separately.
  const intersecting = new Map<string, boolean>()

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        intersecting.set(entry.target.id, entry.isIntersecting)
      }
      const current = DOC_SECTIONS.filter((s) => intersecting.get(s.id))
      if (current.length) activeId.value = current[0].id
    },
    { rootMargin: '-88px 0px -55% 0px', threshold: 0 },
  )

  for (const section of DOC_SECTIONS) {
    const el = document.getElementById(section.id)
    if (el) observer.observe(el)
  }
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="mx-auto flex w-full max-w-[72rem] flex-1 gap-8 px-4 py-6 sm:px-6">
    <!-- Inhaltsverzeichnis: fest auf großen Schirmen, ausklappbar auf kleinen -->
    <nav
      class="scroll-thin sticky top-[5rem] hidden h-[calc(100dvh-7rem)] w-64 shrink-0 overflow-y-auto lg:block"
      aria-label="Inhaltsverzeichnis"
    >
      <p class="field-label mb-3">Inhalt</p>
      <ul class="space-y-0.5">
        <li v-for="(section, index) in DOC_SECTIONS" :key="section.id">
          <button
            class="w-full rounded-lg px-2.5 py-1.5 text-left transition-colors"
            :style="{
              background: activeId === section.id ? 'var(--app-brand-soft)' : 'transparent',
              color: activeId === section.id ? 'var(--app-brand-ink)' : 'var(--app-ink-muted)',
            }"
            @click="jump(section.id)"
          >
            <span class="flex items-baseline gap-2">
              <span class="text-[0.65rem] tabular-nums opacity-60">{{ index + 1 }}</span>
              <span class="text-[0.8rem] font-medium leading-tight">{{ section.title }}</span>
            </span>
          </button>
        </li>
      </ul>
    </nav>

    <div class="min-w-0 flex-1">
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <button class="btn btn-ghost px-2.5 py-1.5 text-xs" @click="go('studio')">
          <ArrowLeft :size="14" /> Zurück zum Studio
        </button>
        <button class="btn btn-ghost px-2.5 py-1.5 text-xs lg:hidden" @click="tocOpen = !tocOpen">
          <component :is="tocOpen ? X : List" :size="14" /> Inhalt
        </button>
      </div>

      <ul v-if="tocOpen" class="panel mb-6 space-y-0.5 p-3 lg:hidden">
        <li v-for="section in DOC_SECTIONS" :key="section.id">
          <button
            class="w-full rounded-lg px-2 py-1.5 text-left text-[0.8rem]"
            :style="{ color: 'var(--app-ink)' }"
            @click="jump(section.id)"
          >
            {{ section.title }}
          </button>
        </li>
      </ul>

      <article class="doc space-y-12 pb-24">
        <!-- ══════════════ 1 ══════════════ -->
        <section id="einstieg">
          <h1>Presidio Studio — Handbuch</h1>
          <p class="doc-lead">
            Diese Oberfläche findet personenbezogene Daten in Texten und macht sie unkenntlich.
            Dieses Handbuch erklärt beides: was dabei im Hintergrund passiert und wie Sie jede
            Funktion einsetzen. Vorkenntnisse sind nicht nötig — technische Details stehen in
            eigenen, klar gekennzeichneten Absätzen.
          </p>

          <h2>Wozu das Ganze?</h2>
          <p>
            Sobald Texte Namen, Adressen, Kontonummern oder Geburtsdaten enthalten, unterliegen sie
            der DSGVO. Wer solche Texte auswerten, weitergeben oder in ein KI-System geben möchte,
            muss die personenbezogenen Anteile vorher entfernen oder ersetzen. Genau das leistet
            <strong>Microsoft Presidio</strong> — ein quelloffenes Werkzeug, das aus zwei Diensten
            besteht. Presidio Studio ist die Oberfläche dazu.
          </p>

          <div class="doc-note">
            <strong>Wichtig:</strong> Presidio ist ein Hilfsmittel, keine Garantie. Es findet sehr
            viel, aber nie alles. Für rechtlich verbindliche Anonymisierung braucht es immer eine
            fachliche Kontrolle des Ergebnisses.
          </div>

          <h2>Die zwei Dienste</h2>
          <div class="doc-cards">
            <div class="doc-card">
              <h3>Analyzer</h3>
              <p>
                Liest den Text und meldet, <em>wo</em> etwas Personenbezogenes steht. Er verändert
                nichts — er liefert nur eine Liste von Fundstellen mit Position, Typ und Konfidenz.
              </p>
            </div>
            <div class="doc-card">
              <h3>Anonymizer</h3>
              <p>
                Bekommt den Text und diese Liste und wendet ein Verfahren an: ersetzen, entfernen,
                maskieren, hashen oder verschlüsseln. Er entscheidet nicht selbst, was PII ist.
              </p>
            </div>
          </div>
        </section>

        <!-- ══════════════ 2 ══════════════ -->
        <section id="grundbegriffe">
          <h2>Grundbegriffe</h2>
          <p>
            Vier Begriffe tauchen überall auf. Wer sie kennt, versteht den Rest der Oberfläche
            praktisch von selbst.
          </p>

          <h3>Entität</h3>
          <p>
            Eine <strong>Art</strong> personenbezogener Daten. <code>PERSON</code> ist eine Entität,
            <code>IBAN_CODE</code> ist eine, <code>DE_PLZ</code> auch. In der Oberfläche bekommt jede
            Entität eine eigene Farbe, damit man auf einen Blick sieht, was gefunden wurde.
          </p>

          <h3>Recognizer</h3>
          <p>
            Ein einzelnes Erkennungsmodul. Davon gibt es zwei Sorten, und der Unterschied erklärt
            fast alle Stärken und Schwächen des Systems:
          </p>
          <table class="doc-table">
            <thead>
              <tr><th>Sorte</th><th>Arbeitsweise</th><th>Gut bei</th><th>Schwach bei</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Musterbasiert</strong></td>
                <td>Sucht feste Zeichenmuster, oft mit Prüfziffer</td>
                <td>IBAN, Kreditkarte, E-Mail, Kennzeichen — alles mit klarer Form</td>
                <td>Allem, was keine feste Form hat</td>
              </tr>
              <tr>
                <td><strong>Modellbasiert (NER)</strong></td>
                <td>Ein Sprachmodell versteht den Satz und erkennt Namen daraus</td>
                <td>Personen, Orte, Organisationen — auch unbekannte</td>
                <td>Ungewöhnlicher Schreibweise, Tippfehlern, sehr kurzen Texten</td>
              </tr>
            </tbody>
          </table>
          <p>
            In der Sidebar sehen Sie unter <em>Aktive Recognizer</em>, welche Module Ihr Server
            geladen hat. <code>Spacy</code> ist der modellbasierte, alle anderen sind musterbasiert.
          </p>

          <h3>Score</h3>
          <p>
            Jede Fundstelle bekommt eine Konfidenz zwischen 0 und 1 — wie sicher sich der Recognizer
            ist. Eine IBAN mit gültiger Prüfziffer erreicht 1.00, ein per Sprachmodell erkannter Name
            typischerweise 0.85. Mehr dazu im Abschnitt
            <button class="doc-link" @click="jump('score')">Score &amp; Schwellenwert</button>.
          </p>

          <h3>Fundstelle</h3>
          <p>
            Die konkrete Textstelle: Entität, Startposition, Endposition, Score. Presidio arbeitet
            zeichengenau — <code>101–115</code> bedeutet, dass ab dem 101. Zeichen 14 Zeichen zur
            Fundstelle gehören. Deshalb kann der Anonymizer punktgenau ersetzen.
          </p>
        </section>

        <!-- ══════════════ 3 ══════════════ -->
        <section id="ablauf">
          <h2>Wie eine Analyse abläuft</h2>
          <p>
            Jedes Mal, wenn Sie etwas ändern, durchläuft Ihr Text dieselben fünf Schritte. Der ganze
            Vorgang dauert typischerweise unter einer halben Sekunde.
          </p>

          <ol class="doc-steps">
            <li>
              <h3>Text erfassen</h3>
              <p>
                Die Oberfläche wartet etwa eine halbe Sekunde nach Ihrer letzten Eingabe, damit nicht
                bei jedem Tastendruck eine Anfrage losgeht.
              </p>
            </li>
            <li>
              <h3>Anfrage an den Analyzer</h3>
              <p>
                Text, Sprache, Schwellenwert und alle eigenen Regeln gehen als JSON an
                <code>/analyze</code>. Was genau gesendet wird, zeigt Ihnen der API-Inspektor.
              </p>
            </li>
            <li>
              <h3>Erkennung</h3>
              <p>
                Alle Recognizer der gewählten Sprache laufen über den Text. Anschließend hebt der
                Kontext-Boost Scores an, wenn passende Signalwörter in der Nähe stehen.
                Alles unterhalb des Schwellenwerts wird verworfen.
              </p>
            </li>
            <li>
              <h3>Überlappungen auflösen</h3>
              <p>
                Presidio darf sich überschneidende Fundstellen melden. Die Oberfläche wählt je
                Textbereich die stärkste aus, damit die Darstellung eindeutig bleibt.
              </p>
            </li>
            <li>
              <h3>Anonymisierung</h3>
              <p>
                Text und bereinigte Fundstellen gehen an <code>/anonymize</code>. Zurück kommt der
                fertige Text — und eine Liste, welche Stelle wie behandelt wurde.
              </p>
            </li>
          </ol>

          <div class="doc-flow" role="img" aria-label="Ablauf von Eingabe bis Ausgabe">
            <span class="doc-flow-box">Ihr Text</span>
            <span class="doc-flow-arrow">→</span>
            <span class="doc-flow-box doc-flow-accent">Analyzer</span>
            <span class="doc-flow-arrow">→</span>
            <span class="doc-flow-box">Fundstellen</span>
            <span class="doc-flow-arrow">→</span>
            <span class="doc-flow-box doc-flow-accent">Anonymizer</span>
            <span class="doc-flow-arrow">→</span>
            <span class="doc-flow-box">Ergebnis</span>
          </div>
        </section>

        <!-- ══════════════ 4 ══════════════ -->
        <section id="oberflaeche">
          <h2>Die Oberfläche</h2>
          <p>
            Der Bildschirm ist fest auf die Fenstergröße eingestellt: die Seite selbst scrollt nicht,
            stattdessen hat jeder Bereich seinen eigenen Scrollbalken.
          </p>

          <h3>Kopfzeile</h3>
          <ul class="doc-list">
            <li><strong>Analyzer / Anonymizer</strong> — zwei Punkte zeigen den Zustand der Dienste. Grün heißt erreichbar, rot nicht. Der Kreispfeil prüft erneut nach.</li>
            <li><strong>Dokumentation</strong> — diese Seite.</li>
            <li><strong>Sonne / Mond</strong> — helles oder dunkles Design. Die Wahl wird gespeichert.</li>
          </ul>

          <h3>Eingabetext</h3>
          <ul class="doc-list">
            <li><strong>Beispiele</strong> — vorbereitete Texte. Ein deutsches Beispiel schaltet die Sprache automatisch auf Deutsch um.</li>
            <li><strong>Vorschau</strong> — zeigt die Treffer farbig <em>im Eingabefeld</em>. Zum Weiterschreiben zurück auf <em>Bearbeiten</em>.</li>
            <li><strong>Laden</strong> — eine Textdatei vom Rechner einlesen (<code>.txt</code>, <code>.csv</code>, <code>.json</code>, <code>.md</code>).</li>
            <li><strong>Leeren</strong> — Eingabefeld zurücksetzen.</li>
          </ul>

          <h3>Ausgabe</h3>
          <p>
            Die Überschrift nennt immer das aktive Verfahren, etwa <em>Maskierte Ausgabe</em>. Beim
            Verfahren <em>Verschlüsseln</em> erscheint zusätzlich <strong>Entschlüsseln</strong> und
            stellt den Originaltext wieder her — der Beweis, dass die Verschlüsselung umkehrbar ist.
            <strong>Kopieren</strong> und <strong>Speichern</strong> geben das Ergebnis heraus.
          </p>

          <h3>Trefferleiste</h3>
          <p>
            Über den Panels steht die Gesamtzahl und je Entität ein farbiges Etikett mit Anzahl.
            Fahren Sie mit der Maus darüber, wird derselbe Typ überall gleichzeitig hervorgehoben —
            im Text, in der Ausgabe und in der Tabelle.
          </p>

          <h3>Trefferliste</h3>
          <p>
            Jede Zeile ist eine Fundstelle mit Entität, erkanntem Wert, Zeichenposition und Score.
            Der Pfeil links klappt die Begründung auf: welcher Recognizer angeschlagen hat, welches
            Muster, wie der Score zustande kam und ob eine Prüfsumme stimmte.
            <strong>JSON</strong> kopiert die Rohantwort, <strong>CSV</strong> lädt die Treffer als
            Tabelle herunter.
          </p>

          <h3>API-Inspektor</h3>
          <p>
            Zeigt genau die Daten, die zwischen Oberfläche und Presidio fließen — die Analyse-Anfrage,
            die Antwort, die Anonymisierungs-Anfrage und einen fertigen cURL-Befehl. Damit dient die
            Oberfläche zugleich als lebende API-Dokumentation.
          </p>

          <h3>Sidebar</h3>
          <table class="doc-table">
            <thead><tr><th>Abschnitt</th><th>Wirkung</th></tr></thead>
            <tbody>
              <tr><td>Sprache &amp; Modell</td><td>Sprache wählen. Die Liste stammt vom Server. Darunter die aktiven Recognizer.</td></tr>
              <tr><td>Anonymisierung</td><td>Eines der sieben Verfahren samt Einstellungen.</td></tr>
              <tr><td>Erkennungsschwelle</td><td>Mindest-Score, ab dem ein Treffer zählt.</td></tr>
              <tr><td>Entitäten</td><td>Auf bestimmte Datenarten eingrenzen. Ohne Auswahl wird nach allen gesucht.</td></tr>
              <tr><td>Adress-Erkennung</td><td>Zusatzregeln für Straßen und Postleitzahlen.</td></tr>
              <tr><td>Ausnahmeliste</td><td>Begriffe, die nie als Treffer gelten.</td></tr>
              <tr><td>Sperrliste</td><td>Begriffe, die immer als Treffer gelten.</td></tr>
              <tr><td>Eigene Muster</td><td>Reguläre Ausdrücke für hauseigene Nummernkreise.</td></tr>
              <tr><td>Verhalten</td><td>Automatisch analysieren, Entscheidungen erklären.</td></tr>
            </tbody>
          </table>

          <div class="doc-note">
            Alle Einstellungen werden im Browser gespeichert und stehen beim nächsten Aufruf wieder
            zur Verfügung. <strong>Zurücksetzen</strong> oben in der Sidebar stellt die Standardwerte
            her. Ihre Texte werden nicht gespeichert.
          </div>
        </section>

        <!-- ══════════════ 5 ══════════════ -->
        <section id="verfahren">
          <h2>Die sieben Anonymisierungsverfahren</h2>
          <p>
            Welches Verfahren richtig ist, hängt davon ab, was mit dem Text danach geschehen soll.
            Die entscheidende Frage lautet: müssen Sie später wieder an den Originalwert kommen?
          </p>

          <table class="doc-table">
            <thead>
              <tr><th>Verfahren</th><th>Vorher</th><th>Nachher</th><th>Umkehrbar</th></tr>
            </thead>
            <tbody>
              <tr v-for="op in OPERATOR_DOCS" :key="op.name">
                <td><strong>{{ op.name }}</strong></td>
                <td><code>{{ op.before }}</code></td>
                <td><code>{{ op.after }}</code></td>
                <td>
                  <span :style="{ color: op.reversible === 'ja' ? 'oklch(0.58 0.15 150)' : 'var(--app-ink-faint)' }">
                    {{ op.reversible }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <h3>Wann welches?</h3>
          <dl class="doc-dl">
            <div v-for="op in OPERATOR_DOCS" :key="op.name">
              <dt>{{ op.name }}</dt>
              <dd>{{ op.use }}</dd>
            </div>
          </dl>

          <h3>Einstellungen im Detail</h3>
          <ul class="doc-list">
            <li><strong>Ersetzen — Ersatzwert:</strong> leer lassen für Presidios Standard <code>&lt;ENTITÄTSNAME&gt;</code>. Ein fester Text wie <code>[entfernt]</code> ersetzt dann alle Typen gleich.</li>
            <li><strong>Maskieren — Maskierzeichen und Anzahl:</strong> wie viele Zeichen überdeckt werden und womit. <em>Vom Ende maskieren</em> lässt den Anfang sichtbar.</li>
            <li><strong>Hashen — Verfahren:</strong> <code>sha256</code> ist die richtige Wahl. <code>md5</code> gilt als unsicher und ist nur aus Kompatibilitätsgründen vorhanden.</li>
            <li><strong>Verschlüsseln — AES-Schlüssel:</strong> muss exakt 16, 24 oder 32 Byte lang sein; die Oberfläche prüft das mit. <strong>Ohne diesen Schlüssel ist keine Wiederherstellung möglich.</strong></li>
          </ul>

          <div class="doc-warn">
            <strong>Zu Hashes:</strong> Ein Hash ist nicht automatisch anonym. Bei kleinen Wertebereichen —
            Postleitzahlen, Geburtsdaten — kann man alle Möglichkeiten durchprobieren und den Klartext
            zurückrechnen. Für solche Felder ist Ersetzen oder Entfernen die sicherere Wahl.
          </div>
        </section>

        <!-- ══════════════ 6 ══════════════ -->
        <section id="entitaeten">
          <h2>Entitätstypen</h2>
          <p>
            Welche Typen zur Verfügung stehen, hängt von der Sprache und den geladenen Recognizern ab.
            Die folgende Übersicht wird direkt von Ihrem Server abgefragt und ist damit immer aktuell.
          </p>

          <div v-for="lang in entityReference" :key="lang.code" class="mb-8">
            <h3>{{ lang.label }} <span class="doc-count">{{ lang.rows.length }} Typen</span></h3>
            <table class="doc-table">
              <thead><tr><th style="width: 16rem">Entität</th><th>Bedeutung</th></tr></thead>
              <tbody>
                <tr v-for="row in lang.rows" :key="row.entity">
                  <td>
                    <span class="entity-chip" :style="entityStyle(row.entity)">
                      <span class="entity-dot" />{{ prettyEntity(row.entity) }}
                    </span>
                  </td>
                  <td>{{ row.description }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="!entityReference.length" class="doc-note">
            Die Liste konnte nicht geladen werden — der Analyzer ist gerade nicht erreichbar.
          </p>

          <div class="doc-note">
            Die Namen bleiben bewusst englisch: exakt so liefert Presidio sie in der API, im
            CSV-Export und in der Serverkonfiguration. Eine Übersetzung würde die Oberfläche von dem
            entkoppeln, was Sie im API-Inspektor sehen.
          </div>
        </section>

        <!-- ══════════════ 7 ══════════════ -->
        <section id="score">
          <h2>Score &amp; Schwellenwert</h2>
          <p>
            Der Score sagt, wie sicher sich ein Recognizer ist. Er ist keine Wahrscheinlichkeit,
            sondern ein Erfahrungswert des jeweiligen Moduls.
          </p>

          <table class="doc-table">
            <thead><tr><th>Score</th><th>Bedeutung</th><th>Typisch für</th></tr></thead>
            <tbody>
              <tr><td><code>1.00</code></td><td>Form stimmt und Prüfsumme bestätigt</td><td>IBAN, Kreditkarte, E-Mail</td></tr>
              <tr><td><code>0.85</code></td><td>Sprachmodell ist sich sicher</td><td>Personen, Orte, Organisationen</td></tr>
              <tr><td><code>0.50 – 0.60</code></td><td>Muster passt, aber ohne Absicherung</td><td>URLs, Telefonnummern, Postleitzahlen</td></tr>
              <tr><td><code>unter 0.35</code></td><td>Schwacher Verdacht</td><td>Wird standardmäßig verworfen</td></tr>
            </tbody>
          </table>

          <h3>Der Kontext-Boost</h3>
          <p>
            Presidio schaut sich die Umgebung einer Fundstelle an. Steht dort ein passendes
            Signalwort, steigt der Score. Ein Beispiel aus Ihrer Trefferliste:
          </p>
          <pre class="doc-code">Fundstelle: DE89370400440532013000
Recognizer: IbanRecognizer
Score vorher → nachher: 0.50 → 1.00 (+0.50 Kontext)
Kontextwort: IBAN</pre>
          <p>
            Ohne das Wort „IBAN“ davor wäre dieselbe Zeichenfolge nur mit 0.50 gemeldet worden. Das
            erklärt, warum derselbe Wert je nach Satz unterschiedliche Scores bekommt.
          </p>

          <h3>Welchen Schwellenwert wählen?</h3>
          <table class="doc-table">
            <thead><tr><th>Wert</th><th>Wirkung</th><th>Geeignet wenn</th></tr></thead>
            <tbody>
              <tr><td><code>0.00 – 0.30</code></td><td>Sehr viele Treffer, viele Fehlalarme</td><td>Sie nichts übersehen dürfen und manuell nachkontrollieren</td></tr>
              <tr><td><code>0.35</code></td><td>Ausgewogen — die Voreinstellung</td><td>Normalfall</td></tr>
              <tr><td><code>0.60 – 0.85</code></td><td>Nur belastbare Treffer</td><td>Sie automatisiert weiterverarbeiten und Fehlalarme teuer sind</td></tr>
              <tr><td><code>über 0.85</code></td><td>Fast nur musterbasierte Treffer</td><td>Sie gezielt nur Kontonummern, Karten und Ähnliches suchen</td></tr>
            </tbody>
          </table>

          <div class="doc-warn">
            Ein hoher Schwellenwert lässt Namen durchrutschen: Personen erreichen über das
            Sprachmodell meist genau 0.85. Wer über diesen Wert geht, filtert Personennamen faktisch
            aus der Erkennung heraus.
          </div>
        </section>

        <!-- ══════════════ 8 ══════════════ -->
        <section id="eigene-regeln">
          <h2>Eigene Erkennungsregeln</h2>
          <p>
            Drei Werkzeuge passen die Erkennung an Ihre Texte an. Alle drei wirken nur für die
            aktuelle Anfrage — der Server bleibt unverändert. Genau deshalb können Sie hier gefahrlos
            ausprobieren.
          </p>

          <h3>Ausnahmeliste — was nie ein Treffer sein soll</h3>
          <p>
            Manche Begriffe sehen für Presidio wie Namen aus, sind aber keine. Steht Ihr eigener
            Firmenname in jedem Dokument, wollen Sie ihn nicht jedes Mal geschwärzt sehen.
          </p>
          <pre class="doc-code">Ausnahmeliste: Berlin

vorher:   … in <span class="doc-hl">Berlin</span> übernommen.   → LOCATION
nachher:  … in Berlin übernommen.                               → kein Treffer</pre>
          <p>Die Schreibweise muss exakt übereinstimmen.</p>

          <h3>Sperrliste — was immer ein Treffer sein soll</h3>
          <p>
            Das Gegenstück: feste Begriffe, die Presidio von sich aus nicht kennt. Sie vergeben einen
            Entitätsnamen Ihrer Wahl und listen die Begriffe darunter — einer pro Zeile.
          </p>
          <pre class="doc-code">Entität:  VERTRAGSPARTNER
Begriffe: Musterfirma GmbH
          Lastschrift

→ beide werden ab sofort als VERTRAGSPARTNER erkannt und mitanonymisiert</pre>

          <h3>Eigene Muster — Regeln für Nummernkreise</h3>
          <p>
            Für alles mit fester Form: Kundennummern, Aktenzeichen, Auftragsnummern. Sie hinterlegen
            einen regulären Ausdruck und einen Score.
          </p>
          <pre class="doc-code">Entität: KUNDENNUMMER
Muster:  \b\d{4}-\d{4}\b
Score:   0.80

→ findet „4711-2024“ in „Die Kundennummer lautet 4711-2024.“</pre>
          <p>
            Ein kurzer Einstieg in reguläre Ausdrücke: <code>\d</code> steht für eine Ziffer,
            <code>{4}</code> für „genau vier davon“, <code>\b</code> für eine Wortgrenze, damit
            nicht mitten in einer längeren Zahl getroffen wird. Die Oberfläche warnt, wenn ein Muster
            fehlerhaft ist.
          </p>

          <h3>Adress-Erkennung</h3>
          <p>
            Presidio erkennt Ortsnamen, bringt aber für keine Sprache einen Recognizer für
            <em>Straßen</em> mit. Die vier Regeln in diesem Abschnitt schließen die Lücke:
          </p>
          <table class="doc-table">
            <thead><tr><th>Regel</th><th>Entität</th><th>Beispiele</th></tr></thead>
            <tbody>
              <tr><td>Straße &amp; Hausnummer</td><td><code>DE_STREET_ADDRESS</code></td><td>Hauptstraße 14 · Von-der-Tann-Str. 5a · Am Markt 3</td></tr>
              <tr><td>Postleitzahl</td><td><code>DE_PLZ</code></td><td>80331 München — aber <em>nicht</em> „Betrag 12345 EUR“</td></tr>
              <tr><td>Straßenadresse (EN)</td><td><code>STREET_ADDRESS</code></td><td>1600 Pennsylvania Avenue</td></tr>
              <tr><td>US-ZIP-Code</td><td><code>US_ZIP_CODE</code></td><td>Springfield IL 62704</td></tr>
            </tbody>
          </table>
          <p>
            Die Postleitzahl-Regel verlangt bewusst einen direkt folgenden Ortsnamen. Ohne diese
            Bedingung wäre jede fünfstellige Zahl ein Treffer — Rechnungs- und Artikelnummern
            eingeschlossen.
          </p>
          <div class="doc-note">
            Wenn dieselben Regeln <em>serverseitig</em> eingerichtet sind, schalten Sie die
            Schalter hier ab. Sonst werden die Muster doppelt mitgeschickt. Doppelte Treffer werden
            zwar zusammengefasst, aber die Anfrage bleibt unnötig groß.
          </div>
        </section>

        <!-- ══════════════ 9 ══════════════ -->
        <section id="ueberlappungen">
          <h2>Überlappende Treffer</h2>
          <p>
            In der Trefferleiste steht mitunter „<em>+5 überlappend</em>“, und die Tabelle zählt mehr
            Zeilen als die Leiste Treffer meldet. Das ist kein Fehler.
          </p>
          <p>
            Mehrere Recognizer prüfen denselben Text unabhängig voneinander. Eine E-Mail-Adresse
            erfüllt gleichzeitig die Regeln für <code>EMAIL_ADDRESS</code> und für <code>URL</code>.
            Eine IBAN kann zusätzlich als <code>ORGANIZATION</code> gemeldet werden, weil das
            Sprachmodell das Länderkürzel für einen Namen hält.
          </p>
          <pre class="doc-code">Text:     kundenservice@musterfirma.de

Meldung 1: EMAIL_ADDRESS  Score 1.00  Zeichen 192–220
Meldung 2: URL            Score 0.50  Zeichen 206–220

Angezeigt wird EMAIL_ADDRESS — höherer Score.</pre>
          <p>
            Für die Darstellung braucht es je Textstelle eine eindeutige Zuordnung. Die Oberfläche
            wählt deshalb zuerst nach <strong>höherem Score</strong>, bei Gleichstand nach
            <strong>längerer Fundstelle</strong>. Die Trefferliste zeigt weiterhin <em>alle</em>
            Rohmeldungen — es geht nichts verloren, es wird nur aufgeräumt dargestellt.
          </p>
        </section>

        <!-- ══════════════ 10 ══════════════ -->
        <section id="api">
          <h2>API &amp; Architektur</h2>
          <p class="doc-lead">
            Dieser Abschnitt richtet sich an technische Leser. Für die Bedienung der Oberfläche wird
            er nicht benötigt.
          </p>

          <h3>Aufbau</h3>
          <pre class="doc-code">Browser ──▶ Vite-Dev-Server / nginx ──▶ presidio-analyzer   :5002
                    (gleicher Origin)  └─▶ presidio-anonymizer :5001</pre>
          <p>
            Presidio sendet <strong>keine CORS-Header</strong>. Ein Browser kann die Dienste deshalb
            nicht direkt ansprechen. Alle Aufrufe laufen über einen Proxy auf demselben Origin —
            im Betrieb nginx, in der Entwicklung der Vite-Server. Er stellt die Dienste unter
            <code>/api/analyzer</code> und <code>/api/anonymizer</code> bereit.
          </p>

          <h3>Endpunkte</h3>
          <table class="doc-table">
            <thead><tr><th>Methode</th><th>Pfad</th><th>Zweck</th></tr></thead>
            <tbody>
              <tr><td>GET</td><td><code>/health</code></td><td>Lebenszeichen des Dienstes</td></tr>
              <tr><td>GET</td><td><code>/supportedentities?language=de</code></td><td>Erkennbare Entitäten je Sprache</td></tr>
              <tr><td>GET</td><td><code>/recognizers?language=de</code></td><td>Geladene Recognizer</td></tr>
              <tr><td>POST</td><td><code>/analyze</code></td><td>Text prüfen, Fundstellen liefern</td></tr>
              <tr><td>POST</td><td><code>/anonymize</code></td><td>Verfahren auf Fundstellen anwenden</td></tr>
              <tr><td>POST</td><td><code>/deanonymize</code></td><td>Verschlüsselte Werte zurückholen</td></tr>
              <tr><td>GET</td><td><code>/anonymizers</code></td><td>Verfügbare Verfahren</td></tr>
            </tbody>
          </table>

          <h3>Analyse-Anfrage</h3>
          <pre class="doc-code">POST /analyze
{
  "text": "Anna Schneider, wohnhaft in der Hauptstraße 14, 80331 München.",
  "language": "de",
  "score_threshold": 0.35,
  "return_decision_process": true,
  "allow_list": ["Berlin"],
  "ad_hoc_recognizers": [ … ]
}</pre>
          <p>Die Antwort ist eine Liste von Fundstellen:</p>
          <pre class="doc-code">[
  { "entity_type": "PERSON",            "start": 0,  "end": 14, "score": 0.85 },
  { "entity_type": "DE_STREET_ADDRESS", "start": 31, "end": 45, "score": 1.00 },
  { "entity_type": "DE_PLZ",            "start": 47, "end": 52, "score": 0.95 }
]</pre>

          <h3>Anonymisierungs-Anfrage</h3>
          <pre class="doc-code">POST /anonymize
{
  "text": "…",
  "analyzer_results": [ … Fundstellen von oben … ],
  "anonymizers": { "DEFAULT": { "type": "replace", "new_value": "[entfernt]" } }
}</pre>
          <p>
            Der Schlüssel <code>DEFAULT</code> gilt für alle Entitäten. Statt dessen lässt sich je
            Entität ein eigenes Verfahren angeben, etwa <code>"CREDIT_CARD"</code> für Maskierung bei
            gleichzeitigem Ersetzen aller anderen Typen.
          </p>

          <h3>Selbst ausprobieren</h3>
          <pre class="doc-code">curl -X POST http://192.168.178.89:5002/analyze \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hauptstraße 14, 80331 München","language":"de"}'</pre>
          <p>
            Den passenden Befehl für Ihre aktuellen Einstellungen erzeugt der API-Inspektor unter
            dem Reiter <em>cURL</em>.
          </p>
        </section>

        <!-- ══════════════ 11 ══════════════ -->
        <section id="server">
          <h2>Serverkonfiguration</h2>
          <p class="doc-lead">Ebenfalls für technische Leser — Betrieb und Erweiterung des Analyzers.</p>

          <h3>Drei Dateien, eine Sprachmenge</h3>
          <p>
            Der Analyzer liest beim Start drei Konfigurationsdateien. Alle drei müssen dieselben
            Sprachen nennen, sonst startet der Dienst nicht.
          </p>
          <table class="doc-table">
            <thead><tr><th>Datei</th><th>Legt fest</th></tr></thead>
            <tbody>
              <tr><td><code>nlp.yaml</code></td><td>Welche spaCy-Modelle geladen werden</td></tr>
              <tr><td><code>analyzer.yaml</code></td><td>Welche Sprachen die Engine anbietet</td></tr>
              <tr><td><code>recognizers.yaml</code></td><td>Welche Recognizer je Sprache laufen</td></tr>
            </tbody>
          </table>
          <pre class="doc-code">Misconfigured engine, supported languages have to be consistent
registry.supported_languages: ['de', 'en'],
analyzer_engine.supported_languages: ['de']</pre>
          <p>
            Diese Meldung im Log bedeutet: <code>recognizers.yaml</code> kennt Englisch,
            <code>analyzer.yaml</code> nicht. Der Worker bricht dann mit <code>code 3</code> ab.
          </p>

          <h3>Eigene Recognizer dauerhaft einrichten</h3>
          <p>
            In <code>recognizers.yaml</code> lassen sich Regeln fest hinterlegen — ohne Python-Code:
          </p>
          <pre class="doc-code">  - name: PostleitzahlRecognizer
    type: custom
    enabled: true
    supported_entity: DE_PLZ
    supported_languages:
      - language: de
        context: [plz, postleitzahl, anschrift, adresse]
    patterns:
      - name: de_plz_with_city
        regex: "(?-i:\b\d{5}(?=\s+[A-ZÄÖÜ][a-zäöüß]{2,}))"
        score: 0.6</pre>

          <div class="doc-warn">
            <strong>Zur Schreibweise <code>(?-i: … )</code>:</strong> Presidio wendet den Wert von
            <code>global_regex_flags</code> auf <em>alle</em> Muster an — standardmäßig 26, also
            inklusive „Groß-/Kleinschreibung ignorieren“. Ein Override je Recognizer gibt es nicht.
            Straßennamen hängen aber an der Großschreibung. Die Klammer <code>(?-i: … )</code>
            schaltet die Ignorierung nur für dieses eine Muster ab und lässt den globalen Wert
            unangetastet.
          </div>

          <h3>Reihenfolge beim Ändern</h3>
          <ol class="doc-list">
            <li>Konfiguration sichern und anpassen</li>
            <li>Image neu bauen, wenn die Dateien per <code>COPY</code> hineinkommen</li>
            <li>Container neu erstellen, nicht nur neu starten</li>
            <li><code>docker logs</code> prüfen — dort steht, welche Recognizer geladen wurden</li>
            <li>Mit einem bekannten Beispieltext gegenprüfen</li>
          </ol>
        </section>

        <!-- ══════════════ 12 ══════════════ -->
        <section id="datenschutz">
          <h2>Datenschutz</h2>
          <h3>Wohin Ihre Texte gehen</h3>
          <p>
            Ausschließlich an Ihren eigenen Presidio-Server. Es gibt keine Cloud-Anbindung, keine
            Telemetrie und keinen Aufruf fremder Dienste. Der Text verlässt Ihr Netz nicht.
          </p>
          <h3>Was gespeichert wird</h3>
          <ul class="doc-list">
            <li><strong>Im Browser:</strong> Ihre Einstellungen — Sprache, Verfahren, Schwellenwert, eigene Regeln, Design. <em>Nicht</em> Ihre Texte.</li>
            <li><strong>Auf dem Server:</strong> nichts. Presidio verarbeitet jede Anfrage einzeln und hält nichts vor.</li>
          </ul>
          <h3>Grenzen der Anonymisierung</h3>
          <div class="doc-warn">
            <p>
              Auch nach der Anonymisierung kann ein Text eine Person identifizierbar machen. Bleiben
              Beruf, Wohnort und Geburtsjahr stehen, genügt das in kleinen Grundgesamtheiten oft
              schon. Die DSGVO kennt den Unterschied zwischen <em>anonym</em> (kein Personenbezug
              mehr herstellbar) und <em>pseudonym</em> (Zuordnung mit Zusatzwissen möglich).
            </p>
            <p>
              Verschlüsseln und Hashen erzeugen <strong>Pseudonymisierung</strong>, keine
              Anonymisierung — die Daten bleiben damit personenbezogen im Sinne der DSGVO.
            </p>
          </div>
        </section>

        <!-- ══════════════ 13 ══════════════ -->
        <section id="fehler">
          <h2>Fehlerbehebung</h2>

          <h3>Ein Statuspunkt ist rot</h3>
          <p>
            Der Dienst antwortet nicht. Prüfen Sie mit <code>docker ps</code>, ob der Container läuft,
            und mit <code>docker logs</code>, ob er beim Start abbricht. Häufigste Ursache ist eine
            widersprüchliche Sprachkonfiguration.
          </p>

          <h3>Es wird gar nichts gefunden</h3>
          <ul class="doc-list">
            <li>Passt die gewählte <strong>Sprache</strong> zum Text? Deutsche Modelle erkennen englische Namen schlecht und umgekehrt.</li>
            <li>Steht die <strong>Erkennungsschwelle</strong> zu hoch? Über 0.85 fallen Personennamen heraus.</li>
            <li>Ist die <strong>Entitätsauswahl</strong> zu eng? Der Zähler in der Sidebar zeigt, wie viele Typen aktiv sind.</li>
            <li>Steht der Begriff versehentlich in der <strong>Ausnahmeliste</strong>?</li>
          </ul>

          <h3>Zu viele Fehlalarme</h3>
          <p>
            Schwelle anheben, Entitäten eingrenzen oder störende Begriffe in die Ausnahmeliste
            aufnehmen. Die Spalte <em>Score</em> zeigt, wo die sinnvolle Grenze liegt.
          </p>

          <h3>Eine Straße wird nicht erkannt</h3>
          <p>
            Ist unter <em>Adress-Erkennung</em> die passende Regel aktiv? Die Muster decken die
            gängigen Endungen ab — Straße, Str., Weg, Gasse, Allee, Platz, Ring, Damm, Ufer,
            Chaussee, Steig, Markt, Promenade. Ungewöhnliche Formen ergänzen Sie über
            <em>Eigene Muster</em>.
          </p>

          <h3>Entschlüsseln schlägt fehl</h3>
          <p>
            Der AES-Schlüssel muss exakt derselbe sein wie beim Verschlüsseln. Wurde er zwischendurch
            geändert, ist der Originaltext nicht mehr herstellbar.
          </p>

          <h3>Die Analyse dauert lang</h3>
          <p>
            Die Laufzeit steht unten links im Eingabefeld. Sehr lange Texte brauchen mehr Zeit;
            schalten Sie <em>Automatisch analysieren</em> ab und lösen Sie manuell aus.
          </p>
        </section>

        <!-- ══════════════ 14 ══════════════ -->
        <section id="glossar">
          <h2>Glossar</h2>
          <dl class="doc-dl">
            <div v-for="entry in GLOSSARY" :key="entry.term">
              <dt>{{ entry.term }}</dt>
              <dd>{{ entry.text }}</dd>
            </div>
          </dl>

          <h3>Weiterführend</h3>
          <ul class="doc-list">
            <li>
              <a class="doc-extlink" href="https://microsoft.github.io/presidio/" target="_blank" rel="noreferrer noopener">
                Presidio-Dokumentation <ExternalLink :size="12" />
              </a>
              — offizielle Referenz zu Recognizern, Operatoren und API
            </li>
            <li>
              <a class="doc-extlink" href="https://spacy.io/models/de" target="_blank" rel="noreferrer noopener">
                spaCy-Modelle für Deutsch <ExternalLink :size="12" />
              </a>
              — Grundlage der Namenserkennung
            </li>
          </ul>
        </section>
      </article>
    </div>
  </div>
</template>
