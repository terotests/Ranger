#!/usr/bin/env bash
# Locate a C++ compiler that can build Ranger output that uses
# `-cpp-single-thread` (libstdc++ internals: std::__shared_ptr +
# __gnu_cxx::_S_single).
#
# Apple's Command Line Tools ship `g++` as a clang++ wrapper over libc++, which
# does not provide those symbols — so a bare `command -v g++` is not enough on
# macOS. This script probes real candidates and reports what will work.
#
# Usage (source from another script):
#   # shellcheck source=scripts/cpp-toolchain.sh
#   . "$(dirname "$0")/cpp-toolchain.sh"
#   cpp_toolchain_resolve          # sets: CXX, CXX_KIND, CXX_VERSION,
#                                  #        CXX_SUPPORTS_SINGLE_THREAD (0|1)
#
# Usage (CLI):
#   bash scripts/cpp-toolchain.sh            # human report; exit 0 if any g++-like
#   bash scripts/cpp-toolchain.sh --require-single-thread
#                                            # exit 1 unless libstdc++ _S_single works
#   bash scripts/cpp-toolchain.sh --print-cxx
#                                            # print selected compiler path only
#
# Env overrides:
#   CXX   Prefer this compiler if it is on PATH / is an absolute path.

# Probe snippet: the exact aliases Ranger emits for -cpp-single-thread.
_CPP_SINGLE_THREAD_PROBE='
#include <memory>
template<class T> using rg_ptr = std::__shared_ptr<T, __gnu_cxx::_S_single>;
template<class T> using rg_weak_ptr = std::__weak_ptr<T, __gnu_cxx::_S_single>;
template<class T> using rg_esft = std::__enable_shared_from_this<T, __gnu_cxx::_S_single>;
template<class T, class... A> inline rg_ptr<T> rg_make(A&&... a) {
    return std::__allocate_shared<T, __gnu_cxx::_S_single>(
        std::allocator<T>(), std::forward<A>(a)...);
}
struct S : rg_esft<S> {};
int main() {
    rg_ptr<S> p = rg_make<S>();
    rg_weak_ptr<S> w = p;
    (void)w;
    return p ? 0 : 1;
}
'

cpp_toolchain_candidates() {
  # Prefer an explicit CXX, then versioned Homebrew/system GCC, then plain g++.
  local c
  if [ -n "${CXX:-}" ]; then
    printf '%s\n' "$CXX"
  fi
  for c in g++-15 g++-14 g++-13 g++-12 g++-11 g++-10 g++ c++; do
    printf '%s\n' "$c"
  done
}

# Returns 0 if $1 can compile the -cpp-single-thread prelude against libstdc++.
cpp_compiler_supports_single_thread() {
  local cc="$1"
  local tmpdir probe out
  if ! command -v "$cc" >/dev/null 2>&1 && [ ! -x "$cc" ]; then
    return 1
  fi
  tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/rgr-cxx-probe.XXXXXX")"
  probe="$tmpdir/probe.cpp"
  out="$tmpdir/probe"
  printf '%s\n' "$_CPP_SINGLE_THREAD_PROBE" >"$probe"
  # -std=c++17 matches the engine build. Suppress noisy diagnostics; we only
  # care about success/failure.
  if "$cc" -std=c++17 -O0 "$probe" -o "$out" >/dev/null 2>&1; then
    rm -rf "$tmpdir"
    return 0
  fi
  rm -rf "$tmpdir"
  return 1
}

cpp_compiler_version_line() {
  local cc="$1"
  # Prefer --version; fall back to -v's first line.
  if "$cc" --version >/dev/null 2>&1; then
    "$cc" --version 2>/dev/null | head -n 1
  else
    "$cc" -v 2>&1 | head -n 1
  fi
}

cpp_compiler_kind() {
  local line="$1"
  case "$line" in
    *"Apple"*|*"apple clang"*|*"Apple clang"*)
      echo "apple-clang (libc++)"
      ;;
    *"Homebrew GCC"*|*"Free Software Foundation"*|g++*|*"GCC"*)
      echo "gcc (libstdc++)"
      ;;
    *"clang"*|*"Clang"*)
      echo "clang"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

# Resolve CXX / CXX_KIND / CXX_VERSION / CXX_SUPPORTS_SINGLE_THREAD.
#
# If the caller already set CXX, that compiler is used (pin). Otherwise pick the
# first candidate that supports -cpp-single-thread; if none do, the first
# compiler that exists at all (caller may fall back to atomic shared_ptr).
cpp_toolchain_resolve() {
  local pinned="${CXX:-}"
  CXX=""
  CXX_KIND=""
  CXX_VERSION=""
  CXX_SUPPORTS_SINGLE_THREAD=0
  CXX_FALLBACK=""
  CXX_FALLBACK_KIND=""
  CXX_FALLBACK_VERSION=""

  local cand path line kind seen=""
  # Pinned CXX: resolve that one only.
  if [ -n "$pinned" ]; then
    if ! command -v "$pinned" >/dev/null 2>&1 && [ ! -x "$pinned" ]; then
      echo "cpp-toolchain: CXX=$pinned not found on PATH" >&2
      return 1
    fi
    path="$(command -v "$pinned" 2>/dev/null || true)"
    [ -z "$path" ] && path="$pinned"
    line="$(cpp_compiler_version_line "$path")"
    kind="$(cpp_compiler_kind "$line")"
    CXX="$path"
    CXX_KIND="$kind"
    CXX_VERSION="$line"
    if cpp_compiler_supports_single_thread "$path"; then
      CXX_SUPPORTS_SINGLE_THREAD=1
    else
      CXX_SUPPORTS_SINGLE_THREAD=0
    fi
    return 0
  fi

  while IFS= read -r cand; do
    [ -z "$cand" ] && continue
    # De-dupe when the same name appears twice in the candidate list.
    case " $seen " in
      *" $cand "*) continue ;;
    esac
    seen="$seen $cand"

    if ! command -v "$cand" >/dev/null 2>&1 && [ ! -x "$cand" ]; then
      continue
    fi
    path="$(command -v "$cand" 2>/dev/null || true)"
    [ -z "$path" ] && path="$cand"
    line="$(cpp_compiler_version_line "$path")"
    kind="$(cpp_compiler_kind "$line")"

    if [ -z "$CXX_FALLBACK" ]; then
      CXX_FALLBACK="$path"
      CXX_FALLBACK_KIND="$kind"
      CXX_FALLBACK_VERSION="$line"
    fi

    if cpp_compiler_supports_single_thread "$path"; then
      CXX="$path"
      CXX_KIND="$kind"
      CXX_VERSION="$line"
      CXX_SUPPORTS_SINGLE_THREAD=1
      return 0
    fi
  done < <(cpp_toolchain_candidates)

  if [ -n "$CXX_FALLBACK" ]; then
    CXX="$CXX_FALLBACK"
    CXX_KIND="$CXX_FALLBACK_KIND"
    CXX_VERSION="$CXX_FALLBACK_VERSION"
    CXX_SUPPORTS_SINGLE_THREAD=0
    return 0
  fi
  return 1
}

cpp_toolchain_macos_hint() {
  cat <<'EOF'
On macOS, Apple's `g++` is clang + libc++ and cannot build -cpp-single-thread
output (std::__shared_ptr / __gnu_cxx::_S_single are libstdc++ internals).

  brew install gcc
  # then either leave CXX unset (this script prefers g++-14 / g++-13 / …)
  # or: export CXX=$(brew --prefix gcc)/bin/g++-14

Without Homebrew GCC the C++ engine still builds, but without
-cpp-single-thread (atomic std::shared_ptr — slower copies, same semantics).
EOF
}

cpp_toolchain_report() {
  local require_st="${1:-0}"
  echo "C++ toolchain check (for Ranger -cpp-single-thread / jsengine:build)"
  echo "------------------------------------------------------------------"

  if ! cpp_toolchain_resolve; then
    echo "No C++ compiler found on PATH (looked for g++-15 … g++-10, g++, c++)."
    echo
    echo "Install one of:"
    echo "  macOS:   brew install gcc"
    echo "  Ubuntu:  sudo apt install g++"
    echo "  Fedora:  sudo dnf install gcc-c++"
    return 1
  fi

  echo "selected:  $CXX"
  echo "version:   $CXX_VERSION"
  echo "kind:      $CXX_KIND"
  if [ "$CXX_SUPPORTS_SINGLE_THREAD" = "1" ]; then
    echo "rg_ptr:    OK  (libstdc++ __shared_ptr + _S_single)"
    echo "flag:      -cpp-single-thread will be used"
  else
    echo "rg_ptr:    NO  (compiler has no libstdc++ _S_single)"
    echo "flag:      -cpp-single-thread will be omitted (atomic std::shared_ptr)"
    echo
    if [ "$(uname -s)" = "Darwin" ]; then
      cpp_toolchain_macos_hint
    else
      echo "Install a recent GCC (g++) that links libstdc++, or set CXX to it."
    fi
  fi

  if [ "$require_st" = "1" ] && [ "$CXX_SUPPORTS_SINGLE_THREAD" != "1" ]; then
    return 1
  fi
  return 0
}

# CLI entry when executed (not sourced).
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  set -e
  MODE="report"
  REQUIRE_ST=0
  for arg in "$@"; do
    case "$arg" in
      --require-single-thread) REQUIRE_ST=1 ;;
      --print-cxx) MODE="print-cxx" ;;
      --help|-h)
        sed -n '2,30p' "$0"
        exit 0
        ;;
      *)
        echo "unknown option: $arg" >&2
        exit 2
        ;;
    esac
  done
  case "$MODE" in
    print-cxx)
      cpp_toolchain_resolve
      printf '%s\n' "$CXX"
      if [ "$REQUIRE_ST" = "1" ] && [ "$CXX_SUPPORTS_SINGLE_THREAD" != "1" ]; then
        exit 1
      fi
      ;;
    *)
      cpp_toolchain_report "$REQUIRE_ST"
      ;;
  esac
fi
