#!/usr/bin/env bash
# bench.sh — the same Ranger program, timed on every target that has a
# toolchain on this machine.
#
#   bash gallery/friendly/bench/bench.sh            # every target
#   bash gallery/friendly/bench/bench.sh rust go    # a subset
#
# bench.rgr times its own five kernels with `wall_clock_ms` and prints a
# checksum beside each, so the numbers exclude process and VM startup and one
# slow kernel cannot hide the other four. startup.rgr is a program whose only
# statement is a print; its wall time is what the target costs before the
# first statement, measured here because the program cannot measure it itself.
#
# Every target has to print the same five checksums. One that does not is a
# correctness failure and is reported as one, not as a time.
#
# This is a comparison of what the WRITERS emit, on one machine, for one
# program. It is not a language benchmark: read it as "what does Ranger cost
# here", not as "which language is faster".
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
HERE="$ROOT/gallery/friendly/bench"
COMPILER="$ROOT/bin/output.js"
WORK="${BENCH_WORK:-/tmp/ranger-bench}"
LIMIT="${BENCH_TIMEOUT:-180}"
export RANGER_LIB="$ROOT/compiler/Lang.rgr:$ROOT/lib/stdops.rgr"

if [[ -x /tmp/kotlinc/bin/kotlinc && -z "$(command -v kotlinc 2>/dev/null || true)" ]]; then
  PATH="/tmp/kotlinc/bin:$PATH"
fi

ALL=(javascript python php go cpp rust java csharp kotlin)
TARGETS=("$@")
if [[ ${#TARGETS[@]} -eq 0 ]]; then TARGETS=("${ALL[@]}"); fi

rm -rf "$WORK"; mkdir -p "$WORK"

lang_of() { case "$1" in
  javascript) echo es6 ;; python) echo python ;; php) echo php ;; go) echo go ;;
  cpp) echo cpp ;; rust) echo rust ;; java) echo java7 ;; csharp) echo csharp ;;
  kotlin) echo kotlin ;; esac; }
ext_of() { case "$1" in
  javascript) echo .js ;; python) echo .py ;; php) echo .php ;; go) echo .go ;;
  cpp) echo .cpp ;; rust) echo .rs ;; java) echo .java ;; csharp) echo .cs ;;
  kotlin) echo .kt ;; esac; }

# Compile and build one source for one target; echo the run command, or
# nothing on failure.
build() {
  local t="$1" name="$2" lang ext dest
  lang="$(lang_of "$t")"; ext="$(ext_of "$t")"
  dest="$WORK/$t/$name"
  mkdir -p "$dest"
  if ! node "$COMPILER" -l="$lang" "$HERE/$name.rgr" -d="$dest" -o="$name$ext" -nodecli \
        >"$dest/compile.log" 2>&1 || grep -q "Compilation FAILED" "$dest/compile.log"; then
    return 1
  fi
  case "$t" in
    javascript) echo "node $dest/$name$ext" ;;
    python)     echo "python3 $dest/$name$ext" ;;
    php)        echo "php $dest/$name$ext" ;;
    go)         go build -o "$dest/$name.bin" "$dest/$name.go" 2>"$dest/build.log" || return 1
                echo "$dest/$name.bin" ;;
    cpp)        g++ -std=c++17 -O2 "$dest/$name.cpp" -o "$dest/$name.bin" 2>"$dest/build.log" || return 1
                echo "$dest/$name.bin" ;;
    rust)       cp "$dest/$name.rs" "$dest/${name}_main.rs"
                rustc --edition 2021 -O "$dest/${name}_main.rs" -o "$dest/$name.bin" 2>"$dest/build.log" || return 1
                echo "$dest/$name.bin" ;;
    java)       mkdir -p "$dest/classes"
                javac -d "$dest/classes" "$dest"/*.java 2>"$dest/build.log" || return 1
                local mainsrc mainclass
                mainsrc="$(grep -l 'public static void main' "$dest"/*.java | head -1)"
                mainclass="$(basename "$mainsrc" .java)"
                echo "java -cp $dest/classes $mainclass" ;;
    csharp)     mcs -langversion:latest -r:System.Configuration -out:"$dest/$name.exe" "$dest/$name.cs" 2>"$dest/build.log" || return 1
                echo "mono $dest/$name.exe" ;;
    kotlin)     kotlinc "$dest/$name.kt" -include-runtime -d "$dest/$name.jar" 2>"$dest/build.log" || return 1
                echo "java -jar $dest/$name.jar" ;;
  esac
}

KERNELS=(arith arrays strings maps objects)
REF=""

printf '%-12s %7s' target startup
for k in "${KERNELS[@]}"; do printf ' %8s' "$k"; done
printf ' %8s   %s\n' total result
printf '%-12s %7s' ------ -------
for k in "${KERNELS[@]}"; do printf ' %8s' "-------"; done
printf ' %8s   %s\n' ------- ------

SUMMARY="$WORK/summary.txt"; : >"$SUMMARY"
for t in "${TARGETS[@]}"; do
  row() { printf '%-12s %7s' "$t" "$1"; shift; for c in "$@"; do printf ' %8s' "$c"; done; printf '\n'; }

  scmd="$(build "$t" startup)" || { row - - - - - - - "build failed"; continue; }
  bcmd="$(build "$t" bench)"   || { row - - - - - - - "build failed"; continue; }

  # startup: fastest of three, measured from outside
  best=""
  for i in 1 2 3; do
    s="$(date +%s.%N)"; eval "$scmd" >/dev/null 2>&1; e="$(date +%s.%N)"
    v="$(awk -v a="$s" -v b="$e" 'BEGIN{printf "%.3f", b-a}')"
    if [[ -z "$best" ]] || awk -v x="$v" -v y="$best" 'BEGIN{exit !(x<y)}'; then best="$v"; fi
  done

  # A kernel prints as it finishes, so a run killed part-way still leaves the
  # kernels that did finish on stdout. Those are reported; the rest read t/o.
  out="$WORK/$t/bench.txt"
  timedout=0
  timeout "$LIMIT" bash -c "$bcmd" >"$out" 2>"$WORK/$t/bench.err" || timedout=1

  cells=(); total=0; sums=""; partial=0
  for k in "${KERNELS[@]}"; do
    line="$(grep "^$k " "$out" || true)"
    if [[ -z "$line" ]]; then cells+=(t/o); partial=1; continue; fi
    sums="$sums $(echo "$line" | awk '{print $2}')"
    ms="$(echo "$line" | awk '{print $3}')"
    cells+=("$ms"); total=$((total + ms))
  done

  if [[ $partial -eq 1 ]]; then res="incomplete after ${LIMIT}s"
  elif [[ -z "$REF" ]]; then REF="$sums"; res="reference"
  elif [[ "$sums" == "$REF" ]]; then res="same answer"
  else res="DIFFERS"; fi
  if [[ $timedout -eq 1 && $partial -eq 0 ]]; then res="$res (killed after last kernel)"; fi

  printf '%-12s %7s' "$t" "$best"
  for c in "${cells[@]}"; do printf ' %8s' "$c"; done
  printf ' %8s   %s\n' "$total" "$res"
  if [[ $partial -eq 0 ]]; then echo "$t $total $res" >>"$SUMMARY"; fi
done

echo
echo "kernels only (ms), fastest first:"
sort -k2 -n "$SUMMARY" | awk 'NR==1{base=$2} {printf "  %-12s %6d ms  %5.1fx\n", $1, $2, (base>0)?$2/base:1}'
