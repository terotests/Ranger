export interface CompileEnvDict {
  use_real: boolean;
  envVars: Record<string, string>;
  commandLine: {
    flags: Record<string, boolean>;
    params: Record<string, string>;
    values: string[];
  };
  filesystem: {
    name: string;
    data: string;
    is_folder: boolean;
    base64bin: boolean;
    folders: CompileEnvDict["filesystem"][];
    files: { name: string; data: string; is_folder: boolean; base64bin: boolean }[];
  };
}

export interface RangerCompilerMessage {
  description: string;
  node: {
    getFilename(): string;
    getLine(): number;
    getLineString(line: number): string;
    getColStartString(): string;
  };
}

export interface RangerAppWriterContext {
  compilerErrors: RangerCompilerMessage[];
}

export interface CompilerResults {
  hasErrors: boolean;
  errorMessage: string;
  ctx?: RangerAppWriterContext;
  fileSystem?: {
    files: { path_name: string; name: string; getCode(): string }[];
  };
}

export interface InputEnvInstance {
  use_real: boolean;
  commandLine: CmdParamsInstance;
}

export interface CmdParamsInstance {
  flags: Record<string, boolean>;
  params: Record<string, string>;
  values: string[];
}
