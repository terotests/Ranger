# DOCX oracles

```text
fixture.docx
    │
    ├─ B. semantic   python-docx  ↔  Ranger actual.json (inspectJson)
    └─ C. visual     LibreOffice  ↔  Ranger SoftCanvas page-XXX.png
```

## Run

```bash
# regenerate fixtures
npm run docx_viewer:fixtures

# compile dump + run oracles
node gallery/docx_viewer/harness/run_oracles.mjs
node gallery/docx_viewer/harness/run_oracles.mjs --fixture hello.docx --skip-visual
```

Dump tool:

```bash
node gallery/docx_viewer/bin/docx_oracle_dump.js gallery/docx_viewer/fixtures/hello.docx outdir
```

## OS dependencies

| Binary / package | Role |
| --- | --- |
| `soffice` / LibreOffice Writer | reference PDF export |
| `pdftoppm` (poppler-utils) | PDF → PNG @ 96 DPI |
| `python3` + `python-docx` | semantic model dump |
| `Pillow` | MAE / max-channel diff + diff panels |
| `ffmpeg` | JPEG fixture media |
| `Pillow` | PNG fixture media |

```bash
pip install python-docx Pillow
sudo apt-get install libreoffice-writer poppler-utils ffmpeg
```

## Outputs

`harness/out/<name>/` (gitignored):

- `ranger/actual.json` — Ranger `inspectJson`
- `ranger/page-XXX.png` — Ranger oracle render
- `libreoffice/page-XXX.png` — LO reference
- `diff/*-diff.png` — LO | Ranger | amplified delta
- `python-docx.json` — semantic reference dump

## Exit policy

- Semantic mismatches → fail
- Visual mismatches → advisory unless `--strict-visual`
- Missing LO/pdftoppm → visual SKIP (exit 0)
