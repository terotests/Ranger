#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Dumb HTTPS pipe for Git smart HTTP. All Git framing lives in Ranger;
// this file only GETs and POSTs bytes. Public repos, no credentials.

import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";

function toGitUrl(raw) {
  let u = raw.trim();
  if (u.startsWith("git@")) {
    const rest = u.slice(4);
    const colon = rest.indexOf(":");
    if (colon > 0) {
      u = "https://" + rest.slice(0, colon) + "/" + rest.slice(colon + 1);
    }
  }
  if (!u.endsWith(".git")) {
    u = u + ".git";
  }
  if (u.endsWith("/")) {
    u = u.slice(0, -1);
  }
  return u;
}

function fetchBytes(url, { method = "GET", body, contentType } = {}) {
  return new Promise((resolve, reject) => {
    const go = (target, hops) => {
      if (hops > 8) {
        reject(new Error("too many redirects"));
        return;
      }
      const u = new URL(target);
      const lib = u.protocol === "http:" ? httpRequest : httpsRequest;
      const req = lib(
        {
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port || (u.protocol === "http:" ? 80 : 443),
          path: u.pathname + u.search,
          method,
          headers: {
            "User-Agent": "git/2.43.0 ranger-pkg/0.1",
            Accept: contentType
              ? "application/x-git-upload-pack-result"
              : "application/x-git-upload-pack-advertisement",
            ...(body
              ? {
                  "Content-Type": contentType,
                  "Content-Length": String(body.length),
                }
              : {}),
          },
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const buf = Buffer.concat(chunks);
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              go(new URL(res.headers.location, target).toString(), hops + 1);
              return;
            }
            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(new Error(`HTTP ${res.statusCode} ${target}\n${buf.slice(0, 400)}`));
              return;
            }
            resolve(buf);
          });
        }
      );
      req.on("error", reject);
      if (body) {
        req.write(body);
      }
      req.end();
    };
    go(url, 0);
  });
}

const cmd = process.argv[2];
const url = process.argv[3] ? toGitUrl(process.argv[3]) : "";

if (cmd === "advertise" && url) {
  const buf = await fetchBytes(url + "/info/refs?service=git-upload-pack");
  const out = process.argv[4];
  if (out) {
    writeFileSync(out, buf);
  } else {
    process.stdout.write(buf);
  }
  process.exit(0);
}

if (cmd === "post" && url) {
  const reqFile = process.argv[4];
  const out = process.argv[5];
  const body = readFileSync(reqFile);
  const buf = await fetchBytes(url + "/git-upload-pack", {
    method: "POST",
    body,
    contentType: "application/x-git-upload-pack-request",
  });
  if (out) {
    writeFileSync(out, buf);
  } else {
    process.stdout.write(buf);
  }
  process.exit(0);
}

console.error(`usage:
  git-http.mjs advertise <git-url> [out.bin]
  git-http.mjs post <git-url> <want.bin> [out.bin]`);
process.exit(2);
