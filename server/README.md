# Server-side address recognizers

Makes `DE_STREET_ADDRESS`, `DE_PLZ`, `STREET_ADDRESS` and `US_ZIP_CODE` part of
the analyzer itself, so every client benefits — not just this UI.

## Why this is needed

Presidio's NLP models tag city names as `LOCATION` but ship **no street-address
recognizer for any language**. Your analyzer confirms it:

```
$ curl -s -X POST $ANALYZER/analyze -H 'Content-Type: application/json' \
    -d '{"text":"wohnhaft in der Hauptstraße 14, 80331 München","language":"de"}'
[{"entity_type": "LOCATION", ...}]     # only München
```

Your image (the `data-privacy-stack` fork) *does* contain a `DePlzRecognizer`,
but it is `enabled: false` and deliberately weak: base score 0.05 with a
`[0-9]{5}` pattern, lifted to 0.40 whenever any address word appears anywhere in
the surrounding window. Measured against a document containing three decoy
numbers, it flagged all of them:

| Recognizer | Real PLZ found | False positives |
| --- | --- | --- |
| built-in `DePlzRecognizer` | 2 / 2 | 3 (`12345 EUR`, `45678 XYZ`, `80331 ohne Ort`) |
| `PostleitzahlRecognizer` here | 2 / 2 | 0 |

The recognizer in this directory requires a place name directly after the digits,
which is what removes the decoys. That is why it is used instead of enabling the
built-in one.

## What gets added

| Recognizer | Entity | Language | Matches |
| --- | --- | --- | --- |
| `StrasseHausnummerRecognizer` | `DE_STREET_ADDRESS` | de | `Hauptstraße 14`, `Von-der-Tann-Str. 5a`, `Am Markt 3`, `Karl-Liebknecht-Straße 29-31`, `Alte Poststrasse 7`, `Bahnhofsweg 12b` |
| `PostleitzahlRecognizer` | `DE_PLZ` | de | `80331 München` — not `12345 EUR` |
| `StreetAddressRecognizer` | `STREET_ADDRESS` | en | `1600 Pennsylvania Avenue`, `742 Evergreen Terrace Apt 3B` |
| `UsZipCodeRecognizer` | `US_ZIP_CODE` | en | `Springfield IL 62704` |

## Install

Your analyzer runs a **customised** registry already — `PersonalausweisRecognizer`,
`KfzKennzeichenRecognizer`, `DeutscheSteuerIdRecognizer` and `DeutschePhoneRecognizer`
are custom names, not Presidio defaults. Do not overwrite that file; the merge
script appends to it and leaves everything else byte-identical.

### 1. Record the current state

```bash
cd ~/presidio
./verify.sh > /tmp/before.txt      # all address checks will report MISS
```

### 2. Locate the registry config

```bash
docker exec presidio-analyzer-de printenv RECOGNIZER_REGISTRY_CONF_FILE
docker inspect presidio-analyzer-de --format '{{json .Mounts}}' | python3 -m json.tool
```

- **Empty output** from the first command means the default is in use:
  `conf/default_recognizers.yaml` inside the image.
- The second command tells you whether that path is already bind-mounted from
  the host. If it is, edit the host file directly and skip step 3.

### 3. Copy the config out of the image (only if it is not bind-mounted)

```bash
mkdir -p ~/presidio/conf
CONF=$(docker exec presidio-analyzer-de printenv RECOGNIZER_REGISTRY_CONF_FILE \
       || echo /usr/bin/presidio-analyzer/conf/default_recognizers.yaml)
docker cp "presidio-analyzer-de:$CONF" ~/presidio/conf/recognizers.yaml
```

Then add `docker-compose.override.yml` from this directory to `~/presidio`,
correcting the service name and container path if they differ.

### 4. Merge the recognizers

```bash
python3 merge-address-recognizers.py ~/presidio/conf/recognizers.yaml
diff -u ~/presidio/conf/recognizers.yaml ~/presidio/conf/recognizers.yaml.new
python3 merge-address-recognizers.py ~/presidio/conf/recognizers.yaml --apply
```

The script refuses to touch a file it cannot parse, aborts if the merge would
drop an existing recognizer or alter any other top-level key, keeps a timestamped
`.bak-*` backup, and is safe to run twice.

If you would rather not run a script, open the file and paste the contents of
`address-recognizers.yaml` at the end of its `recognizers:` list. The indentation
is already correct for a two-space list.

### 5. Restart and verify

```bash
docker compose up -d          # or: docker restart presidio-analyzer-de
sleep 20
./verify.sh
```

Every check should now report `OK`, the two false-positive guards should stay
`clean`, and the recognizer list should include the four new names.

### 6. Turn off the UI-side presets

Once the server does the work, switch off *Address recognizers* in the Presidio
Studio sidebar so the same patterns are not also sent with every request. The UI
keeps working either way — identical spans are de-duplicated — but the request
payload stays smaller and the source of truth is unambiguous.

## Rollback

```bash
cp ~/presidio/conf/recognizers.yaml.bak-<timestamp> ~/presidio/conf/recognizers.yaml
docker compose up -d
```

If you added the compose override, remove it (and the `volumes`/`environment`
entries) to return to the image's built-in configuration entirely.

## A note on the regex flags

The loader applies the file's top-level `global_regex_flags` to **every** pattern
recognizer — there is no per-recognizer override:

```python
for recognizer_conf in recognizer_instances:
    if isinstance(recognizer_conf, PatternRecognizer):
        recognizer_conf.global_regex_flags = global_regex_flags
```

The default is `26` (`DOTALL|MULTILINE|IGNORECASE`). German and English street
names depend on capitalisation, so each pattern is wrapped in a scoped
`(?-i: … )` group that disables `IGNORECASE` for itself only. This keeps the
address patterns case-sensitive **without** changing the global flag, which other
recognizers may rely on. Verified against the live analyzer: with `(?-i:…)` and
flags 26, all address forms match and `Betrag 12345 EUR` stays clean.

## Making it permanent in your image

If you rebuild `presidio_presidio-analyzer` yourself, copy the merged file in and
point the env var at it, so no bind mount is needed:

```dockerfile
COPY conf/recognizers.yaml /usr/bin/presidio-analyzer/conf/recognizers.yaml
ENV RECOGNIZER_REGISTRY_CONF_FILE=/usr/bin/presidio-analyzer/conf/recognizers.yaml
```
