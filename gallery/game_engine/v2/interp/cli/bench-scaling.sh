#!/usr/bin/env bash
# Is an operation LINEAR in its input, or quadratic?
#
#   bash gallery/game_engine/v2/interp/cli/bench-scaling.sh
#
# bench-cpu.sh answers "how much slower than QuickJS"; this answers "does the
# gap grow with N", which is a different and usually more important question.
# A constant factor is an interpreter being an interpreter. A factor that
# doubles when N doubles is a bug, and it is invisible in a single timing.
#
# Read the RATIO column: ~2x per doubling is linear, ~4x is quadratic.
set -u
cd "$(dirname "$0")/../../../../.."
RANGERJS="${RANGERJS:-$(pwd)/gallery/game_engine/v2/interp/bin/cpp/rangerjs}"
QJS="${QJS:-qjs}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

probe() {
  local name="$1" tpl="$2"; shift 2
  local prev=0
  printf '%-24s' "$name"
  for n in "$@"; do
    echo "$tpl" | sed "s/__N__/$n/g" > "$TMP/p.js"
    local s e ms q qs qe
    s=$(date +%s%N); timeout 300 "$RANGERJS" "$TMP/p.js" >/dev/null 2>&1; e=$(date +%s%N)
    ms=$(( (e-s)/1000000 ))
    qs=$(date +%s%N); timeout 300 "$QJS" --script "$TMP/p.js" >/dev/null 2>&1; qe=$(date +%s%N)
    q=$(( (qe-qs)/1000000 ))
    if [ "$prev" -gt 0 ]; then
      printf ' | N=%-6s %7sms (%sx) qjs %4sms' "$n" "$ms" "$(python3 -c "print(round($ms/max($prev,1),1))")" "$q"
    else
      printf ' | N=%-6s %7sms       qjs %4sms' "$n" "$ms" "$q"
    fi
    prev=$ms
  done
  echo
}

echo "ratio is vs the previous N: ~2x = linear, ~4x = quadratic"
echo
probe "array push" 'var a=[];for(var i=0;i<__N__;i++){a.push(i);}console.log(a.length);' 10000 20000 40000
probe "array a[i] read" 'var a=[];for(var i=0;i<__N__;i++){a.push(i);}var s=0;for(var i=0;i<__N__;i++){s+=a[i];}console.log(s);' 10000 20000 40000
probe "array a[i] write" 'var a=[];for(var i=0;i<__N__;i++){a.push(0);}for(var i=0;i<__N__;i++){a[i]=i;}console.log(a.length);' 10000 20000 40000
probe "Map.set" 'var m=new Map();for(var i=0;i<__N__;i++){m.set("k"+i,i);}console.log(m.size);' 4000 8000 16000
probe "Set.add" 'var s=new Set();for(var i=0;i<__N__;i++){s.add("k"+i);}console.log(s.size);' 4000 8000 16000
probe "JSON.stringify" 'var r=[];for(var i=0;i<__N__;i++){r.push({id:i,name:"r"+i});}console.log(JSON.stringify(r).length);' 2000 4000 8000
probe "JSON.parse" 'var r=[];for(var i=0;i<__N__;i++){r.push({id:i});}var t=JSON.stringify(r);console.log(JSON.parse(t).length);' 2000 4000 8000
probe "object property add" 'var o={};for(var i=0;i<__N__;i++){o["k"+i]=i;}console.log(Object.keys(o).length);' 2000 4000 8000
probe "string concat" 'var s="";for(var i=0;i<__N__;i++){s+="ab";}console.log(s.length);' 20000 40000 80000
