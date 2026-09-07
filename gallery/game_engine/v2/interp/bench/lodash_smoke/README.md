# lodash → ComponentEngine smoke

Loads [lodash](https://lodash.com/) **v4.17.21** into Ranger `ComponentEngine`
and compares complex collection / object pipelines against Node running the
same build.

## Run

```bash
bash scripts/build-engine-module.sh   # if needed
npm run jsengine:lodash               # CLI
npm run jsengine:lodash:test          # vitest unit tests
```

## What is covered

Not a hello-world map — pipelines that exercise:

- `chain` / `filter` / `map` / `sortBy` / `groupBy` / `orderBy`
- `merge` / `defaultsDeep` / `cloneDeep` (non-null)
- `flattenDeep`, `uniq`, `intersectionBy`, `partition`, `zipObject`
- nested object ops via array-path `get` + `pick` / `omit` / `assign`
  (dot-string `_.get(o,"a.b")` / `_.set` still fault on the engine)
- `template`, `flow`, `curry`, `once`
- A multi-step “sales report” transform over nested records

Hard gate: library loads and each case returns a value equal to Node’s
`JSON.stringify` (or string) result.
