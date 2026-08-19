# XLSX / DataGrid oracles

```text
fixture.xlsx
    │
    ├─ A. Ranger tests          npm run datagrid:*:test
    ├─ B. semantic              openpyxl  ↔  Ranger inspect.json
    ├─ C. visual                LibreOffice Calc → PNG  ↔  Ranger SoftCanvas PNG
    └─ D. formula               LibreOffice Calc → CSV  ↔  Ranger formula values
```

## OS dependencies

| Package | Role |
| --- | --- |
| `python3` + `openpyxl` + `Pillow` | semantic + MAE |
| `soffice` / LibreOffice Calc | visual PDF + formula CSV (optional) |
| `pdftoppm` (poppler-utils) | PDF → PNG |

Visual and formula oracles **SKIP** cleanly when LibreOffice is absent.

## Screenshots (tracked PNGs)

```bash
npm run datagrid:artifacts
```

Writes clear SoftCanvas PNGs under `gallery/datagrid/artifacts/` (not gitignored):

- `01_business_summary_cf.png` — Summary sheet with color-scale CF
- `02_sales_filter_sort_menu.png` — filter + sort + header popup
- `03_formulas_calc.png` — formula workbook

## Run

```bash
npm run datagrid:oracle:dump
npm run datagrid:oracle:formula
npm run datagrid:oracles
npm run datagrid:formula:bench
```

Harness outputs under `harness/out/<name>/` (gitignored). Artifacts PNGs are committed for PR review.
