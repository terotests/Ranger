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
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import * as Avatar from "@radix-ui/react-avatar";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as HoverCard from "@radix-ui/react-hover-card";
import * as Label from "@radix-ui/react-label";
import * as Popover from "@radix-ui/react-popover";
import * as Progress from "@radix-ui/react-progress";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Separator from "@radix-ui/react-separator";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import * as Tabs from "@radix-ui/react-tabs";
import * as Toast from "@radix-ui/react-toast";
import * as Toggle from "@radix-ui/react-toggle";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import * as Toolbar from "@radix-ui/react-toolbar";
import * as Tooltip from "@radix-ui/react-tooltip";

/**
 * Toast is the one control the fixture cannot express declaratively: it has no
 * trigger of its own, so the harness supplies a button that opens it. `duration`
 * is deliberately enormous — an auto-dismiss timer would make the oracle depend
 * on how fast the machine is.
 */
function ToastControl({ spec, tid }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Toast.Provider swipeDirection="right" duration={spec.duration ?? 1000000}>
      <button data-tid={tid + "-trigger"} type="button" onClick={() => setOpen(true)}>
        {spec.name}
      </button>
      <Toast.Root data-tid={tid} open={open} onOpenChange={setOpen}>
        <Toast.Title data-tid={tid + "-title"}>{spec.title || spec.name}</Toast.Title>
        <Toast.Description data-tid={tid + "-description"}>{spec.body || ""}</Toast.Description>
        <Toast.Action data-tid={tid + "-action"} altText={spec.actionName || "Undo"}>
          {spec.actionName || "Undo"}
        </Toast.Action>
        <Toast.Close data-tid={tid + "-close"}>Close</Toast.Close>
      </Toast.Root>
      {/*
        Radix wraps the viewport list in a NAMED region — that landmark is how
        a reader finds a toast at all, and it is a separate element from the
        <ol> the tid sits on. The ref reaches up one level to tag it, because
        the component renders the wrapper itself and takes no prop for it. Two
        elements on the reference side means two on the EVG side; tagging only
        the list would have quietly dropped the landmark from the comparison.
      */}
      <Toast.Viewport
        data-tid={tid + "-viewport"}
        label="Notifications"
        ref={(el) => {
          if (el && el.parentElement) el.parentElement.setAttribute("data-tid", tid + "-region");
        }}
      />
    </Toast.Provider>
  );
}

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

    case "label":
      return (
        <Label.Root data-tid={tid} htmlFor={tid + "-for"}>
          {spec.name}
        </Label.Root>
      );

    case "separator":
      return (
        <Separator.Root
          data-tid={tid}
          orientation={spec.orientation || "horizontal"}
          decorative={!!spec.decorative}
        />
      );

    case "progress":
      return (
        <Progress.Root data-tid={tid} aria-label={spec.name} value={spec.value ?? null} max={spec.max || 100}>
          <Progress.Indicator data-tid={tid + "-indicator"} />
        </Progress.Root>
      );

    case "aspectratio":
      return (
        <div data-tid={tid + "-outer"} style={{ width: (spec.width || 120) + "px" }}>
          <AspectRatio.Root data-tid={tid} ratio={spec.ratio || 1}>
            <span data-tid={tid + "-content"}>{spec.name || ""}</span>
          </AspectRatio.Root>
        </div>
      );

    case "accessibleicon":
      return (
        <button data-tid={tid} type="button" disabled={!!spec.disabled}>
          <AccessibleIcon.Root label={spec.name}>
            <span data-tid={tid + "-glyph"} aria-hidden="true">
              {spec.glyph || "★"}
            </span>
          </AccessibleIcon.Root>
        </button>
      );

    case "avatar":
      return (
        <Avatar.Root data-tid={tid}>
          {spec.src ? <Avatar.Image data-tid={tid + "-image"} src={spec.src} alt={spec.name} /> : null}
          <Avatar.Fallback data-tid={tid + "-fallback"} delayMs={spec.delayMs ?? 0}>
            {spec.fallback || "?"}
          </Avatar.Fallback>
        </Avatar.Root>
      );

    case "togglegroup":
      return (
        <ToggleGroup.Root
          data-tid={tid}
          type="single"
          aria-label={spec.name}
          defaultValue={spec.value}
        >
          {spec.items.map((it) => (
            <ToggleGroup.Item
              key={it.value}
              value={it.value}
              data-tid={tid + "-" + it.value}
              aria-label={it.name}
              disabled={!!it.disabled}
            >
              {it.name}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      );

    case "toolbar":
      return (
        <Toolbar.Root data-tid={tid} aria-label={spec.name}>
          {spec.items.map((it) => (
            <Toolbar.Button
              key={it.value}
              data-tid={tid + "-" + it.value}
              disabled={!!it.disabled}
            >
              {it.name}
            </Toolbar.Button>
          ))}
        </Toolbar.Root>
      );

    case "dialog":
      return (
        <Dialog.Root data-tid={tid}>
          <Dialog.Trigger data-tid={tid + "-trigger"}>{spec.name}</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay data-tid={tid + "-overlay"} />
            <Dialog.Content data-tid={tid + "-content"} aria-describedby={undefined}>
              <Dialog.Title data-tid={tid + "-title"}>{spec.title || spec.name}</Dialog.Title>
              <Dialog.Close data-tid={tid + "-close"}>Close</Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      );

    case "alertdialog":
      return (
        <AlertDialog.Root data-tid={tid}>
          <AlertDialog.Trigger data-tid={tid + "-trigger"}>{spec.name}</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay data-tid={tid + "-overlay"} />
            <AlertDialog.Content data-tid={tid + "-content"}>
              <AlertDialog.Title data-tid={tid + "-title"}>{spec.title || spec.name}</AlertDialog.Title>
              <AlertDialog.Description data-tid={tid + "-description"}>
                {spec.body || ""}
              </AlertDialog.Description>
              <AlertDialog.Cancel data-tid={tid + "-cancel"}>Cancel</AlertDialog.Cancel>
              <AlertDialog.Action data-tid={tid + "-action"}>OK</AlertDialog.Action>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      );

    case "popover":
      return (
        <Popover.Root data-tid={tid}>
          <Popover.Trigger data-tid={tid + "-trigger"}>{spec.name}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Content data-tid={tid + "-content"}>
              {spec.body || ""}
              <button data-tid={tid + "-inner"} type="button">Inner</button>
              <Popover.Close data-tid={tid + "-close"}>Close</Popover.Close>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      );

    case "tooltip":
      // delayDuration 0: a timer would make the oracle depend on the machine.
      return (
        <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
          <Tooltip.Root data-tid={tid}>
            <Tooltip.Trigger data-tid={tid + "-trigger"}>{spec.name}</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content data-tid={tid + "-content"}>{spec.body || spec.name}</Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      );

    case "hovercard":
      return (
        <HoverCard.Root data-tid={tid} openDelay={0} closeDelay={0}>
          <HoverCard.Trigger data-tid={tid + "-trigger"} href="#">{spec.name}</HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content data-tid={tid + "-content"}>{spec.body || ""}</HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      );

    case "toast":
      return <ToastControl spec={spec} tid={tid} />;

    case "slider":
      return (
        <Slider.Root
          data-tid={tid}
          aria-label={spec.name}
          defaultValue={[spec.value ?? 50]}
          min={spec.min ?? 0}
          max={spec.max ?? 100}
          step={spec.step ?? 1}
          disabled={!!spec.disabled}
        >
          <Slider.Track data-tid={tid + "-track"}>
            <Slider.Range data-tid={tid + "-range"} />
          </Slider.Track>
          <Slider.Thumb data-tid={tid + "-thumb"} aria-label={spec.name} />
        </Slider.Root>
      );

    case "dropdownmenu":
      return (
        <DropdownMenu.Root data-tid={tid}>
          <DropdownMenu.Trigger data-tid={tid + "-trigger"}>{spec.name}</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content data-tid={tid + "-content"}>
              {spec.items.map((it) => (
                <DropdownMenu.Item
                  key={it.value}
                  data-tid={tid + "-item-" + it.value}
                  disabled={!!it.disabled}
                >
                  {it.name}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      );

    case "contextmenu":
      return (
        <ContextMenu.Root data-tid={tid}>
          <ContextMenu.Trigger data-tid={tid + "-trigger"}>{spec.name}</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content data-tid={tid + "-content"}>
              {spec.items.map((it) => (
                <ContextMenu.Item
                  key={it.value}
                  data-tid={tid + "-item-" + it.value}
                  disabled={!!it.disabled}
                >
                  {it.name}
                </ContextMenu.Item>
              ))}
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
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
