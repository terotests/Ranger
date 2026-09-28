## Pie

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "A simple pie chart with embedded data.",
  "data": {
    "values": [
      {"category": 1, "value": 4},
      {"category": 2, "value": 6},
      {"category": 3, "value": 10},
      {"category": 4, "value": 3},
      {"category": 5, "value": 7},
      {"category": 6, "value": 8}
    ]
  },
  "mark": "arc",
  "encoding": {
    "theta": {"field": "value", "type": "quantitative"},
    "color": {"field": "category", "type": "nominal"}
  }
}
```

## Donut

```vega-lite
{
  "data": {"values": [{"k": "a", "v": 3}, {"k": "b", "v": 5}, {"k": "c", "v": 2}]},
  "mark": {"type": "arc", "innerRadius": 50},
  "encoding": {"theta": {"field": "v", "type": "quantitative"}, "color": {"field": "k", "type": "nominal"}}
}
```
