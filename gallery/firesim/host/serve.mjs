#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The simulator on a socket, for the clients that need one.
//
//   npm run firesim:serve
//   npm run firesim:serve -- --port 8080 --seed gallery/realtrainer/fixtures/reference/seed.json \
//                            --rules gallery/firesim/fixtures/realtrainer.rules \
//                            --user test@example.com:testpassword123 --latency 120
//
// This is what an Android emulator, an iOS simulator, a browser page or a
// device on the same network talks to. Nothing about it is different from the
// in-process simulator except that the bytes go through a socket: the same
// store, the same rules, the same accounts.
//
//   --port N          0 picks a free one and prints it            (default 8080)
//   --project ID      the project id in the URLs         (default demo-firesim)
//   --database ID     the database id                        (default (default))
//   --rules FILE      a firestore.rules file
//   --no-rules        allow everything, for a first run
//   --seed FILE       a seed, loaded as the user given by --user
//   --user  a@b:pass  an account to create, repeatable
//   --latency MS      the wait on every call                       (default 120)
//   --jitter MS       spread around it                               (default 0)
//   --time-scale N    how fast a streamed answer really arrives      (default 1)
//   --page            also serve gallery/firesim/web (the inspector)

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createSim } from "./firesim.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..");
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const all = (name) => argv.map((a, i) => (a === name ? argv[i + 1] : null)).filter(Boolean);
const has = (name) => argv.includes(name);

const PORT = Number(flag("--port", "8080"));
const rulesFile = flag("--rules", "");
const seedFile = flag("--seed", "");
const users = all("--user");
const withPage = has("--page");

const sim = createSim({
  projectId: flag("--project", "demo-firesim"),
  databaseId: flag("--database", "(default)"),
  rules: rulesFile ? fs.readFileSync(path.resolve(rulesFile), "utf8") : undefined,
  rulesEnabled: !has("--no-rules"),
  latency: { baseMs: Number(flag("--latency", "120")), jitterMs: Number(flag("--jitter", "0")) },
});

const created = [];
for (const spec of users) {
  const cut = spec.indexOf(":");
  const email = cut < 0 ? spec : spec.slice(0, cut);
  const password = cut < 0 ? "password1" : spec.slice(cut + 1);
  created.push({ email, ...sim.signUp(email, password, email.split("@")[0]) });
}
if (seedFile) {
  const owner = created[0]?.uid ?? "";
  const n = sim.seedFile(path.resolve(seedFile), { ownerUid: owner });
  process.stdout.write(`  seeded ${n} documents${owner ? ` owned by ${owner}` : ""}\n`);
}

const host = await sim.listen(PORT, { timeScale: Number(flag("--time-scale", "1")) });
process.stdout.write(`\n  firesim on ${host.url}\n`);
process.stdout.write(`    project  ${sim.server.projectId}   database ${sim.server.databaseId}\n`);
process.stdout.write(`    rules    ${sim.server.rulesEnabled ? rulesFile || "the default (any signed-in caller)" : "OFF — everything is allowed"}\n`);
for (const u of created) process.stdout.write(`    account  ${u.email}  uid ${u.uid}\n`);
process.stdout.write(`\n    documents  ${host.url}/v1/projects/${sim.server.projectId}/databases/${sim.server.databaseId}/documents/…\n`);
process.stdout.write(`    accounts   ${host.url}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword\n`);
process.stdout.write(`    state      ${host.url}/firesim/v1/state\n`);
process.stdout.write(`    the model  ${host.url}/ai/v1/chat:stream\n`);

// The inspector page, when asked for: a second server so the API server stays
// exactly the API and nothing else.
if (withPage) {
  const web = path.join(MODULE, "web");
  const bundle = path.join(web, "firesim.browser.js");
  if (!fs.existsSync(bundle)) {
    process.stdout.write(`\n  the page is not built — run: node gallery/firesim/web/build.mjs\n`);
  } else {
    const pageServer = http.createServer((req, res) => {
      const name = req.url === "/" ? "/index.html" : req.url.split("?")[0];
      const file = path.join(web, path.normalize(name).replace(/^(\.\.[/\\])+/, ""));
      if (!file.startsWith(web) || !fs.existsSync(file)) {
        res.writeHead(404).end("not found");
        return;
      }
      const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
      res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "text/plain" });
      res.end(fs.readFileSync(file));
    });
    await new Promise((done) => pageServer.listen(PORT ? PORT + 1 : 0, done));
    process.stdout.write(`\n  the inspector on http://127.0.0.1:${pageServer.address().port}/\n`);
  }
}
process.stdout.write("\n  ctrl-c to stop\n\n");
