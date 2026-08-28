/**
 * Shared counter component — host injects { createElement, useState, View, Text, Button }.
 * Same function runs under real React (DOM) and Ranger → EVG.
 */

"use strict";

function CounterCard(api) {
  const { createElement: h, useState, View, Text, Button } = api;
  return function CounterCardInner() {
    const [n, setN] = useState(0);
    const label = "count=" + String(n);
    return h(
      View,
      {
        width: "320px",
        padding: "24px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        flexDirection: "column",
        gap: "12px",
      },
      h(Text, { fontSize: "20px", fontWeight: "bold", color: "#0f172a" }, "Ranger UI"),
      h(Text, { fontSize: "14px", color: "#475569" }, "Same component · React DOM vs Ranger EVG"),
      h(Text, { fontSize: "18px", color: "#111111" }, label),
      h(Button, { onClick: () => setN(String(Number(n) + 1)) }, "Increment"),
    );
  };
}

function StatusRow(api, label, detail) {
  const { createElement: h, View, Text } = api;
  return h(
    View,
    {
      flexDirection: "row",
      gap: "8px",
      padding: "8px 0",
      alignItems: "center",
    },
    h(Text, { fontSize: "13px", fontWeight: "bold", color: "#0f172a" }, label),
    h(Text, { fontSize: "13px", color: "#64748b" }, detail),
  );
}

module.exports = { CounterCard, StatusRow };
