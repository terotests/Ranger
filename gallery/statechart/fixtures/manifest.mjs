// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The module's own machines, for `tests/xstate-parity.mjs`.
//
//   npm run statechart:parity
//
// These belong to no application. Conformance used to be measured only where
// the runner was USED — three machines ported from one app — which meant this
// module could not be checked without that app's fixtures, and a semantic
// nobody's machine happened to use had nowhere to be tested. So there are two
// here: the smallest machine that is still a machine, and one that uses
// everything the runner has.

export const dir = "machines";

// No host actions. Appending to a cart used to be one — the machine named
// `addItem` and this ran it — until it became clear that a list is exactly as
// declarable as a map: `append` is what `setKey` already was. The module's own
// conformance now depends on no application code at all.

export const machines = [
  {
    file: "trafficLight.machine.json",
    seeds: {
      red: [],
      green: [["TIMER", {}]],
      yellow: [["TIMER", {}], ["TIMER", {}]],
    },
    payloads: {},
  },
  {
    file: "checkout.machine.json",
    // `fulfilment.deciding` is an `always` fork and `fulfilment.shipped` a
    // final child, so neither can be stood in; the harness fails if any OTHER
    // leaf is missing here.
    seeds: {
      cart: [],
      "payment.entering": [["ADD_ITEM", { sku: "a", price: 10 }], ["CHECKOUT", {}]],
      "payment.verifying": [
        ["ADD_ITEM", { sku: "a", price: 10 }],
        ["CHECKOUT", {}],
        ["SET_CARD", { card: "4242" }],
        ["PAY", {}],
      ],
      "fulfilment.packing": [
        ["ADD_ITEM", { sku: "a", price: 10 }],
        ["ADD_ITEM", { sku: "b", price: 20 }],
        ["CHECKOUT", {}],
        ["SET_CARD", { card: "4242" }],
        ["PAY", {}],
        ["APPROVED", {}],
      ],
      done: [
        ["ADD_ITEM", { sku: "a", price: 10 }],
        ["CHECKOUT", {}],
        ["SET_CARD", { card: "4242" }],
        ["PAY", {}],
        ["APPROVED", {}],
      ],
    },
    payloads: {
      ADD_ITEM: { sku: "a", price: 10 },
      SET_COUPON: { code: "KEVAT26" },
      // Blank and whitespace among them, so the fuzz crosses `hasCard` on both
      // sides of its threshold.
      SET_CARD: [{ card: "4242" }, { card: "" }, { card: "   " }],
      DECLINED: [{ reason: "katteeton" }, {}],
    },
  },
];
