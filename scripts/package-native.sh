#!/usr/bin/env bash
# Turn a staged native build (scripts/build-native-compiler.sh) into
# distribution packages: a Debian .deb, and a Homebrew formula.
#
# Both assume the binary carries the library inside it (`--embed-lib`, the
# default), which is what makes the packages simple: one executable in
# /usr/bin or in the Homebrew prefix, no environment variable, no wrapper
# script, no library search path to get right. The .rgr sources are installed
# alongside anyway — under /usr/share/ranger — because reading them is how you
# find out what the compiler accepts, and a project that wants a patched one
# can copy them into its own directory, where they take precedence.
#
# Usage:
#   scripts/package-native.sh --dir tmp/native/ranger-3.3.1-linux-x64 [options]
#
# Options:
#   --dir DIR          staged directory (required)
#   --deb              build a .deb next to the staged directory (Linux)
#   --formula TAG      write a Homebrew formula for the release tarball of TAG
#   --repo OWNER/NAME  repository for the formula's url (default terotests/Ranger)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DIR=""
DEB=0
FORMULA_TAG=""
REPO="terotests/Ranger"

while [ $# -gt 0 ]; do
  case "$1" in
    --dir) DIR="$2"; shift ;;
    --deb) DEB=1 ;;
    --formula) FORMULA_TAG="$2"; shift ;;
    --repo) REPO="$2"; shift ;;
    --help|-h) sed -n '2,24p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

if [ -z "$DIR" ] || [ ! -d "$DIR" ]; then
  echo "--dir must name a staged build directory" >&2
  exit 2
fi
DIR="$(cd "$DIR" && pwd)"
PARENT="$(dirname "$DIR")"
BASE="$(basename "$DIR")"
VERSION="$(node -p "require('./package.json').version")"

# ---------------------------------------------------------------------- deb --
if [ "$DEB" = "1" ]; then
  case "$(uname -m)" in
    x86_64|amd64) DEB_ARCH="amd64" ;;
    aarch64|arm64) DEB_ARCH="arm64" ;;
    *) DEB_ARCH="$(uname -m)" ;;
  esac
  # The binary links libstdc++ statically, so glibc is the only dependency
  # worth naming, and dpkg-shlibdeps would need a full build environment to say
  # anything more precise than the build image's own floor.
  GLIBC="$(ldd --version 2>/dev/null | head -n 1 | awk '{print $NF}')"
  STAGE="$PARENT/deb/$BASE"
  rm -rf "$PARENT/deb"
  mkdir -p "$STAGE/DEBIAN" "$STAGE/usr/bin" "$STAGE/usr/share/ranger/lib" \
           "$STAGE/usr/share/doc/ranger-compiler"

  install -m 0755 "$DIR/rangerc" "$STAGE/usr/bin/rangerc"
  install -m 0644 "$DIR/Lang.rgr" "$STAGE/usr/share/ranger/Lang.rgr"
  install -m 0644 "$DIR/stdops.rgr" "$STAGE/usr/share/ranger/stdops.rgr"
  install -m 0644 "$DIR"/lib/*.rgr "$STAGE/usr/share/ranger/lib/"

  cat >"$STAGE/DEBIAN/control" <<EOF
Package: ranger-compiler
Version: $VERSION
Section: devel
Priority: optional
Architecture: $DEB_ARCH
Depends: libc6 (>= ${GLIBC:-2.35})
Maintainer: Tero Tolonen <teroktolonen@gmail.com>
Homepage: https://github.com/$REPO
Description: Ranger cross-language compiler
 Ranger compiles one typed source language to JavaScript, TypeScript, Python,
 Go, Rust, C++, C#, Kotlin, Swift, Dart, Java, PHP and Scala. The compiler is
 self-hosting: this binary is the compiler compiled to C++ by itself.
 .
 The standard library is compiled into the executable, so rangerc runs with no
 environment variable and no library path. The same .rgr sources are installed
 under /usr/share/ranger for reference; a copy in the working directory takes
 precedence over the built-in one.
EOF

  cat >"$STAGE/usr/share/doc/ranger-compiler/copyright" <<EOF
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: Ranger
Source: https://github.com/$REPO

Files: *
Copyright: Tero Tolonen
License: MIT
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 .
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 .
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
EOF

  # md5sums is not required but every package manager UI expects it.
  ( cd "$STAGE" && find usr -type f -exec md5sum {} + >DEBIAN/md5sums )

  DEB_FILE="$PARENT/ranger-compiler_${VERSION}_${DEB_ARCH}.deb"
  dpkg-deb --root-owner-group --build "$STAGE" "$DEB_FILE" >/dev/null
  echo "==> $DEB_FILE"
  dpkg-deb --info "$DEB_FILE" | sed -n '2,8p'

  if command -v lintian >/dev/null 2>&1; then
    lintian --no-tag-display-limit "$DEB_FILE" || true
  fi
fi

# ------------------------------------------------------------------ formula --
if [ -n "$FORMULA_TAG" ]; then
  TARBALL="$PARENT/$BASE.tar.gz"
  if [ ! -f "$TARBALL" ]; then
    echo "no tarball at $TARBALL — build with --tarball first" >&2
    exit 1
  fi
  if command -v shasum >/dev/null 2>&1; then
    SHA="$(shasum -a 256 "$TARBALL" | awk '{print $1}')"
  else
    SHA="$(sha256sum "$TARBALL" | awk '{print $1}')"
  fi
  FORMULA="$PARENT/ranger.rb"
  cat >"$FORMULA" <<EOF
# Homebrew formula for the Ranger compiler.
#
# Generated by scripts/package-native.sh for $FORMULA_TAG — copy it into a tap
# (a repository named homebrew-<something>, e.g. $(dirname "$REPO")/homebrew-ranger,
# under Formula/ranger.rb) and then:
#
#   brew tap $(dirname "$REPO")/ranger
#   brew install ranger
class Ranger < Formula
  desc "Ranger cross-language compiler"
  homepage "https://github.com/$REPO"
  url "https://github.com/$REPO/releases/download/$FORMULA_TAG/$BASE.tar.gz"
  sha256 "$SHA"
  license "MIT"
  version "$VERSION"

  def install
    bin.install "rangerc"
    # The library is compiled into the binary; these are installed so they can
    # be read and copied, not because rangerc needs them.
    pkgshare.install "Lang.rgr", "stdops.rgr", "lib"
  end

  test do
    (testpath/"hello.rgr").write <<~RANGER
      class HelloWorld {
          sfn m@(main):void () {
              print "Hello World"
          }
      }
    RANGER
    system bin/"rangerc", "-es6", "./hello.rgr", "-nodecli", "-d=./out", "-o=hello.js"
    assert_predicate testpath/"out/hello.js", :exist?
  end
end
EOF
  echo "==> $FORMULA"
  echo "    url    https://github.com/$REPO/releases/download/$FORMULA_TAG/$BASE.tar.gz"
  echo "    sha256 $SHA"
fi
