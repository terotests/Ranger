# Issues this demo is carrying

Things found and not fixed here, written down so they are not rediscovered.
A gap the reference SHARES is not a porting bug and is not fixed on a whim:
this demo's whole claim is that it draws what the app being ported draws, and
a divergence has to be a decision, not an improvement somebody made in passing.

---

## 1. Custom fields are SUMMED per day, whatever they measure

Open. **The reference does the same**, so this is a shared bug and not a port
one, and closing it here is a deliberate divergence — see *What closing it
costs* below.

### What it looks like

Home → Tilastot, on a diary with two workouts in a day:

```
Syke-keski        283 bpm      +116%
07.05.2026
Ka: 144      Min: 99      Max: 283
```

283 bpm is not a heart rate. It is a sum:

```
2026-05-07  oma-paivakirja  diary-400   Custom Syke-keski 145|bpm
2026-05-07  oma-paivakirja  diary-401   Custom Syke-keski 138|bpm
                                        145 + 138 = 283
```

`Ka: 144` is inflated for the same reason — it is the mean over the daily
points, and some of those points are sums.

### Where

`RealTrainerDemo.statsPanel`, in the `Custom` arm of the row walk:

```
set fieldVals fat ((itemAt fieldVals fat) + (unwrap cv))
```

Every custom field with a numeric value and a unit is added into that day's
bucket under its lower-cased name. That is right for a QUANTITY — askeleet,
kalorit, nousu, matka, tonnage, kesto — and wrong for an INTENSIVE one, where
two readings in a day average or take a max but never add.

The reference is the same, twice over —
`frontend/src/components/organisms/TrainingStatsPanel.tsx`:

```ts
result.customFields[key].value += custom.value;      // within one workout
existing.customFields[key].value += val.value;       // across the day's workouts
```

### How much of the fixture it touches

Fields that occur more than once in a day and are not quantities:

| field | uses | days with more than one |
| --- | ---: | ---: |
| `hrv (ms)` | 89 | 35 |
| `effort` | 25 | 10 |
| `syke-keski (bpm)` | 16 | 8 |
| `leposyke (bpm)` | 18 | 2 |
| `rm1 (kg)`, `fiilis (/5)`, `energia (/5)`, `kadenssi (spm)`, `teho (W)`, `liikelaajuus (°)`, `syke-max (bpm)`, `kuulan-paino (kg)` | 2–6 each | 1 each |

### The shape of the fix

The unit already says which kind of quantity it is, and the name already
drives the colour (`customFieldColor`: `syke`/`hr` → red), so the same lookup
answers this:

* sum — `kcal`, `m`, `km`, `min`, `h`, and `kg` where it is tonnage
* mean — `bpm`, `ms`, `W`, `spm`, `°`, `/5`, `/10`
* max — `syke-max`, `rm1`, `pisin-*`

### What closing it costs

The numbers on those cards would stop matching the reference's. They are drawn
as text and the trace diff compares roles and names, so `rt:trace:diff` would
not notice — which is exactly why it would have to be written down here and in
the README rather than left to be spotted.
