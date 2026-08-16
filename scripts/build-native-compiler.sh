#!/usr/bin/env bash
# Build a native `rangerc` binary through the C++ target and stage a
# self-contained distribution beside it.
#
# The compiler is self-hosting: Node compiles `compiler/ng_Compiler.rgr` to one
# C++ translation unit, and the C++ compiler turns that into a binary that needs
# no Node and no npm install. The binary finds its library beside itself
# (`install_directory` is the directory of argv[0], and VirtualCompiler puts
# that path and `<dir>/lib/` at the front of RANGER_LIB), so the staged
# directory is the whole product: binary + Lang.rgr + stdops.rgr + lib/*.rgr.
#
# Usage:
#   scripts/build-native-compiler.sh [options]
#
# Options:
#   --skip-codegen        reuse an existing tmp/selfhost/ranger_compiler.cpp
#   --out DIR             staging directory (default: tmp/native/ranger-<ver>-<platform>)
#   --platform NAME       platform tag for the tarball (default: guessed)
#   --opt LEVEL           optimization level, e.g. O2 (default) or O1
#   --arch ARCH           macOS only, repeatable: -arch ARCH (e.g. arm64 x86_64)
#   --tarball             also write <out>.tar.gz and .sha256 next to the staging dir
#   --bootstrap           after the smoke test, have the binary compile the
#                         compiler and diff the JavaScript against bin/output.js
#   --no-smoke            skip the hello-world smoke test
#
# Environment:
#   CXX                   C++ compiler to use (default: c++ / g++ / clang++)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SKIP_CODEGEN=0
TARBALL=0
BOOTSTRAP=0
SMOKE=1
OPT="O2"
OUT_DIR=""
PLATFORM=""
ARCHES=()

while [ $# -gt 0 ]; do
  case "$1" in
    --skip-codegen) SKIP_CODEGEN=1 ;;
    --tarball) TARBALL=1 ;;
    --bootstrap) BOOTSTRAP=1 ;;
    --no-smoke) SMOKE=0 ;;
    --opt) OPT="$2"; shift ;;
    --out) OUT_DIR="$2"; shift ;;
    --platform) PLATFORM="$2"; shift ;;
    --arch) ARCHES+=("$2"); shift ;;
    --help|-h) sed -n '2,32p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

VERSION="$(node -p "require('./package.json').version")"
UNAME_S="$(uname -s)"
UNAME_M="$(uname -m)"

if [ -z "$PLATFORM" ]; then
  case "$UNAME_S" in
    Darwin) OS_TAG="macos" ;;
    Linux) OS_TAG="linux" ;;
    *) OS_TAG="$(echo "$UNAME_S" | tr '[:upper:]' '[:lower:]')" ;;
  esac
  case "$UNAME_M" in
    x86_64|amd64) ARCH_TAG="x64" ;;
    arm64|aarch64) ARCH_TAG="arm64" ;;
    *) ARCH_TAG="$UNAME_M" ;;
  esac
  PLATFORM="$OS_TAG-$ARCH_TAG"
fi

NAME="ranger-$VERSION-$PLATFORM"
[ -n "$OUT_DIR" ] || OUT_DIR="$ROOT/tmp/native/$NAME"

CPP_SRC="$ROOT/tmp/selfhost/ranger_compiler.cpp"

# ---------------------------------------------------------------- codegen ----
if [ "$SKIP_CODEGEN" = "1" ]; then
  if [ ! -f "$CPP_SRC" ]; then
    echo "--skip-codegen given but $CPP_SRC does not exist" >&2
    exit 1
  fi
  echo "==> reusing $CPP_SRC"
else
  echo "==> generating C++ from compiler/ng_Compiler.rgr"
  npm run --silent selfhost:compile:cpp
fi
echo "    $(wc -l <"$CPP_SRC" | tr -d ' ') lines, $(wc -c <"$CPP_SRC" | tr -d ' ') bytes"

# --------------------------------------------------------------- compiler ----
if [ -z "${CXX:-}" ]; then
  for cand in c++ g++ clang++; do
    if command -v "$cand" >/dev/null 2>&1; then CXX="$cand"; break; fi
  done
fi
if [ -z "${CXX:-}" ]; then
  echo "no C++ compiler found (set CXX)" >&2
  exit 1
fi
echo "==> $CXX -$OPT"
"$CXX" --version 2>/dev/null | head -n 1 || true

CXXFLAGS=(-std=c++17 "-$OPT")
LDFLAGS=()
case "$UNAME_S" in
  Darwin)
    # The output uses <variant>, whose libc++ runtime bits need 10.14 or newer;
    # 11.0 is a conservative floor that covers every Apple Silicon machine too.
    # Every arch asked for goes into one universal binary.
    CXXFLAGS+=(-mmacosx-version-min=11.0)
    for a in "${ARCHES[@]:-}"; do
      [ -n "$a" ] && CXXFLAGS+=(-arch "$a")
    done
    ;;
  Linux)
    # Static libstdc++/libgcc so the binary runs on distributions older than the
    # builder. glibc itself stays dynamic: a fully static glibc link warns about
    # getaddrinfo/dlopen and buys nothing here.
    LDFLAGS+=(-static-libstdc++ -static-libgcc)
    ;;
esac

mkdir -p "$OUT_DIR"
BIN="$OUT_DIR/rangerc"

echo "==> building $BIN"
BUILD_START=$(date +%s)
"$CXX" "${CXXFLAGS[@]}" -o "$BIN" "$CPP_SRC" "${LDFLAGS[@]}"
BUILD_END=$(date +%s)
echo "    linked in $((BUILD_END - BUILD_START))s"

if command -v strip >/dev/null 2>&1; then
  case "$UNAME_S" in
    Darwin) strip -x "$BIN" ;;
    *) strip "$BIN" ;;
  esac
fi
echo "    $(wc -c <"$BIN" | tr -d ' ') bytes after strip"

# ----------------------------------------------------------------- staging ---
echo "==> staging library beside the binary"
cp "$ROOT/compiler/Lang.rgr" "$OUT_DIR/Lang.rgr"
cp "$ROOT/lib/stdops.rgr" "$OUT_DIR/stdops.rgr"
mkdir -p "$OUT_DIR/lib"
cp "$ROOT"/lib/*.rgr "$OUT_DIR/lib/"

cat >"$OUT_DIR/README.md" <<EOF
# Ranger compiler $VERSION — native build ($PLATFORM)

\`rangerc\` is the Ranger compiler compiled to C++ by itself and linked as a
native binary. It needs no Node.js and no npm install.

    ./rangerc -es6 hello.rgr -d=./out -o=hello.js

The compiler reads its library (\`Lang.rgr\`, \`stdops.rgr\`, \`lib/\`) from the
directory of the binary, so keep those files next to \`rangerc\` — or point
\`RANGER_LIB\` at them:

    RANGER_LIB="/path/to/Lang.rgr:/path/to/stdops.rgr" rangerc -es6 hello.rgr

\`-d\` is resolved against the working directory — pass it a relative path.

Targets: \`-es6\` (also \`-typescript\`), or \`-l=<target>\` for \`python\`, \`go\`,
\`cpp\`, \`rust\`, \`csharp\`, \`kotlin\`, \`swift\`, \`dart\`, \`java\`, \`php\`, \`scala\`.

Sources and documentation: https://github.com/terotests/Ranger
License: MIT
EOF

if [ "$UNAME_S" = "Darwin" ]; then
  cat >>"$OUT_DIR/README.md" <<'EOF'

This build is not signed or notarized, so Gatekeeper quarantines it on
download:

    xattr -d com.apple.quarantine rangerc
EOF
fi

# ------------------------------------------------------------------- smoke ---
if [ "$SMOKE" = "1" ]; then
  echo "==> smoke test: compiling tests/fixtures/hello.rgr"
  SMOKE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/rgr-smoke.XXXXXX")"
  cp "$ROOT/tests/fixtures/hello.rgr" "$SMOKE_DIR/hello.rgr"
  # Run from an unrelated directory with no RANGER_LIB: this is the check that
  # the staged directory is actually self-contained. `-d` is resolved against
  # the working directory, so it stays relative.
  (
    cd "$SMOKE_DIR"
    env -u RANGER_LIB "$BIN" -es6 ./hello.rgr -nodecli -d=./out -o=hello.js >"$SMOKE_DIR/compile.log" 2>&1
  ) || { echo "smoke compile failed:"; cat "$SMOKE_DIR/compile.log"; exit 1; }
  if [ ! -f "$SMOKE_DIR/out/hello.js" ]; then
    echo "smoke test wrote no output:"; cat "$SMOKE_DIR/compile.log"; exit 1
  fi
  OUTPUT="$(node "$SMOKE_DIR/out/hello.js")"
  if [ "$OUTPUT" != "Hello World" ]; then
    echo "smoke test printed '$OUTPUT', expected 'Hello World'" >&2
    exit 1
  fi
  echo "    ok — generated JavaScript prints 'Hello World'"
  rm -rf "$SMOKE_DIR"
fi

# --------------------------------------------------------------- bootstrap ---
if [ "$BOOTSTRAP" = "1" ]; then
  echo "==> bootstrap: the binary compiles the compiler"
  # `-d` is always resolved against the working directory, even when it looks
  # absolute (an absolute path lands under cwd), so these stay relative to $ROOT.
  BOOT_REL="tmp/native-bootstrap"
  BOOT_DIR="$ROOT/$BOOT_REL"
  rm -rf "$BOOT_DIR"
  mkdir -p "$BOOT_DIR/native" "$BOOT_DIR/node"
  RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" \
    "$BIN" -es6 ./compiler/ng_Compiler.rgr -nodecli \
      -d="./$BOOT_REL/native" -o=output.js >"$BOOT_DIR/native.log" 2>&1 \
    || { echo "bootstrap compile failed:"; cat "$BOOT_DIR/native.log"; exit 1; }
  # The reference is the Node build of the same sources, generated now — the
  # committed bin/output.js has gone through patch-chain-desugar.js and is not
  # raw compiler output.
  RANGER_LIB="./compiler/Lang.rgr:./lib/stdops.rgr" \
    node --max-old-space-size=8192 ./bin/output.js -es6 \
      ./compiler/ng_Compiler.rgr -nodecli \
      -d="./$BOOT_REL/node" -o=output.js >"$BOOT_DIR/node.log" 2>&1 \
    || { echo "reference compile failed:"; cat "$BOOT_DIR/node.log"; exit 1; }
  for f in "$BOOT_DIR/native/output.js" "$BOOT_DIR/node/output.js"; do
    if [ ! -s "$f" ]; then
      echo "bootstrap wrote no output: $f" >&2
      exit 1
    fi
  done
  if diff <(tr -d '\r' <"$BOOT_DIR/node/output.js") \
          <(tr -d '\r' <"$BOOT_DIR/native/output.js") >"$BOOT_DIR/bootstrap.diff"; then
    echo "    ok — identical to the JavaScript the Node build writes"
  else
    echo "native build diverges from the Node build:" >&2
    head -40 "$BOOT_DIR/bootstrap.diff" >&2
    exit 1
  fi
fi

# ----------------------------------------------------------------- tarball ---
if [ "$TARBALL" = "1" ]; then
  PARENT="$(dirname "$OUT_DIR")"
  BASE="$(basename "$OUT_DIR")"
  TAR="$PARENT/$BASE.tar.gz"
  echo "==> packing $TAR"
  tar -czf "$TAR" -C "$PARENT" "$BASE"
  if command -v shasum >/dev/null 2>&1; then
    (cd "$PARENT" && shasum -a 256 "$BASE.tar.gz" >"$BASE.tar.gz.sha256")
  else
    (cd "$PARENT" && sha256sum "$BASE.tar.gz" >"$BASE.tar.gz.sha256")
  fi
  cat "$PARENT/$BASE.tar.gz.sha256"
fi

echo "==> done: $OUT_DIR"
