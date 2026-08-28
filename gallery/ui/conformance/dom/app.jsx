/**
 * Radix playground — the oracle for the conformance harness.
 *
 * Real @radix-ui components in a real browser, built from the SAME fixture the
 * Ranger adapter reads, so neither side gets to describe the test in its own
 * terms. Composite controls derive their parts' test ids by the rules in
 * SPEC.md, and both adapters must derive them identically.
 *
 * Nothing here is styled. The harness compares behaviour, not pixels — the two
 * systems lay out differently on purpose.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import * as Accordion from "@radix-ui/react-accordion";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Switch from "@radix-ui/react-switch";
import * as Tabs from "@radix-ui/react-tabs";
import * as Toggle from "@radix-ui/react-toggle";

export function Control({ spec }) {
  const tid = spec.tid;

  switch (spec.type) {
    case "toggle":
      return (
        <Toggle.Root data-tid={tid} aria-label={spec.name} disabled={!!spec.disabled}>
          {spec.name}
        </Toggle.Root>
      );

    case "collapsible":
      return (
        <Collapsible.Root data-tid={tid} disabled={!!spec.disabled}>
          <Collapsible.Trigger data-tid={tid + "-trigger"}>{spec.name}</Collapsible.Trigger>
          <Collapsible.Content data-tid={tid + "-content"}>{spec.body || ""}</Collapsible.Content>
        </Collapsible.Root>
      );

    case "checkbox":
      return (
        <Checkbox.Root
          data-tid={tid}
          aria-label={spec.name}
          disabled={!!spec.disabled}
          defaultChecked={spec.checked === "indeterminate" ? "indeterminate" : !!spec.checked}
        >
          <Checkbox.Indicator />
        </Checkbox.Root>
      );

    case "switch":
      return (
        <Switch.Root
          data-tid={tid}
          aria-label={spec.name}
          disabled={!!spec.disabled}
          defaultChecked={!!spec.checked}
        >
          <Switch.Thumb />
        </Switch.Root>
      );

    case "radiogroup":
      return (
        <RadioGroup.Root data-tid={tid} aria-label={spec.name} defaultValue={spec.value}>
          {spec.items.map((it) => (
            <RadioGroup.Item
              key={it.value}
              value={it.value}
              data-tid={tid + "-" + it.value}
              aria-label={it.name}
              disabled={!!it.disabled}
            >
              <RadioGroup.Indicator />
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      );

    case "tabs":
      return (
        <Tabs.Root data-tid={tid} defaultValue={spec.value}>
          <Tabs.List data-tid={tid + "-list"} aria-label={spec.name}>
            {spec.items.map((it) => (
              <Tabs.Trigger
                key={it.value}
                value={it.value}
                data-tid={tid + "-tab-" + it.value}
                disabled={!!it.disabled}
              >
                {it.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {spec.items.map((it) => (
            <Tabs.Content key={it.value} value={it.value} data-tid={tid + "-panel-" + it.value}>
              {it.body || ""}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      );

    case "accordion":
      return (
        <Accordion.Root type="single" collapsible data-tid={tid} defaultValue={spec.value}>
          {spec.items.map((it) => (
            <Accordion.Item key={it.value} value={it.value} data-tid={tid + "-" + it.value}>
              <Accordion.Header>
                <Accordion.Trigger data-tid={tid + "-" + it.value + "-trigger"}>
                  {it.name}
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content data-tid={tid + "-" + it.value + "-content"}>
                {it.body || ""}
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      );

    default:
      throw new Error("unknown control type: " + spec.type);
  }
}

export function App({ fixture }) {
  return (
    <div>
      {fixture.controls.map((c) => (
        <Control key={c.tid} spec={c} />
      ))}
    </div>
  );
}

// Auto-mount only when the headless harness injected a fixture. The playground
// imports Control/App instead, so both hosts render the same Radix tree.
if (typeof window !== "undefined" && window.__FIXTURE__) {
  createRoot(document.getElementById("root")).render(<App fixture={window.__FIXTURE__} />);
  window.__READY__ = true;
}
