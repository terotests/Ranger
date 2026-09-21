/// <reference types="vite/client" />

declare global {
  const __RANGER_VERSION__: string;
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
