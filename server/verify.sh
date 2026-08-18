#!/usr/bin/env bash
# Read-only smoke test for the address recognizers. Run before and after the
# change: before, the address lines produce no DE_STREET_ADDRESS / DE_PLZ.
#
#   ./verify.sh                                  # uses the default endpoint
#   ANALYZER=http://analyzer:3000 ./verify.sh
set -euo pipefail

ANALYZER="${ANALYZER:-http://192.168.178.89:5002}"

echo "Analyzer: $ANALYZER"
echo

check() {
  local label="$1" lang="$2" text="$3" expect="$4"
  local got
  got=$(curl -sS -m 30 -X POST "$ANALYZER/analyze" \
        -H 'Content-Type: application/json' \
        -d "$(printf '{"text":%s,"language":"%s"}' "$(printf '%s' "$text" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" "$lang")" \
      | python3 -c '
import json, sys
try:
    rows = json.load(sys.stdin)
except Exception:
    print("PARSE_ERROR"); raise SystemExit
print(",".join(sorted({r["entity_type"] for r in rows})) or "NONE")')

  if [[ "$got" == *"$expect"* ]]; then
    printf '  \033[32mOK\033[0m   %-22s found %s\n' "$label" "$expect"
  else
    printf '  \033[31mMISS\033[0m %-22s expected %s, got: %s\n' "$label" "$expect" "$got"
  fi
}

echo "German:"
check "street"        de "Anna Schneider, wohnhaft in der Hauptstraße 14, 80331 München." DE_STREET_ADDRESS
check "postal code"   de "Anna Schneider, wohnhaft in der Hauptstraße 14, 80331 München." DE_PLZ
check "hyphenated"    de "Zustellung an Von-der-Tann-Str. 5a, 10115 Berlin."               DE_STREET_ADDRESS
check "two-word"      de "Das Büro liegt Am Markt 3, 04109 Leipzig."                       DE_STREET_ADDRESS

echo
echo "English:"
check "street"        en "I live at 742 Evergreen Terrace Apt 3B, Springfield IL 62704."   STREET_ADDRESS
check "ZIP"           en "I live at 742 Evergreen Terrace Apt 3B, Springfield IL 62704."   US_ZIP_CODE

echo
echo "Must NOT be flagged (false-positive guards):"
for probe in "Betrag 12345 EUR ist faellig.:de" "Artikelnummer 45678 XYZ wurde geliefert.:de"; do
  text="${probe%:*}"; lang="${probe##*:}"
  got=$(curl -sS -m 30 -X POST "$ANALYZER/analyze" -H 'Content-Type: application/json' \
        -d "$(printf '{"text":%s,"language":"%s"}' "$(printf '%s' "$text" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" "$lang")" \
      | python3 -c '
import json,sys
rows = json.load(sys.stdin)
bad = sorted({r["entity_type"] for r in rows if r["entity_type"] in ("DE_PLZ","DE_STREET_ADDRESS")})
print(",".join(bad) or "clean")')
  if [[ "$got" == "clean" ]]; then
    printf '  \033[32mOK\033[0m   %-40s clean\n' "${text:0:38}"
  else
    printf '  \033[31mFAIL\033[0m %-40s flagged %s\n' "${text:0:38}" "$got"
  fi
done

echo
echo "Registered recognizers (de):"
curl -sS -m 15 "$ANALYZER/recognizers?language=de" | python3 -c '
import json,sys
for n in sorted(json.load(sys.stdin)): print("  -", n)'
