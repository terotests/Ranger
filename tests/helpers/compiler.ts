import { execSync, exec } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

// Get the directory where this file is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const COMPILER_DIR = path.join(ROOT_DIR, "compiler");
const LIB_DIR = path.join(ROOT_DIR, "lib");
const LANG_FILE = path.join(COMPILER_DIR, "Lang.clj");
const STDOPS_FILE = path.join(LIB_DIR, "stdops.clj");
const STDLIB_FILE = path.join(LIB_DIR, "stdlib.clj");
const OUTPUT_JS = path.join(ROOT_DIR, "bin", "output.js");
const TEMP_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output");
const GO_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-go");
const PYTHON_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-python");

export interface CompileResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface RunResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Compile a Ranger source file to ES6 JavaScript
 * Each source file gets its own unique output file to avoid conflicts
 */
export function compileRanger(
  sourceFile: string,
  outputDir?: string
): CompileResult {
  // Use relative path if not absolute
  const sourcePath = path.isAbsolute(sourceFile)
    ? sourceFile
    : `./${sourceFile.replace(/\\/g, "/")}`;

  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);

  if (!fs.existsSync(absoluteSource)) {
    return {
      success: false,
      output: "",
      error: `Source file not found: ${absoluteSource}`,
    };
  }

  // Create unique output filename based on source file name
  const sourceBasename = path.basename(absoluteSource, ".clj");
  const outputFile = `${sourceBasename}.js`;
  const targetDir = outputDir || TEMP_OUTPUT_DIR;

  // Ensure output directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    // Set environment and run compiler
    // Use relative paths for RANGER_LIB since compiler expects them
    const env = {
      ...process.env,
      RANGER_LIB: `./compiler/Lang.clj;./lib/stdops.clj`,
    };

    // Convert targetDir to relative path for the compiler (it prepends cwd internally)
    const relativeTargetDir = path
      .relative(ROOT_DIR, targetDir)
      .replace(/\\/g, "/");

    // Use relative source path for compiler
    const cmd = `node "${OUTPUT_JS}" -es6 "${sourcePath}" -nodecli -d="${relativeTargetDir}" -o="${outputFile}"`;

    const output = execSync(cmd, {
      cwd: ROOT_DIR,
      env,
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Check if compilation succeeded (no error messages in stdout)
    const outputStr = output.toString();
    const hasError =
      outputStr.includes("TypeError:") ||
      outputStr.includes("Got unknown compiler error") ||
      outputStr.includes("Undefined variable") ||
      outputStr.includes("invalid variable definition");

    return {
      success: !hasError,
      output: outputStr,
      error: hasError ? outputStr : undefined,
    };
  } catch (err: any) {
    // execSync throws on non-zero exit code
    const stdout = err.stdout?.toString() || "";
    const stderr = err.stderr?.toString() || "";
    const combined = stdout + stderr;

    return {
      success: false,
      output: stdout,
      error: combined || err.message,
    };
  }
}

/**
 * Run a compiled JavaScript file and capture output
 */
export function runCompiledJS(jsFile: string): RunResult {
  const absoluteJS = path.isAbsolute(jsFile)
    ? jsFile
    : path.join(ROOT_DIR, jsFile);

  if (!fs.existsSync(absoluteJS)) {
    return {
      success: false,
      output: "",
      error: `JS file not found: ${absoluteJS}`,
    };
  }

  try {
    const output = execSync(`node "${absoluteJS}"`, {
      cwd: ROOT_DIR,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    return {
      success: true,
      output: output.trim(),
    };
  } catch (err: any) {
    return {
      success: false,
      output: err.stdout || "",
      error: err.stderr || err.message,
    };
  }
}

/**
 * Compile and run a Ranger source file
 * Returns the output of the compiled program
 */
export function compileAndRun(sourceFile: string): {
  compile: CompileResult;
  run?: RunResult;
} {
  const compileResult = compileRanger(sourceFile);

  if (!compileResult.success) {
    return { compile: compileResult };
  }

  // Determine output JS location (now in TEMP_OUTPUT_DIR with unique filename)
  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);
  const sourceBasename = path.basename(absoluteSource, ".clj");
  const outputJS = path.join(TEMP_OUTPUT_DIR, `${sourceBasename}.js`);

  // Check if file was actually created
  if (!fs.existsSync(outputJS)) {
    return {
      compile: compileResult,
      run: {
        success: false,
        output: "",
        error: `Compiled JS file not found: ${outputJS}. Compile output: ${compileResult.output}`,
      },
    };
  }

  const runResult = runCompiledJS(outputJS);

  return {
    compile: compileResult,
    run: runResult,
  };
}

/**
 * Check if compilation fails with expected error
 */
export function expectCompileError(
  sourceFile: string,
  expectedError?: string
): CompileResult {
  const result = compileRanger(sourceFile);

  if (result.success) {
    throw new Error(
      `Expected compilation to fail for ${sourceFile}, but it succeeded`
    );
  }

  if (expectedError && !result.error?.includes(expectedError)) {
    throw new Error(
      `Expected error containing "${expectedError}", got: ${result.error}`
    );
  }

  return result;
}

/**
 * Check that compilation succeeds and program produces expected output
 */
export function expectOutput(
  sourceFile: string,
  expectedOutput: string | string[]
): RunResult {
  const { compile, run } = compileAndRun(sourceFile);

  if (!compile.success) {
    throw new Error(`Compilation failed: ${compile.error}`);
  }

  if (!run) {
    throw new Error("No run result");
  }

  if (!run.success) {
    throw new Error(`Runtime error: ${run.error}`);
  }

  const expected = Array.isArray(expectedOutput)
    ? expectedOutput.join("\n")
    : expectedOutput;

  if (!run.output.includes(expected)) {
    throw new Error(
      `Expected output to contain "${expected}", got: "${run.output}"`
    );
  }

  return run;
}

/**
 * Check if Go is available on the system
 */
export function isGoAvailable(): boolean {
  try {
    execSync("go version", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Compile a Ranger source file to Go
 */
export function compileRangerToGo(
  sourceFile: string,
  outputDir?: string
): CompileResult {
  // Use relative path if not absolute
  const sourcePath = path.isAbsolute(sourceFile)
    ? sourceFile
    : `./${sourceFile.replace(/\\/g, "/")}`;

  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);

  if (!fs.existsSync(absoluteSource)) {
    return {
      success: false,
      output: "",
      error: `Source file not found: ${absoluteSource}`,
    };
  }

  // Create unique output filename based on source file name
  const sourceBasename = path.basename(absoluteSource, ".clj");
  const outputFile = `${sourceBasename}.go`;
  const targetDir = outputDir || GO_OUTPUT_DIR;

  // Ensure output directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    // Set environment and run compiler
    const env = {
      ...process.env,
      RANGER_LIB: `./compiler/Lang.clj;./lib/stdops.clj`,
    };

    // Convert targetDir to relative path for the compiler
    const relativeTargetDir = path
      .relative(ROOT_DIR, targetDir)
      .replace(/\\/g, "/");

    // Use -l=go flag for Go output
    const cmd = `node "${OUTPUT_JS}" -l=go "${sourcePath}" -d="${relativeTargetDir}" -o="${outputFile}"`;

    const output = execSync(cmd, {
      cwd: ROOT_DIR,
      env,
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Check if compilation succeeded
    const outputStr = output.toString();
    const hasError =
      outputStr.includes("TypeError:") ||
      outputStr.includes("Got unknown compiler error") ||
      outputStr.includes("Undefined variable") ||
      outputStr.includes("invalid variable definition");

    return {
      success: !hasError,
      output: outputStr,
      error: hasError ? outputStr : undefined,
    };
  } catch (err: any) {
    const stdout = err.stdout?.toString() || "";
    const stderr = err.stderr?.toString() || "";
    const combined = stdout + stderr;

    return {
      success: false,
      output: stdout,
      error: combined || err.message,
    };
  }
}

/**
 * Build and run a compiled Go file
 */
export function runCompiledGo(goFile: string): RunResult {
  const absoluteGo = path.isAbsolute(goFile)
    ? goFile
    : path.join(ROOT_DIR, goFile);

  if (!fs.existsSync(absoluteGo)) {
    return {
      success: false,
      output: "",
      error: `Go file not found: ${absoluteGo}`,
    };
  }

  const goDir = path.dirname(absoluteGo);
  const goBasename = path.basename(absoluteGo, ".go");
  const exeFile = path.join(goDir, `${goBasename}.exe`);

  try {
    // Build the Go file
    execSync(`go build -o "${exeFile}" "${absoluteGo}"`, {
      cwd: goDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Run the compiled executable
    const output = execSync(`"${exeFile}"`, {
      cwd: goDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Clean up executable
    try {
      fs.unlinkSync(exeFile);
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: true,
      output: output.trim(),
    };
  } catch (err: any) {
    // Clean up executable on error too
    try {
      if (fs.existsSync(exeFile)) {
        fs.unlinkSync(exeFile);
      }
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: false,
      output: err.stdout || "",
      error: err.stderr || err.message,
    };
  }
}

/**
 * Compile and run a Ranger source file as Go
 */
export function compileAndRunGo(sourceFile: string): {
  compile: CompileResult;
  run?: RunResult;
} {
  const compileResult = compileRangerToGo(sourceFile);

  if (!compileResult.success) {
    return { compile: compileResult };
  }

  // Determine output Go location
  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);
  const sourceBasename = path.basename(absoluteSource, ".clj");
  const outputGo = path.join(GO_OUTPUT_DIR, `${sourceBasename}.go`);

  // Check if file was actually created
  if (!fs.existsSync(outputGo)) {
    return {
      compile: compileResult,
      run: {
        success: false,
        output: "",
        error: `Compiled Go file not found: ${outputGo}. Compile output: ${compileResult.output}`,
      },
    };
  }

  const runResult = runCompiledGo(outputGo);

  return {
    compile: compileResult,
    run: runResult,
  };
}

/**
 * Check that Go compilation succeeds and program produces expected output
 */
export function expectGoOutput(
  sourceFile: string,
  expectedOutput: string | string[]
): RunResult {
  const { compile, run } = compileAndRunGo(sourceFile);

  if (!compile.success) {
    throw new Error(`Go compilation failed: ${compile.error}`);
  }

  if (!run) {
    throw new Error("No run result");
  }

  if (!run.success) {
    throw new Error(`Go runtime error: ${run.error}`);
  }

  const expected = Array.isArray(expectedOutput)
    ? expectedOutput.join("\n")
    : expectedOutput;

  if (!run.output.includes(expected)) {
    throw new Error(
      `Expected output to contain "${expected}", got: "${run.output}"`
    );
  }

  return run;
}

// ============================================================================
// Python compilation and execution helpers
// ============================================================================

/**
 * Check if Python is available on the system
 */
export function isPythonAvailable(): boolean {
  try {
    execSync("python --version", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    // Try python3 on some systems
    try {
      execSync("python3 --version", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Get the Python command (python or python3)
 */
function getPythonCommand(): string {
  try {
    execSync("python --version", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return "python";
  } catch {
    return "python3";
  }
}

/**
 * Compile a Ranger source file to Python
 */
export function compileRangerToPython(
  sourceFile: string,
  outputDir?: string
): CompileResult {
  // Use relative path if not absolute
  const sourcePath = path.isAbsolute(sourceFile)
    ? sourceFile
    : `./${sourceFile.replace(/\\/g, "/")}`;

  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);

  if (!fs.existsSync(absoluteSource)) {
    return {
      success: false,
      output: "",
      error: `Source file not found: ${absoluteSource}`,
    };
  }

  // Create unique output filename based on source file name
  const sourceBasename = path.basename(absoluteSource, ".clj");
  const outputFile = `${sourceBasename}.py`;
  const targetDir = outputDir || PYTHON_OUTPUT_DIR;

  // Ensure output directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    // Set environment and run compiler
    const env = {
      ...process.env,
      RANGER_LIB: `./compiler/Lang.clj;./lib/stdops.clj`,
    };

    // Convert targetDir to relative path for the compiler
    const relativeTargetDir = path
      .relative(ROOT_DIR, targetDir)
      .replace(/\\/g, "/");

    // Use -l=python flag for Python output
    const cmd = `node "${OUTPUT_JS}" -l=python "${sourcePath}" -d="${relativeTargetDir}" -o="${outputFile}"`;

    const output = execSync(cmd, {
      cwd: ROOT_DIR,
      env,
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Check if compilation succeeded
    const outputStr = output.toString();
    const hasError =
      outputStr.includes("TypeError:") ||
      outputStr.includes("Got unknown compiler error") ||
      outputStr.includes("Undefined variable") ||
      outputStr.includes("invalid variable definition");

    return {
      success: !hasError,
      output: outputStr,
      error: hasError ? outputStr : undefined,
    };
  } catch (err: any) {
    const stdout = err.stdout?.toString() || "";
    const stderr = err.stderr?.toString() || "";
    const combined = stdout + stderr;

    return {
      success: false,
      output: stdout,
      error: combined || err.message,
    };
  }
}

/**
 * Run a compiled Python file
 */
export function runCompiledPython(pyFile: string): RunResult {
  const absolutePy = path.isAbsolute(pyFile)
    ? pyFile
    : path.join(ROOT_DIR, pyFile);

  if (!fs.existsSync(absolutePy)) {
    return {
      success: false,
      output: "",
      error: `Python file not found: ${absolutePy}`,
    };
  }

  const pythonCmd = getPythonCommand();

  try {
    const output = execSync(`${pythonCmd} "${absolutePy}"`, {
      cwd: path.dirname(absolutePy),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    return {
      success: true,
      output: output.trim(),
    };
  } catch (err: any) {
    return {
      success: false,
      output: err.stdout || "",
      error: err.stderr || err.message,
    };
  }
}

/**
 * Compile and run a Ranger source file as Python
 */
export function compileAndRunPython(sourceFile: string): {
  compile: CompileResult;
  run?: RunResult;
} {
  const compileResult = compileRangerToPython(sourceFile);

  if (!compileResult.success) {
    return { compile: compileResult };
  }

  // Determine output Python location
  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);
  const sourceBasename = path.basename(absoluteSource, ".clj");
  const outputPy = path.join(PYTHON_OUTPUT_DIR, `${sourceBasename}.py`);

  // Check if file was actually created
  if (!fs.existsSync(outputPy)) {
    return {
      compile: compileResult,
      run: {
        success: false,
        output: "",
        error: `Compiled Python file not found: ${outputPy}. Compile output: ${compileResult.output}`,
      },
    };
  }

  const runResult = runCompiledPython(outputPy);

  return {
    compile: compileResult,
    run: runResult,
  };
}

/**
 * Check that Python compilation succeeds and program produces expected output
 */
export function expectPythonOutput(
  sourceFile: string,
  expectedOutput: string | string[]
): RunResult {
  const { compile, run } = compileAndRunPython(sourceFile);

  if (!compile.success) {
    throw new Error(`Python compilation failed: ${compile.error}`);
  }

  if (!run) {
    throw new Error("No run result");
  }

  if (!run.success) {
    throw new Error(`Python runtime error: ${run.error}`);
  }

  const expected = Array.isArray(expectedOutput)
    ? expectedOutput.join("\n")
    : expectedOutput;

  if (!run.output.includes(expected)) {
    throw new Error(
      `Expected output to contain "${expected}", got: "${run.output}"`
    );
  }

  return run;
}
