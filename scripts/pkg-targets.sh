#!/usr/bin/env bash
#
# Compile gallery/pkg tests (and the compiler pkg: fixture) for every Ranger
# target, then run wherever the toolchain is on PATH.
#
# PkgTest reads pkg/fixtures with a relative path, so binaries are
# always launched from the repository root. The compiler prints [FAIL] and
# still exits 0 — this script reads the log.
set -u
cd "$(dirname "$0")/.."

: "${RANGER_LIB:=./compiler/Lang.rgr:./lib/stdops.rgr}"
export RANGER_LIB

ROOT_OUT=tmp/pkg-targets
mkdir -p "$ROOT_OUT"
fail=0
ran=0
compiled=0

compile_one() {
  local lang=$1 src=$2 dest=$3 name=$4
  local dir
  dir=$(dirname "$dest")
  mkdir -p "$dir"
  rm -f "$dest"
  local log
  log=$(node bin/output.js -l="$lang" "$src" -d="$dir" -o="$name" -nodecli 2>&1) || true
  if echo "$log" | grep -q "Compilation FAILED"; then
    echo "COMPILE FAIL  $lang  $src"
    echo "$log" | grep -B1 -A3 "\[FAIL\]" | head -40
    fail=$((fail + 1))
    return 1
  fi
  # Java writes one file per class; -o=App.java is not the file on disk.
  if [ "$lang" = "java7" ]; then
    if ls "$dir"/*.java >/dev/null 2>&1; then
      echo "COMPILE OK    $lang  $src"
      compiled=$((compiled + 1))
      return 0
    fi
  fi
  if [ ! -f "$dest" ]; then
    echo "COMPILE FAIL  $lang  $src  (no $dest)"
    echo "$log" | tail -20
    fail=$((fail + 1))
    return 1
  fi
  echo "COMPILE OK    $lang  $src"
  compiled=$((compiled + 1))
  return 0
}

run_check() {
  local label=$1
  shift
  local out
  if ! out=$("$@" 2>&1); then
    echo "RUN FAIL      $label"
    echo "$out" | tr '\0' '@' | tail -40
    fail=$((fail + 1))
    return 1
  fi
  if echo "$out" | grep -q "FAILED"; then
    echo "RUN FAIL      $label"
    echo "$out" | tr '\0' '@' | grep -E 'FAIL|FAILED|ALL PASS' | head -40
    fail=$((fail + 1))
    return 1
  fi
  if ! echo "$out" | grep -q "ALL PASS"; then
    echo "RUN FAIL      $label  (no ALL PASS)"
    echo "$out" | tr '\0' '@' | tail -20
    fail=$((fail + 1))
    return 1
  fi
  echo "RUN OK        $label  $(echo "$out" | grep -E 'ALL PASS|[0-9]+ FAILED' | tail -1)"
  ran=$((ran + 1))
}

run_app() {
  local label=$1
  shift
  local out
  if ! out=$("$@" 2>&1); then
    echo "RUN FAIL      $label"
    echo "$out" | tail -20
    fail=$((fail + 1))
    return 1
  fi
  if ! echo "$out" | grep -q "pkg-import-ok"; then
    echo "RUN FAIL      $label  (no pkg-import-ok)"
    echo "$out" | tail -20
    fail=$((fail + 1))
    return 1
  fi
  echo "RUN OK        $label  pkg-import-ok"
  ran=$((ran + 1))
}

have() { command -v "$1" >/dev/null 2>&1; }

echo "=== PkgTest ==="
compile_one es6     pkg/tests/PkgTest.rgr "$ROOT_OUT/es6/PkgTest.js"     PkgTest.js
have node     && [ -f "$ROOT_OUT/es6/PkgTest.js" ]     && run_check es6     node "$ROOT_OUT/es6/PkgTest.js"

compile_one go      pkg/tests/PkgTest.rgr "$ROOT_OUT/go/PkgTest.go"     PkgTest.go
have go       && [ -f "$ROOT_OUT/go/PkgTest.go" ]     && run_check go       go run "$ROOT_OUT/go/PkgTest.go"

compile_one python  pkg/tests/PkgTest.rgr "$ROOT_OUT/python/PkgTest.py"     PkgTest.py
have python3  && [ -f "$ROOT_OUT/python/PkgTest.py" ]     && run_check python   python3 "$ROOT_OUT/python/PkgTest.py"

compile_one rust    pkg/tests/PkgTest.rgr "$ROOT_OUT/rust/PkgTest.rs"     PkgTest.rs
if have rustc && [ -f "$ROOT_OUT/rust/PkgTest.rs" ]; then
  if rustc "$ROOT_OUT/rust/PkgTest.rs" -o "$ROOT_OUT/rust/PkgTest_rust" 2>"$ROOT_OUT/rust/rustc.log"; then
    run_check rust "$ROOT_OUT/rust/PkgTest_rust"
  else
    echo "BUILD FAIL    rust"
    tail -20 "$ROOT_OUT/rust/rustc.log"
    fail=$((fail + 1))
  fi
fi

compile_one cpp     pkg/tests/PkgTest.rgr "$ROOT_OUT/cpp/PkgTest.cpp"    PkgTest.cpp
if have g++ && [ -f "$ROOT_OUT/cpp/PkgTest.cpp" ]; then
  if g++ -std=c++17 -O0 -I gallery/invaders "$ROOT_OUT/cpp/PkgTest.cpp" -o "$ROOT_OUT/cpp/PkgTest_cpp" 2>"$ROOT_OUT/cpp/g++.log"; then
    run_check cpp "$ROOT_OUT/cpp/PkgTest_cpp"
  else
    echo "BUILD FAIL    cpp"
    tail -20 "$ROOT_OUT/cpp/g++.log"
    fail=$((fail + 1))
  fi
fi

compile_one java7   pkg/tests/PkgTest.rgr "$ROOT_OUT/java7/PkgTest.java"   PkgTest.java
if have javac && have java && [ -f "$ROOT_OUT/java7/PkgTest.java" ]; then
  mkdir -p "$ROOT_OUT/java7/classes"
  if javac -d "$ROOT_OUT/java7/classes" "$ROOT_OUT/java7"/*.java 2>"$ROOT_OUT/java7/javac.log"; then
    run_check java7 java -cp "$ROOT_OUT/java7/classes" PkgTest
  else
    echo "BUILD FAIL    java7"
    tail -20 "$ROOT_OUT/java7/javac.log"
    fail=$((fail + 1))
  fi
fi

for lang_ext in kotlin:kt dart:dart swift6:swift csharp:cs php:php; do
  lang=${lang_ext%%:*}
  ext=${lang_ext##*:}
  compile_one "$lang" pkg/tests/PkgTest.rgr "$ROOT_OUT/$lang/PkgTest.$ext" "PkgTest.$ext" || true
done
have php   && [ -f "$ROOT_OUT/php/PkgTest.php" ]  && run_check php   php "$ROOT_OUT/php/PkgTest.php"
have dart  && [ -f "$ROOT_OUT/dart/PkgTest.dart" ] && run_check dart  dart run "$ROOT_OUT/dart/PkgTest.dart"

echo "=== pkg: fixture App.rgr ==="
compile_one es6     tests/fixtures/pkg/app/App.rgr "$ROOT_OUT/es6/App.js"     App.js
have node     && [ -f "$ROOT_OUT/es6/App.js" ]     && run_app es6     node "$ROOT_OUT/es6/App.js"

compile_one go      tests/fixtures/pkg/app/App.rgr "$ROOT_OUT/go/App.go"     App.go
have go       && [ -f "$ROOT_OUT/go/App.go" ]     && run_app go       go run "$ROOT_OUT/go/App.go"

compile_one python  tests/fixtures/pkg/app/App.rgr "$ROOT_OUT/python/App.py"     App.py
have python3  && [ -f "$ROOT_OUT/python/App.py" ]     && run_app python   python3 "$ROOT_OUT/python/App.py"

compile_one rust    tests/fixtures/pkg/app/App.rgr "$ROOT_OUT/rust/App.rs"     App.rs
if have rustc && [ -f "$ROOT_OUT/rust/App.rs" ]; then
  if rustc "$ROOT_OUT/rust/App.rs" -o "$ROOT_OUT/rust/App_rust" 2>"$ROOT_OUT/rust/App.rustc.log"; then
    run_app rust "$ROOT_OUT/rust/App_rust"
  else
    echo "BUILD FAIL    rust App.rgr"
    tail -20 "$ROOT_OUT/rust/App.rustc.log"
    fail=$((fail + 1))
  fi
fi

compile_one cpp     tests/fixtures/pkg/app/App.rgr "$ROOT_OUT/cpp/App.cpp"    App.cpp
if have g++ && [ -f "$ROOT_OUT/cpp/App.cpp" ]; then
  if g++ -std=c++17 -O0 -I gallery/invaders "$ROOT_OUT/cpp/App.cpp" -o "$ROOT_OUT/cpp/App_cpp" 2>"$ROOT_OUT/cpp/App.g++.log"; then
    run_app cpp "$ROOT_OUT/cpp/App_cpp"
  else
    echo "BUILD FAIL    cpp App.rgr"
    tail -20 "$ROOT_OUT/cpp/App.g++.log"
    fail=$((fail + 1))
  fi
fi

compile_one java7   tests/fixtures/pkg/app/App.rgr "$ROOT_OUT/java7-app/App.java"   App.java
if have javac && have java && ls "$ROOT_OUT/java7-app"/*.java >/dev/null 2>&1; then
  mkdir -p "$ROOT_OUT/java7-app/classes"
  if javac -d "$ROOT_OUT/java7-app/classes" "$ROOT_OUT/java7-app"/*.java 2>"$ROOT_OUT/java7-app/javac.log"; then
    run_app java7 java -cp "$ROOT_OUT/java7-app/classes" PkgApp
  else
    echo "BUILD FAIL    java7 App.rgr"
    tail -20 "$ROOT_OUT/java7-app/javac.log"
    fail=$((fail + 1))
  fi
fi

for lang_ext in kotlin:kt dart:dart swift6:swift csharp:cs php:php; do
  lang=${lang_ext%%:*}
  ext=${lang_ext##*:}
  compile_one "$lang" tests/fixtures/pkg/app/App.rgr "$ROOT_OUT/${lang}-app/App.$ext" "App.$ext" || true
done
have php   && [ -f "$ROOT_OUT/php-app/App.php" ]  && run_app php   php "$ROOT_OUT/php-app/App.php"
have dart  && [ -f "$ROOT_OUT/dart-app/App.dart" ] && run_app dart  dart run "$ROOT_OUT/dart-app/App.dart"

echo
echo "compiled=$compiled ran=$ran fail=$fail"
if [ "$fail" -ne 0 ]; then
  exit 1
fi
if [ "$compiled" -lt 8 ]; then
  echo "expected to compile at least es6/go/python/rust/cpp/java7/kotlin/php" >&2
  exit 1
fi
exit 0
