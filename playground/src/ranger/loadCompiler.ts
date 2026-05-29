import "./nodeShim.js";
import type { CompileEnvDict } from "./types.js";

let loadPromise: Promise<void> | null = null;

export function loadRangerCompiler(): Promise<void> {
  if (typeof VirtualCompiler !== "undefined") {
    return Promise.resolve();
  }
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${import.meta.env.BASE_URL}ranger-compiler.js`;
      script.async = true;
      script.onload = () => {
        if (typeof VirtualCompiler === "undefined") {
          reject(new Error("ranger-compiler.js loaded but VirtualCompiler is missing"));
          return;
        }
        resolve();
      };
      script.onerror = () =>
        reject(
          new Error(
            "Failed to load ranger-compiler.js — run `npm run build:compiler` in playground/",
          ),
        );
      document.head.appendChild(script);
    });
  }
  return loadPromise;
}

let envPromise: Promise<CompileEnvDict> | null = null;

export function loadCompileEnv(): Promise<CompileEnvDict> {
  if (!envPromise) {
    envPromise = fetch(`${import.meta.env.BASE_URL}compileEnv.json`).then((r) => {
      if (!r.ok) {
        throw new Error(`compileEnv.json: ${r.status}`);
      }
      return r.json() as Promise<CompileEnvDict>;
    });
  }
  return envPromise;
}
