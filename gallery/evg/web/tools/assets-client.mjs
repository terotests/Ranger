// SPDX-License-Identifier: AGPL-3.0-or-later
//
// THE REQUEST WAS ALREADY MADE.
//
// A page built with `inline-assets.mjs` starts every asset it knows it will
// need — its fonts, its catalogues, the document it opens on — in a few
// synchronous lines in the head, before the body is parsed and long before
// the application's module has arrived. This is the other half: a module that
// picks up those responses by name instead of asking for them again.
//
// What it is worth, on the PowerPoint editor: fetching them in a queue after
// the engine had loaded put the first frame at 4813 ms; starting them in the
// head put it at 2786. Nothing about the old order was necessary — none of
// those requests needs any code to be running.
//
// A page that has no head-started assets (a source directory opened directly,
// an editor's preview) still works: it asks, as it always did.

/** The window's asset table, or an empty one. */
const table = () => (typeof window === "undefined" ? {} : window.__evgAssets || {});

/**
 * The response for an asset, started in the head if it was.
 *
 * A CLONE, never the stored response itself: a body can be read once, and a
 * page that reads one twice — an editor opening the deck it boots on, and
 * again to prove it can reopen what it saved — gets "body stream already
 * read" for the second. The stored response is never consumed, so the clone
 * always succeeds.
 */
export function responseFor(path) {
  const name = String(path).replace(/^\.\//, "");
  const started = table()[name];
  if (started) {
    return Promise.resolve(started).then((r) => (r instanceof Error ? r : r.clone()));
  }
  return fetch("./" + name);
}

/** An ArrayBuffer the Ranger runtime can read: it wants a DataView beside it. */
export function asRangerBuffer(ab) {
  ab._view = new DataView(ab);
  return ab;
}

/** An asset as bytes, throwing what the fetch threw rather than a 200 with no body. */
export async function bytesOf(path) {
  const res = await responseFor(path);
  if (res instanceof Error) throw res;
  if (!res.ok) throw new Error(path + " → " + res.status);
  return asRangerBuffer(await res.arrayBuffer());
}

/** An asset as text, for a catalogue or a stylesheet. */
export async function textOf(path) {
  const res = await responseFor(path);
  if (res instanceof Error) throw res;
  if (!res.ok) throw new Error(path + " → " + res.status);
  return res.text();
}
