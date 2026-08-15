#!/usr/bin/env bash
set -u
out=$(RANGER_LIB=./compiler/Lang.rgr node bin/output.js "$@" 2>&1)
if echo "$out" | grep -q "Compilation FAILED"; then echo FAILED; echo "$out" | grep -B 6 "Compilation FAILED" | head -14; exit 1; fi
echo ok
