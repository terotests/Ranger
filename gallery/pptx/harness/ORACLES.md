# PPTX oracles

```text
fixture.pptx
    │
    ├─ A. feature / inspectJson     harness/run.mjs
    ├─ B. semantic                  python-pptx  ↔  Ranger inspect.json
    └─ C. visual                    LibreOffice  ↔  Ranger SoftCanvas PNG
```

## OS dependencies

| Binary / package | Role |
| --- | --- |
| `soffice` / LibreOffice Impress | reference PDF export |
| `pdftoppm` (poppler-utils) | PDF → PNG @ 96 DPI |
| `python3` + `python-pptx` | semantic model dump |
| `Pillow` | MAE / max-channel diff + diff panels |

```bash
pip install python-pptx Pillow
sudo apt-get install libreoffice-impress poppler-utils
```

## Outputs

`harness/out/<name>/` (gitignored):

- `ranger/slide-XXX.png` — Ranger oracle render (no chrome, 96dpi)
- `libreoffice/slide-XXX.png` — LO reference
- `diff/*-diff.png` — LO | Ranger | amplified delta
- `inspect.json`, `python-pptx.json`

## Exit policy

- Semantic mismatches → fail
- Visual mismatches → advisory unless `--strict-visual`
- Missing LO/pdftoppm → visual SKIP (exit 0)
