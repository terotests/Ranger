#!/usr/bin/env bash
# Compile the shared studies in src/ to one target, or to all of them.
# Usage: bash gallery/friendly/compile.sh [all|rust|go|python|cpp|swift|kotlin|dart|javascript|java|csharp]
# The Ranger compiler exits 0 even on [FAIL]; this script treats that as failure.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
SRC="$HERE/src"
COMPILER="$ROOT/dist/rgrc.js"
export RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr"

if [[ ! -f "$COMPILER" ]]; then
  echo "missing $COMPILER — run npm run compile first" >&2
  exit 1
fi

# Optional local SDKs (same paths the test helpers use when CI drops them in /tmp).
if [[ -x /tmp/kotlinc/bin/kotlinc && -z "$(command -v kotlinc 2>/dev/null || true)" ]]; then
  PATH="/tmp/kotlinc/bin:$PATH"
fi
if [[ -x /tmp/dart-sdk/bin/dart && -z "$(command -v dart 2>/dev/null || true)" ]]; then
  PATH="/tmp/dart-sdk/bin:$PATH"
fi

target="${1:-all}"

# Which .out files this run produced. A target whose toolchain is missing is
# skipped, and its .out from an earlier machine must not be compared against
# the ones just written.
STAMP="${TMPDIR:-/tmp}/friendly-run-stamp"
: > "$STAMP"

compile_one() {
  local lang="$1"
  local ext="$2"
  local ranger_lang="$3"
  local out="$HERE/$lang/generated"
  local bin="${TMPDIR:-/tmp}/friendly-$lang-bin"
  mkdir -p "$out" "$bin"
  local fail=0
  echo "======== $lang ========"
  local extra=()
  if [[ "$lang" == "rust" ]]; then
    extra+=(-strict-ownership)
  fi
  # The shared studies, plus any this target has of its own. A target-local
  # study is one the same program cannot express everywhere — `rust/src`
  # holds the behaviour-only trait study, which C++ cannot compile because
  # that writer names a trait type it never declares.
  local srclist=("$SRC"/*.rgr)
  if compgen -G "$HERE/$lang/src/*.rgr" >/dev/null; then
    srclist+=("$HERE/$lang"/src/*.rgr)
  fi
  local src
  for src in "${srclist[@]}"; do
    local name
    name="$(basename "$src" .rgr)"
    local log="$out/${name}.compile.log"
    echo "==> $name"
    set +e
    local dest="$out"
    if [[ "$lang" == "java" ]]; then
      dest="$out/$name"
      mkdir -p "$dest"
    fi
    node "$COMPILER" -l="$ranger_lang" "${extra[@]}" "$src" -d="$dest" -o="${name}${ext}" -nodecli >"$log" 2>&1
    set -e
    if grep -E '\[FAIL\]|Compilation FAILED' "$log" >/dev/null; then
      echo "    Ranger compile FAILED — see $log"
      fail=1
      continue
    fi
    if [[ "$lang" == "java" ]]; then
      if ! ls "$dest"/*.java >/dev/null 2>&1; then
        echo "    no $dest/*.java written"
        fail=1
        continue
      fi
    elif [[ ! -f "$out/${name}${ext}" ]]; then
      echo "    no $out/${name}${ext} written"
      fail=1
      continue
    fi
    case "$lang" in
      rust)
        if ! rustc --edition 2021 -O "$out/${name}.rs" -o "$bin/$name" 2>"$out/${name}.build.log"; then
          echo "    rustc FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    rustc ok"
        if ! "$bin/$name" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
      go)
        if ! go build -o "$bin/$name" "$out/${name}.go" 2>"$out/${name}.build.log"; then
          echo "    go build FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    go build ok"
        if ! "$bin/$name" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
      python)
        if ! python3 "$out/${name}.py" >"$out/${name}.out" 2>"$out/${name}.build.log"; then
          echo "    python FAILED — see $out/${name}.build.log"
          cat "$out/${name}.build.log" >&2
          fail=1
          continue
        fi
        echo "    python ok"
        cat "$out/${name}.out"
        ;;
      cpp)
        if ! g++ -std=c++17 -O1 "$out/${name}.cpp" -o "$bin/$name" 2>"$out/${name}.build.log"; then
          echo "    g++ FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    g++ ok"
        if ! "$bin/$name" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
      swift)
        if ! command -v swiftc >/dev/null 2>&1; then
          echo "    swiftc not on PATH — writer output only"
          continue
        fi
        if ! swiftc -O "$out/${name}.swift" -o "$bin/$name" 2>"$out/${name}.build.log"; then
          echo "    swiftc FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    swiftc ok"
        if ! "$bin/$name" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
      kotlin)
        if ! command -v kotlinc >/dev/null 2>&1; then
          echo "    kotlinc not on PATH — writer output only"
          continue
        fi
        if ! kotlinc "$out/${name}.kt" -include-runtime -d "$bin/${name}.jar" 2>"$out/${name}.build.log"; then
          echo "    kotlinc FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    kotlinc ok"
        if ! java -jar "$bin/${name}.jar" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
      dart)
        if ! command -v dart >/dev/null 2>&1; then
          echo "    dart not on PATH — writer output only"
          continue
        fi
        if ! dart run "$out/${name}.dart" >"$out/${name}.out" 2>"$out/${name}.build.log"; then
          echo "    dart FAILED — see $out/${name}.build.log"
          cat "$out/${name}.build.log" >&2
          fail=1
          continue
        fi
        echo "    dart ok"
        cat "$out/${name}.out"
        ;;
      javascript)
        if ! node "$out/${name}.js" >"$out/${name}.out" 2>"$out/${name}.build.log"; then
          echo "    node FAILED — see $out/${name}.build.log"
          cat "$out/${name}.build.log" >&2
          fail=1
          continue
        fi
        echo "    node ok"
        cat "$out/${name}.out"
        ;;
      java)
        if ! command -v javac >/dev/null 2>&1; then
          echo "    javac not on PATH — writer output only"
          continue
        fi
        local classes="$bin/$name-classes"
        mkdir -p "$classes"
        if ! javac -d "$classes" "$dest"/*.java 2>"$out/${name}.build.log"; then
          echo "    javac FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    javac ok"
        local main_src
        main_src="$(grep -l 'public static void main' "$dest"/*.java | head -1)"
        if [[ -z "$main_src" ]]; then
          echo "    no public static void main in $dest"
          fail=1
          continue
        fi
        local main_class
        main_class="$(basename "$main_src" .java)"
        if ! java -cp "$classes" "$main_class" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
      csharp)
        if ! command -v mcs >/dev/null 2>&1; then
          echo "    mcs not on PATH — writer output only"
          continue
        fi
        # throw wraps ConfigurationErrorsException; the nine studies do not
        # need the reference, but one extra assembly is harmless.
        if ! mcs -langversion:latest -r:System.Configuration -out:"$bin/${name}.exe" "$out/${name}.cs" 2>"$out/${name}.build.log"; then
          echo "    mcs FAILED — see $out/${name}.build.log"
          fail=1
          continue
        fi
        echo "    mcs ok"
        if ! command -v mono >/dev/null 2>&1; then
          echo "    mono not on PATH — built, not run"
          continue
        fi
        if ! mono "$bin/${name}.exe" | tee "$out/${name}.out"; then
          echo "    run FAILED"
          fail=1
        fi
        ;;
    esac
  done
  # A target folder may hold attempts/: forms that target cannot express. Each
  # must be REFUSED, with the error it declares on its first line
  #   ; EXPECT-ERROR: <substring the compiler must print>
  # never a binary that panics, and never code that does not exist.
  if [[ -d "$HERE/$lang/attempts" ]]; then
    local asrc
    for asrc in "$HERE/$lang/attempts"/*.rgr; do
      [[ -e "$asrc" ]] || continue
      local aname want alog
      aname="$(basename "$asrc" .rgr)"
      want="$(sed -n 's/^; *EXPECT-ERROR: *//p' "$asrc" | head -1)"
      echo "==> attempt $aname"
      if [[ -z "$want" ]]; then
        echo "    no '; EXPECT-ERROR:' line in $asrc"
        fail=1
        continue
      fi
      alog="$out/attempt_${aname}.compile.log"
      set +e
      node "$COMPILER" -l="$ranger_lang" "${extra[@]}" "$asrc" -d="$bin" -o="attempt_${aname}${ext}" -nodecli >"$alog" 2>&1
      set -e
      if ! grep -E '\[FAIL\]|Compilation FAILED' "$alog" >/dev/null; then
        echo "    compiled, but this form is not supposed to be expressible — see $alog"
        fail=1
        continue
      fi
      if ! grep -F "$want" "$alog" >/dev/null; then
        echo "    failed, but not with the declared error: $want"
        echo "    see $alog"
        fail=1
        continue
      fi
      echo "    refused: $want"
    done
  fi

  # `-rust-library` (PLAN_RUST_SEMANTIC_IDIOMS O): the same sources as a crate
  # someone depends on rather than a program to run -- public surface, no
  # `main`. Checked with --crate-type=lib, which is the thing the mode is for.
  if [[ "$lang" == "rust" ]]; then
    local libout="$bin/librs"
    mkdir -p "$libout"
    local lsrc
    for lsrc in "${srclist[@]}"; do
      local lname
      lname="$(basename "$lsrc" .rgr)"
      echo "==> library $lname"
      set +e
      node "$COMPILER" -l=rust -rust-library "$lsrc" -d="$libout" -o="${lname}.rs" -nodecli >"$libout/${lname}.log" 2>&1
      set -e
      if grep -E '\[FAIL\]|Compilation FAILED' "$libout/${lname}.log" >/dev/null; then
        echo "    Ranger compile FAILED -- see $libout/${lname}.log"
        fail=1
        continue
      fi
      if ! rustc --edition 2021 --crate-type=lib -o "$libout/${lname}.rlib" "$libout/${lname}.rs" 2>"$libout/${lname}.rustc.log"; then
        echo "    rustc --crate-type=lib FAILED -- see $libout/${lname}.rustc.log"
        fail=1
        continue
      fi
      echo "    lib ok"
    done
  fi

  if [[ "$fail" -ne 0 ]]; then
    echo "$lang: one or more studies failed"
    return 1
  fi
  echo "$lang: all studies compiled, all attempts refused"
  return 0
}

overall=0
run_target() {
  case "$1" in
    rust) compile_one rust .rs rust || overall=1 ;;
    go) compile_one go .go go || overall=1 ;;
    python) compile_one python .py python || overall=1 ;;
    cpp) compile_one cpp .cpp cpp || overall=1 ;;
    swift) compile_one swift .swift swift6 || overall=1 ;;
    kotlin) compile_one kotlin .kt kotlin || overall=1 ;;
    dart) compile_one dart .dart dart || overall=1 ;;
    javascript) compile_one javascript .js es6 || overall=1 ;;
    java) compile_one java .java java7 || overall=1 ;;
    csharp) compile_one csharp .cs csharp || overall=1 ;;
    *) echo "unknown target $1" >&2; overall=1 ;;
  esac
}

if [[ "$target" == "all" ]]; then
  for t in rust go python cpp swift kotlin dart javascript java csharp; do
    run_target "$t"
  done
else
  run_target "$target"
fi

# Each study in src/ is ONE program compiled ten ways, so the ten runs have to
# print the same thing. Nothing checked that until study 11 went in: an optional
# string set to "" read back as absent on C++ and as present on every other
# target, and both outputs sat in this directory looking fine on their own.
# Only the targets that actually ran this time are compared — a .out left behind
# by a machine that had a toolchain this one does not is not evidence.
compare_outputs() {
  local mismatch=0
  echo "======== cross-target output ========"
  local src name ref reflang t f
  for src in "$SRC"/*.rgr; do
    name="$(basename "$src" .rgr)"
    ref=""
    reflang=""
    local seen=0
    local differ=0
    for t in javascript python go rust cpp java kotlin dart csharp swift; do
      f="$HERE/$t/generated/${name}.out"
      [[ -f "$f" ]] || continue
      [[ "$f" -nt "$STAMP" ]] || continue
      seen=$((seen + 1))
      if [[ -z "$ref" ]]; then
        ref="$f"
        reflang="$t"
        continue
      fi
      if ! diff -q "$ref" "$f" >/dev/null 2>&1; then
        echo "==> $name: $t disagrees with $reflang"
        diff -u "$ref" "$f" | tail -n +3 | head -20 | sed 's/^/      /'
        differ=$((differ + 1))
        mismatch=1
      fi
    done
    if [[ -z "$ref" ]]; then
      continue
    fi
    if [[ "$differ" -eq 0 ]]; then
      echo "==> $name: $seen targets agree ($reflang is the reference)"
    else
      echo "==> $name: $differ of $seen targets disagree with $reflang"
    fi
  done
  return "$mismatch"
}

if [[ "$target" == "all" ]]; then
  compare_outputs || overall=1
fi

if [[ "$overall" -ne 0 ]]; then
  echo "one or more targets failed"
  exit 1
fi
echo "done"
