/// <reference types="vite/client" />

import type { InputEnvInstance, RangerAppWriterContext } from "./ranger/types.js";

declare global {
  const InputEnv: {
    new (): InputEnvInstance;
    fromDictionary(dict: import("./ranger/types.js").CompileEnvDict): Promise<InputEnvInstance>;
  };
  const VirtualCompiler: {
    new (): { run(env: InputEnvInstance): Promise<import("./ranger/types.js").CompilerResults> };
    displayCompilerErrors(ctx: RangerAppWriterContext): void;
  };
  const CmdParams: {
    new (): import("./ranger/types.js").CmdParamsInstance;
  };
}

export {};
