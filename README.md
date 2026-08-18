# Presidio Studio

A modern Vue 3 frontend for [Microsoft Presidio](https://microsoft.github.io/presidio/),
in the spirit of the [official Hugging Face demo](https://huggingface.co/spaces/presidio/presidio_demo)
but built against your own Analyzer and Anonymizer REST services.

Paste text, watch PII light up as you type, and switch between de-identification
strategies without leaving the page.

## Features

- **Live analysis** — the pipeline re-runs shortly after every edit (toggleable).
- **Seven de-identification modes** — highlight, replace, redact, mask, hash,
  encrypt and keep, each with its own parameters.
- **Reversible encryption** — AES-encrypt findings, then restore the original
  text through `/deanonymize` with a single click.
- **Language discovery** — the app probes the analyzer at startup and offers
  only the languages your deployment actually loaded (here: English and German,
  including `DE_TAX_ID`, `DE_ID_CARD` and `DE_LICENSE_PLATE`).
- **Confidence threshold** and **entity filtering** with live per-entity counts.
- **Address recognizers** — Presidio's models tag cities as `LOCATION` but ship
  no recognizer for streets or postal codes. Built-in presets close that gap for
  German (`DE_STREET_ADDRESS`, `DE_POSTAL_CODE`) and English
  (`STREET_ADDRESS`, `US_ZIP_CODE`); on by default, toggleable in the sidebar,
  and requiring no change to the Presidio server. To move the same rules into the
  analyzer itself, see [`server/`](server/README.md).
- **Allow lists** for phrases that must never be flagged.
- **Ad-hoc recognizers** — deny lists and custom regex patterns, registered per
  request, with their own colors in every panel.
- **Explainable findings** — the decision process behind every match: recognizer,
  pattern, score before and after context boosting, checksum validation.
- **API inspector** — the exact JSON posted to Presidio, plus a ready-to-run cURL
  command, so the UI doubles as API documentation.
- Export findings as CSV or JSON, copy or download the de-identified text,
  drag in a `.txt` file, and switch between light and dark themes.

## Architecture

```
Browser ──▶ Vite dev server / nginx ──▶ presidio-analyzer   :5002
                    (same origin)   └─▶ presidio-anonymizer :5001
```

Presidio's services send **no CORS headers**, so a browser can never call them
directly. Every request therefore goes through a same-origin proxy: the Vite dev
server in development, nginx in the container. Both expose the services under
`/api/analyzer` and `/api/anonymizer`.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5180
```

The dev proxy defaults to the endpoints below. Override them by copying
`.env.example` to `.env` and editing the values:

```
PRESIDIO_ANALYZER_URL=http://192.168.178.89:5002
PRESIDIO_ANONYMIZER_URL=http://192.168.178.89:5001
```

## Production

```bash
docker compose up -d --build   # http://localhost:8080
```

Or without compose:

```bash
docker build -t presidio-ui .
docker run -d -p 8080:8080 \
  -e PRESIDIO_ANALYZER_URL=http://192.168.178.89:5002 \
  -e PRESIDIO_ANONYMIZER_URL=http://192.168.178.89:5001 \
  presidio-ui
```

The endpoints are read at container start, so the same image works against any
Presidio deployment. If the UI runs on the same Docker network as Presidio, use
the service names instead, e.g. `http://presidio-analyzer-de:3000`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload and the Presidio proxy |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check only |

## Project layout

```
src/
  api/presidio.ts        REST client, error handling, language discovery
  stores/presidio.ts     Pinia store: configuration, pipeline, persistence
  components/            Sidebar controls, editor, output, findings, inspector
  data/entities.ts       Entity colors and descriptions
  data/recognizerPresets.ts  Built-in address / postal-code recognizers

server/                  Analyzer-side recognizer config (see server/README.md)
  data/samples.ts        Demo texts (EN + DE)
```

## Dokumentation

Die Oberfläche bringt ein eigenes Handbuch mit, erreichbar über den Knopf
*Dokumentation* in der Kopfzeile oder direkt unter `#/doku`. Es deckt Grundlagen,
jede Bedienfunktion, die sieben Anonymisierungsverfahren, Scores, eigene
Erkennungsregeln, die REST-API, die Serverkonfiguration, Datenschutzhinweise und
ein Glossar ab. Die Entitäts-Referenz wird zur Laufzeit vom Analyzer abgefragt
und bleibt damit automatisch aktuell.

## Layout

From the `lg` breakpoint up the app is pinned to the viewport: the page itself
never scrolls, and each panel scrolls inside its own box. Editor and findings
split the available height evenly, both with a minimum so neither collapses on
short screens. Below `lg` there is not enough height for that, so the page falls
back to normal document flow.

## Notes

- Configuration is persisted to `localStorage`, so a reload keeps your settings.
- Presidio can return overlapping spans (an IBAN that also matches
  `ORGANIZATION`). The UI renders the strongest span per region and reports the
  rest as "overlapping"; the findings table always lists every raw result.
- The AES key for the encrypt operator must be 16, 24 or 32 bytes. The sidebar
  validates this as you type.
- The address presets are ad-hoc recognizers sent with each request. Presidio
  compiles them with Python `re` and defaults to `DOTALL|MULTILINE|IGNORECASE`;
  the address patterns pass flags `24` to drop `IGNORECASE`, because German and
  English street names depend on capitalisation. The postal-code patterns require
  a neighbouring place name or state code, so order and invoice numbers of the
  same length are not flagged.
- For a permanent, server-side fix, [`server/`](server/README.md) contains the
  recognizer YAML, a merge script that extends your existing registry config
  without overwriting it, and a smoke test. Switch the sidebar presets off once
  the server handles it.
