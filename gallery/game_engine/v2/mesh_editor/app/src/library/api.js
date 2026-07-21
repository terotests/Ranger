// ============================================================================
// api.js — browser client for the Vite library middleware (local folder DB).
// ============================================================================

const BASE = "/api/library";

async function req(path, opts) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { error: text };
  }
  if (!res.ok) {
    const err = new Error(body?.error || res.statusText || "request failed");
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export async function libraryMeta() {
  return req("/meta");
}

export async function listLibrary() {
  return req("");
}

export async function loadProject(slug) {
  return req("/" + encodeURIComponent(slug));
}

export async function saveProject(slug, doc) {
  return req("/" + encodeURIComponent(slug), {
    method: "PUT",
    body: JSON.stringify(doc),
  });
}

export async function createProject(payload) {
  return req("", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(slug) {
  return req("/" + encodeURIComponent(slug), { method: "DELETE" });
}

/** True when the Vite library middleware answers. */
export async function libraryAvailable() {
  try {
    await libraryMeta();
    return true;
  } catch {
    return false;
  }
}
