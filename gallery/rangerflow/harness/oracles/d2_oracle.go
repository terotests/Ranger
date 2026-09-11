// d2_oracle.go — ask D2 what its own examples mean.
//
// Built and run by `d2_oracle.mjs`, which copies this file into the gitignored
// `harness/vendor/` with a generated `go.mod` and lets the Go toolchain fetch
// D2 at the pinned version. Nothing of D2 is vendored into this repository.
//
//   d2oracle --keywords out.json     D2's own keyword, shape and arrowhead tables
//   d2oracle --layout dagre in.d2 out.json
//
// D2 hands back more than either of the other two oracles could. PlantUML has
// to be read off an annotated SVG and Mermaid off a parse database; D2's
// `d2lib.Compile` returns a `*d2target.Diagram`, which is already the answer:
// every shape with its absolute position, size, type, level and label, every
// connection with its arrowheads, its label and its route, `sql_table` columns
// with their constraints, `class` fields and methods with their visibility,
// and the nested boards that `layers` / `scenarios` / `steps` created. It
// marshals to JSON as it stands.
//
// Licence. D2 is MPL-2.0. It is fetched by the Go toolchain when the oracle is
// built, run in a separate process, and no D2 source is copied into this
// repository — not a grammar, not a keyword table. What the reader knows about
// D2 it learned from D2's observable behaviour and from the tables this file
// prints.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sort"

	"oss.terrastruct.com/d2/d2ast"
	"oss.terrastruct.com/d2/d2graph"
	"oss.terrastruct.com/d2/d2layouts/d2dagrelayout"
	"oss.terrastruct.com/d2/d2layouts/d2elklayout"
	"oss.terrastruct.com/d2/d2lib"
	"oss.terrastruct.com/d2/d2renderers/d2svg"
	"oss.terrastruct.com/d2/d2target"
	"oss.terrastruct.com/d2/lib/textmeasure"
)

func sorted(m map[string]struct{}) []string {
	out := []string{}
	for k := range m {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

func write(path string, v any) {
	b, err := json.MarshalIndent(v, "", " ")
	if err != nil {
		fmt.Fprintln(os.Stderr, "marshal:", err)
		os.Exit(1)
	}
	// Written to a file rather than stdout: D2 logs a warning about a missing
	// slog.Logger to stdout, and a JSON document with a log line in it is not
	// a JSON document.
	if err := os.WriteFile(path, b, 0o644); err != nil {
		fmt.Fprintln(os.Stderr, "write:", err)
		os.Exit(1)
	}
}

// keywords prints the tables D2 consults, not a list typed from the website.
func keywords(out string) {
	write(out, map[string]any{
		"simple":         sorted(d2ast.SimpleReservedKeywords),
		"style":          sorted(d2ast.StyleKeywords),
		"composite":      sorted(d2ast.CompositeReservedKeywords),
		"board":          sorted(d2ast.BoardKeywords),
		"all":            sorted(d2ast.ReservedKeywords),
		"shapes":         d2target.Shapes,
		"arrowheads":     sorted(d2target.Arrowheads),
		"near":           d2ast.NearConstantsArray,
		"labelPositions": d2ast.LabelPositionsArray,
		"fillPatterns":   d2ast.FillPatterns,
		"textTransforms": d2ast.TextTransforms,
	})
}

func main() {
	args := os.Args[1:]
	if len(args) == 2 && args[0] == "--keywords" {
		keywords(args[1])
		return
	}
	if len(args) != 4 || args[0] != "--layout" {
		fmt.Fprintln(os.Stderr, "usage: d2oracle --keywords out.json | --layout <dagre|elk> in.d2 out.json")
		os.Exit(2)
	}
	engine, in, out := args[1], args[2], args[3]

	src, err := os.ReadFile(in)
	if err != nil {
		fmt.Fprintln(os.Stderr, "read:", err)
		os.Exit(1)
	}
	ruler, err := textmeasure.NewRuler()
	if err != nil {
		fmt.Fprintln(os.Stderr, "ruler:", err)
		os.Exit(1)
	}
	resolve := func(e string) (d2graph.LayoutGraph, error) {
		if e == "elk" {
			return d2elklayout.DefaultLayout, nil
		}
		return d2dagrelayout.DefaultLayout, nil
	}
	diagram, _, err := d2lib.Compile(context.Background(), string(src), &d2lib.CompileOptions{
		LayoutResolver: resolve,
		Layout:         &engine,
		Ruler:          ruler,
		InputPath:      in,
	}, &d2svg.RenderOpts{})
	if err != nil {
		// A file D2 refuses is an answer too, and the parity tool needs to be
		// able to tell it from a crash.
		write(out, map[string]any{"error": err.Error()})
		os.Exit(3)
	}
	write(out, diagram)
}
