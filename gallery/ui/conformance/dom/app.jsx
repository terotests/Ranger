/**
 * Radix reference host.
 *
 * The oracle for the conformance harness: real @radix-ui components in a real
 * browser. It reads the SAME fixture the Ranger adapter reads, so neither side
 * gets to describe the test in its own terms.
 *
 * Nothing here is styled. The harness compares behaviour, not pixels — the two
 * systems lay out differently on purpose.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Toggle from "@radix-ui/react-toggle";

function Control({ spec }) {
  if (spec.type === "toggle") {
    return (
      <Toggle.Root data-tid={spec.tid} aria-label={spec.name} disabled={!!spec.disabled}>
        {spec.name}
      </Toggle.Root>
    );
  }
  if (spec.type === "collapsible") {
    return (
      <Collapsible.Root data-tid={spec.tid} disabled={!!spec.disabled}>
        <Collapsible.Trigger data-tid={spec.tid + "-trigger"}>{spec.name}</Collapsible.Trigger>
        <Collapsible.Content data-tid={spec.tid + "-content"}>{spec.body || ""}</Collapsible.Content>
      </Collapsible.Root>
    );
  }
  throw new Error("unknown control type: " + spec.type);
}

function App({ fixture }) {
  return (
    <div>
      {fixture.controls.map((c) => (
        <Control key={c.tid} spec={c} />
      ))}
    </div>
  );
}

const fixture = window.__FIXTURE__;
createRoot(document.getElementById("root")).render(<App fixture={fixture} />);
window.__READY__ = true;
