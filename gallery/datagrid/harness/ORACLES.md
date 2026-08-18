# XLSX / DataGrid oracles

```text
fixture.xlsx
    │
    ├─ A. Ranger tests          npm run datagrid:test / :xlsx:test / :workbook:test
    ├─ B. semantic              openpyxl  ↔  Ranger inspect.json
    └─ C. visual                LibreOffice Calc → PNG  ↔  Ranger SoftCanvas PNG
```

## OS dependencies

| Package | Role |
| --- | --- |
| `python3` + `openpyxl` + `Pillow` | semantic + MAE |
| `soffice` / LibreOffice Calc | reference PDF (optional) |
| `pdftoppm` (poppler-utils) | PDF → PNG |

Visual oracle **SKIP**s cleanly when LibreOffice is absent.

## Run

```bash
npm run datagrid:oracle:dump
npm run datagrid:oracles
```

Outputs under `harness/out/<name>/` (gitignored).
