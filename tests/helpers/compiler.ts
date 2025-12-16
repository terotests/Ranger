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
const LANG_FILE = path.join(COMPILER_DIR, "Lang.rgr");
const STDOPS_FILE = path.join(LIB_DIR, "stdops.rgr");
const STDLIB_FILE = path.join(LIB_DIR, "stdlib.rgr");
const OUTPUT_JS = path.join(ROOT_DIR, "bin", "output.js");
const TEMP_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output");
const GO_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-go");
const PYTHON_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-python");
const RUST_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-rust");

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
 * Compile a Ranger source file to ES6 JavaScript (or other targets)
 * Each source file gets its own unique output file to avoid conflicts
 */
export function compileRanger(
  sourceFile: string,
  language?: string,
  outputDir?: string
): CompileResult {
  // Handle old signature: compileRanger(source, outputDir)
  if (
    language &&
    ![
      "es6",
      "cpp",
      "go",
      "python",
      "rust",
      "kotlin",
      "swift6",
      "java7",
    ].includes(language)
  ) {
    // Assume it's outputDir from old signature
    outputDir = language;
    language = "es6";
  }

  const targetLang = language || "es6";

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

  // Create unique output filename based on source file name and target
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );

  // Determine file extension based on language
  const extMap: Record<string, string> = {
    es6: ".js",
    cpp: ".cpp",
    go: ".go",
    python: ".py",
    rust: ".rs",
    kotlin: ".kt",
    swift6: ".swift",
    java7: ".java",
  };
  const ext = extMap[targetLang] || ".js";
  const outputFile = `${sourceBasename}${ext}`;
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
      RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr`,
    };

    // Convert targetDir to relative path for the compiler (it prepends cwd internally)
    const relativeTargetDir = path
      .relative(ROOT_DIR, targetDir)
      .replace(/\\/g, "/");

    // Use relative source path for compiler
    // Use -l= flag for non-es6 targets, -es6 for JavaScript
    const langFlag = targetLang === "es6" ? "-es6" : `-l=${targetLang}`;
    const cmd = `node "${OUTPUT_JS}" ${langFlag} "${sourcePath}" -nodecli -d="${relativeTargetDir}" -o="${outputFile}"`;

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
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
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
 * Compile a Ranger source file as a CommonJS module
 * This uses the -nodemodule flag to export classes
 */
export function compileRangerModule(
  sourceFile: string,
  outputDir: string,
  outputFile: string
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

  // Ensure output directory exists
  const absoluteOutputDir = path.isAbsolute(outputDir)
    ? outputDir
    : path.join(ROOT_DIR, outputDir);
  if (!fs.existsSync(absoluteOutputDir)) {
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
  }

  try {
    // Set environment - use Lang.rgr only (no stdops) for ts_parser
    const env = {
      ...process.env,
      RANGER_LIB: `./compiler/Lang.rgr`,
    };

    // Convert targetDir to relative path for the compiler
    const relativeTargetDir = path
      .relative(ROOT_DIR, absoluteOutputDir)
      .replace(/\\/g, "/");

    // Compile as module with -nodemodule flag
    const cmd = `node "${OUTPUT_JS}" -es6 -nodemodule "${sourcePath}" -d="${relativeTargetDir}" -o="${outputFile}"`;

    const output = execSync(cmd, {
      cwd: ROOT_DIR,
      env,
      encoding: "utf-8",
      timeout: 60000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Check if compilation succeeded
    const outputStr = output.toString();
    const hasError =
      outputStr.includes("TypeError:") ||
      outputStr.includes("Got unknown compiler error") ||
      outputStr.includes("Undefined variable") ||
      outputStr.includes("invalid variable definition");

    if (!hasError) {
      // Ranger compiler adds .js extension, so copy to the correct .cjs filename
      const compiledFile = path.join(absoluteOutputDir, `${outputFile}.js`);
      const targetFile = path.join(absoluteOutputDir, outputFile);
      if (fs.existsSync(compiledFile) && outputFile.endsWith(".cjs")) {
        fs.copyFileSync(compiledFile, targetFile);
      }
    }

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

// ============================================================================
// Kotlin compilation and execution helpers
// ============================================================================

const KOTLIN_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-kotlin");

/**
 * Check if Kotlin compiler is available on the system
 */
export function isKotlinAvailable(): boolean {
  try {
    execSync("kotlinc -version", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Compile a Ranger source file to Kotlin
 */
export function compileRangerToKotlin(
  sourceFile: string,
  outputDir?: string
): CompileResult {
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

  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
  const outputFile = `${sourceBasename}.kt`;
  const targetDir = outputDir || KOTLIN_OUTPUT_DIR;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    const env = {
      ...process.env,
      RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr`,
    };

    const relativeTargetDir = path
      .relative(ROOT_DIR, targetDir)
      .replace(/\\/g, "/");

    const cmd = `node "${OUTPUT_JS}" -l=kotlin "${sourcePath}" -d="${relativeTargetDir}" -o="${outputFile}"`;

    const output = execSync(cmd, {
      cwd: ROOT_DIR,
      env,
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });

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
 * Build and run a compiled Kotlin file
 */
export function runCompiledKotlin(ktFile: string): RunResult {
  const absoluteKt = path.isAbsolute(ktFile)
    ? ktFile
    : path.join(ROOT_DIR, ktFile);

  if (!fs.existsSync(absoluteKt)) {
    return {
      success: false,
      output: "",
      error: `Kotlin file not found: ${absoluteKt}`,
    };
  }

  const ktDir = path.dirname(absoluteKt);
  const ktBasename = path.basename(absoluteKt, ".kt");
  const jarFile = path.join(ktDir, `${ktBasename}.jar`);

  try {
    // Compile the Kotlin file to JAR
    execSync(`kotlinc "${absoluteKt}" -include-runtime -d "${jarFile}"`, {
      cwd: ktDir,
      encoding: "utf-8",
      timeout: 120000, // Kotlin compilation can be slow
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Run the compiled JAR
    const output = execSync(`java -jar "${jarFile}"`, {
      cwd: ktDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Clean up JAR
    try {
      fs.unlinkSync(jarFile);
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: true,
      output: output.trim(),
    };
  } catch (err: any) {
    // Clean up JAR on error too
    try {
      if (fs.existsSync(jarFile)) {
        fs.unlinkSync(jarFile);
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
 * Compile and run a Ranger source file as Kotlin
 */
export function compileAndRunKotlin(sourceFile: string): {
  compile: CompileResult;
  run?: RunResult;
} {
  const compileResult = compileRangerToKotlin(sourceFile);

  if (!compileResult.success) {
    return { compile: compileResult };
  }

  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
  const outputKt = path.join(KOTLIN_OUTPUT_DIR, `${sourceBasename}.kt`);

  if (!fs.existsSync(outputKt)) {
    return {
      compile: compileResult,
      run: {
        success: false,
        output: "",
        error: `Compiled Kotlin file not found: ${outputKt}. Compile output: ${compileResult.output}`,
      },
    };
  }

  const runResult = runCompiledKotlin(outputKt);

  return {
    compile: compileResult,
    run: runResult,
  };
}

/**
 * Check that Kotlin compilation succeeds and program produces expected output
 */
export function expectKotlinOutput(
  sourceFile: string,
  expectedOutput: string | string[]
): RunResult {
  const { compile, run } = compileAndRunKotlin(sourceFile);

  if (!compile.success) {
    throw new Error(`Kotlin compilation failed: ${compile.error}`);
  }

  if (!run) {
    throw new Error("No run result");
  }

  if (!run.success) {
    throw new Error(`Kotlin runtime error: ${run.error}`);
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
// Go compilation and execution helpers
// ============================================================================

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
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
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
      RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr`,
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
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
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
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
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
      RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr`,
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
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
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

// ==================== RUST SUPPORT ====================

/**
 * Check if Rust compiler (rustc) is available
 */
export function isRustAvailable(): boolean {
  try {
    execSync("rustc --version", { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Compile a Ranger source file to Rust
 */
export function compileRangerToRust(
  sourceFile: string,
  outputDir?: string
): CompileResult {
  // Use relative path if not absolute (same pattern as compileRanger)
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
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
  const outputFile = `${sourceBasename}.rs`;
  const targetDir = outputDir || RUST_OUTPUT_DIR;

  // Ensure output directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    // Set environment and run compiler
    const env = {
      ...process.env,
      RANGER_LIB: `./compiler/Lang.rgr;./lib/stdops.rgr`,
    };

    // Convert targetDir to relative path for the compiler
    const relativeTargetDir = path
      .relative(ROOT_DIR, targetDir)
      .replace(/\\/g, "/");

    // Use -l=rust flag for Rust output
    const cmd = `node "${OUTPUT_JS}" -l=rust "${sourcePath}" -d="${relativeTargetDir}" -o="${outputFile}"`;

    const output = execSync(cmd, {
      cwd: ROOT_DIR,
      env,
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const outputPath = path.join(targetDir, outputFile);

    // Check if file was created in target directory
    if (!fs.existsSync(outputPath)) {
      // The compiler may have placed it in the source directory or tests directory
      // Check alternate locations and move it
      const alternateLocations = [
        path.join(path.dirname(absoluteSource), outputFile),
        path.join(path.dirname(absoluteSource), "bin", outputFile),
        path.join(ROOT_DIR, "tests", outputFile),
        path.join(ROOT_DIR, "tests", "fixtures", "bin", outputFile),
        path.join(ROOT_DIR, outputFile),
      ];

      for (const altPath of alternateLocations) {
        if (fs.existsSync(altPath)) {
          // Move file to target directory
          fs.copyFileSync(altPath, outputPath);
          fs.unlinkSync(altPath);
          break;
        }
      }
    }

    if (!fs.existsSync(outputPath)) {
      return {
        success: false,
        output,
        error: `Output file not created: ${outputPath}`,
      };
    }

    return {
      success: true,
      output,
    };
  } catch (error: unknown) {
    const execError = error as { stderr?: string; message?: string };
    return {
      success: false,
      output: "",
      error: execError.stderr || execError.message || "Unknown error",
    };
  }
}

/**
 * Compile and run a Rust file
 */
export function runRustFile(rustFile: string): RunResult {
  const absolutePath = path.isAbsolute(rustFile)
    ? rustFile
    : path.join(ROOT_DIR, rustFile);

  if (!fs.existsSync(absolutePath)) {
    return {
      success: false,
      output: "",
      error: `Rust file not found: ${absolutePath}`,
    };
  }

  try {
    // Compile the Rust file
    const exeFile = absolutePath.replace(".rs", ".exe");
    const compileCmd = `rustc "${absolutePath}" -o "${exeFile}"`;

    execSync(compileCmd, {
      encoding: "utf-8",
      timeout: 60000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Run the compiled executable
    const output = execSync(`"${exeFile}"`, {
      encoding: "utf-8",
      timeout: 30000,
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
  } catch (error: unknown) {
    const execError = error as { stderr?: string; message?: string };
    return {
      success: false,
      output: "",
      error: execError.stderr || execError.message || "Unknown error",
    };
  }
}

/**
 * Compile a Ranger file to Rust and run the resulting executable
 */
export function compileAndRunRust(
  sourceFile: string,
  outputDir?: string
): { compile: CompileResult; run?: RunResult } {
  const compileResult = compileRangerToRust(sourceFile, outputDir);

  if (!compileResult.success) {
    return { compile: compileResult };
  }

  const sourceBasename = path.basename(
    sourceFile.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
  const targetDir = outputDir || RUST_OUTPUT_DIR;
  const rustFile = path.join(targetDir, `${sourceBasename}.rs`);

  const runResult = runRustFile(rustFile);

  return {
    compile: compileResult,
    run: runResult,
  };
}

/**
 * Check that Rust compilation succeeds and program produces expected output
 */
export function expectRustOutput(
  sourceFile: string,
  expectedOutput: string | string[]
): RunResult {
  const { compile, run } = compileAndRunRust(sourceFile);

  if (!compile.success) {
    throw new Error(`Rust compilation failed: ${compile.error}`);
  }

  if (!run) {
    throw new Error("No run result");
  }

  if (!run.success) {
    throw new Error(`Rust runtime error: ${run.error}`);
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
 * Get the generated Rust code content for a source file
 * Returns the Rust source code as a string for inspection
 */
export function getGeneratedRustCode(
  sourceFile: string,
  outputDir?: string
): { success: boolean; code: string; error?: string } {
  const result = compileRangerToRust(sourceFile, outputDir);

  if (!result.success) {
    return {
      success: false,
      code: "",
      error: result.error,
    };
  }

  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
  const outputFile = `${sourceBasename}.rs`;
  const targetDir = outputDir || RUST_OUTPUT_DIR;
  const outputPath = path.join(targetDir, outputFile);

  if (!fs.existsSync(outputPath)) {
    return {
      success: false,
      code: "",
      error: `Generated file not found: ${outputPath}`,
    };
  }

  try {
    const code = fs.readFileSync(outputPath, "utf-8");
    return {
      success: true,
      code,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      success: false,
      code: "",
      error: err.message || "Failed to read generated file",
    };
  }
}

// ============================================================================
// C++ compilation helpers
// ============================================================================

const CPP_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-cpp");

/**
 * Get the generated C++ code content for a source file
 * Returns the C++ source code as a string for inspection
 */
export function getGeneratedCppCode(
  sourceFile: string,
  outputDir?: string
): { success: boolean; code: string; error?: string } {
  const targetDir = outputDir || CPP_OUTPUT_DIR;
  const result = compileRanger(sourceFile, "cpp", targetDir);

  if (!result.success) {
    return {
      success: false,
      code: "",
      error: result.error,
    };
  }

  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
  const outputFile = `${sourceBasename}.cpp`;
  const outputPath = path.join(targetDir, outputFile);

  if (!fs.existsSync(outputPath)) {
    return {
      success: false,
      code: "",
      error: `Generated file not found: ${outputPath}`,
    };
  }

  try {
    const code = fs.readFileSync(outputPath, "utf-8");
    return {
      success: true,
      code,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      success: false,
      code: "",
      error: err.message || "Failed to read generated file",
    };
  }
}

// ============================================================================
// Swift6 code generation helpers
// ============================================================================

const SWIFT_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-swift");

/**
 * Get the generated Swift6 code content for a source file
 * Returns the Swift source code as a string for inspection (no compilation needed)
 */
export function getGeneratedSwiftCode(
  sourceFile: string,
  outputDir?: string
): { success: boolean; code: string; error?: string } {
  const targetDir = outputDir || SWIFT_OUTPUT_DIR;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const result = compileRanger(sourceFile, "swift6", targetDir);

  if (!result.success) {
    return {
      success: false,
      code: "",
      error: result.error,
    };
  }

  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
  const outputFile = `${sourceBasename}.swift`;
  const outputPath = path.join(targetDir, outputFile);

  if (!fs.existsSync(outputPath)) {
    return {
      success: false,
      code: "",
      error: `Generated file not found: ${outputPath}`,
    };
  }

  try {
    const code = fs.readFileSync(outputPath, "utf-8");
    return {
      success: true,
      code,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      success: false,
      code: "",
      error: err.message || "Failed to read generated file",
    };
  }
}

// ============================================================================
// Kotlin code generation helpers (code inspection only)
// ============================================================================

/**
 * Get the generated Kotlin code content for a source file
 * Returns the Kotlin source code as a string for inspection (no compilation needed)
 */
export function getGeneratedKotlinCode(
  sourceFile: string,
  outputDir?: string
): { success: boolean; code: string; error?: string } {
  const targetDir = outputDir || KOTLIN_OUTPUT_DIR;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const result = compileRangerToKotlin(sourceFile, targetDir);

  if (!result.success) {
    return {
      success: false,
      code: "",
      error: result.error,
    };
  }

  const absoluteSource = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.join(ROOT_DIR, sourceFile);
  const sourceBasename = path.basename(
    absoluteSource.replace(/\.clj$/, ".rgr"),
    ".rgr"
  );
  const outputFile = `${sourceBasename}.kt`;
  const outputPath = path.join(targetDir, outputFile);

  if (!fs.existsSync(outputPath)) {
    return {
      success: false,
      code: "",
      error: `Generated file not found: ${outputPath}`,
    };
  }

  try {
    const code = fs.readFileSync(outputPath, "utf-8");
    return {
      success: true,
      code,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      success: false,
      code: "",
      error: err.message || "Failed to read generated file",
    };
  }
}
