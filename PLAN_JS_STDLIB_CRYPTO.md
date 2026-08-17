# PLAN_JS_STDLIB — Crypto

Sub-plan of [PLAN_JS_STDLIB.md](PLAN_JS_STDLIB.md). Covers phase **6**.
Depends on `RgU32` (phase 2, [MATH](PLAN_JS_STDLIB_MATH.md)) and `RgStr`
(phase 1, [TEXT](PLAN_JS_STDLIB_TEXT.md)).

This is the one sub-plan that is **not** a migration. The engine has no `crypto`
namespace at all — grepping `ComponentEngine.rgr` for `randomUUID`,
`getRandomValues` or `subtle` returns nothing. So this phase adds a capability
the repository does not have, in both directions at once, which makes it the best
demonstration of the architecture and the one with the most room to be wrong.

---

## 1. What exists today, and why it is not enough

| Thing | Where | Limits |
| --- | --- | --- |
| `sha256` operator | `compiler/Lang.rgr:782` | hex string of a `string` input. No byte input, no streaming, no HMAC. Eight separate per-target implementations (es6 `require('crypto')`, Go `_r_sha256`, C++ `rg_sha256_hex`, Python `hashlib`, Dart polyfill, PHP `hash`, …) that must agree and are checked only by `tests/fixtures/rust_fs_ops.rgr` printing one digest |
| `md5` operator | `compiler/Lang.rgr:1019` | same shape, fewer targets, and MD5 |
| `lib/Crypto.rgr` | 90 lines | `java7` AES + `es6` `getRandomValues`. Nine of the ten operators have a `java7` template and nothing else. Effectively dead |
| `random` operator | `compiler/Lang.rgr:541` | `Math.random()` on es6, `mt19937` on C++. **Not** a CSPRNG anywhere |

So: one digest, hex-only, string-only, on some targets; and no secure random at
all. A Ranger program that needs an HMAC, a SHA-512, a PBKDF2, a UUID, or a
random token has nothing to call.

## 2. Scope, and one thing deliberately excluded

**In scope for v1:**

- Digests: SHA-256, SHA-384, SHA-512, SHA-1, MD5
- HMAC over any of them
- PBKDF2-HMAC-SHA256 / SHA512
- CSPRNG bytes, `randomUUID` (RFC 9562 v4), bounded random integers
- Encodings: hex, base64, base64url, and the UTF-8 conversion they all need
- Constant-time byte comparison

**Out of scope for v1: AES, RSA, elliptic curves — anything that provides
confidentiality.**

The reason is not effort. A cipher written as portable high-level Ranger and
compiled to ten languages has no way to promise constant-time behaviour: table
lookups become whatever each target's array indexing does, branches become
whatever each optimiser leaves, and the resulting timing and cache side channels
are invisible to every test in this plan. Shipping "portable AES" would be
shipping something that *looks* like a cipher and leaks keys on an unknown subset
of targets. That is worse than shipping nothing, because nothing is obviously
nothing.

If symmetric crypto is wanted later, the honest route is per-target host
operators over each platform's vetted library — Web Crypto, `crypto/aes`,
`System.Security.Cryptography`, `javax.crypto`, OpenSSL — with the operator's `*`
template failing rather than falling back. That is a different plan, and it does
not disturb any signature here.

Digests and HMAC are a different case: they operate on data whose secrecy the
digest is not protecting, and the one place timing matters — comparing an HMAC
tag — is handled explicitly by `RgCrypto.timingSafeEqual` (§6). This distinction
belongs in `lib/core/README.md`, not only here, because it is exactly what someone
reaching for `RgCrypto` needs to know.

## 3. Bytes: the representation decision

Everything hashes bytes, so the byte representation is the first decision and it
constrains every signature.

**`[int]`, each element `0..255`.** Not `string`, because a Ranger string is
bytes on some targets and code points on others (see
[TEXT §1](PLAN_JS_STDLIB_TEXT.md)) and a digest over "the string" would then be a
digest over different input per target — which is precisely the class of bug this
whole plan exists to prevent. Not a fixed-width array type either: `u8` exists
(`tests/compiler-fixed-width-types.test.ts`) but is not exercised broadly enough
across ten targets to build a foundation on, and `[int]` is what `RgStr`,
`RgU32` and the existing engine code already speak.

The cost is memory — an `[int]` of 32-bit or 64-bit ints per byte. For digests
over document-sized inputs that is acceptable; the streaming API (§5) is what
keeps it from mattering for large inputs, since the block buffer is 64 or 128
entries regardless of input size.

`RgStr.toUtf8Bytes` / `fromUtf8Bytes` (landed in phase 1) are the only bridge
between strings and bytes, so there is exactly one place where the string model
is dealt with.

## 4. `RgEntropy` — the capability, and why it must fail loudly

Two new operators in `compiler/Lang.rgr`.

```
secure_random_available _:boolean ()
secure_random_bytes     _:[int]   (n:int)
```

Per-target templates:

| Target | Source |
| --- | --- |
| es6 | `crypto.randomBytes(n)` under Node, `crypto.getRandomValues` in a browser |
| go | `crypto/rand.Read` |
| python | `secrets.token_bytes(n)` |
| csharp | `RandomNumberGenerator.GetBytes(n)` |
| kotlin / java7 | `java.security.SecureRandom.nextBytes` |
| swift6 | `SystemRandomNumberGenerator` |
| dart | `Random.secure()` |
| rust | read `/dev/urandom` via `std::fs` — no external crate, so the polyfill stays self-contained; Windows would need `BCryptGenRandom` and is left unavailable rather than guessed |
| cpp | `/dev/urandom` via `<fstream>`; **not** `std::random_device`, which is permitted to be a deterministic PRNG and is on some libstdc++ builds |
| `*` | `false` / raise |

The `*` template is the important row. It must not fall back to the `random`
operator, and it must not return zeros. A CSPRNG that silently degrades produces
keys and tokens that look fine, pass every test in this plan, and are
predictable — and the failure is undetectable from the output. A build error, or a
thrown Ranger error, is detectable. So:

- `secure_random_available` is `false` on any target without a real source.
- `secure_random_bytes` on such a target raises.
- `RgCrypto.randomBytes` checks `available()` and returns an `RgBytesResult` with
  `errorKind = "NotSupportedError"` rather than data.
- The generated `crypto.getRandomValues` binding turns that into the JS
  `NotSupportedError` that Web Crypto specifies for exactly this case.

A separate cross-target gate asserts this: on a target where the operator is
stubbed, the vector run must **fail**, and the test asserts that it failed. A
"loud failure" that nothing checks is just a comment.

`RgCrypto.randomBytes` never touches `RgMath.random`, and `RgMath.random`'s doc
comment points here. There is no bridge between them in either direction.

## 5. `lib/core/RgBase.rgr` — encodings

Needed by `RgCrypto`, and independently useful — `btoa`/`atob` are in the engine's
global list and there is no portable base64 in Ranger at all.

```ranger
class RgBase {
    sfn hexEncode:string (bytes:[int])
    sfn hexDecode:RgBytesResult (s:string)
    sfn base64Encode:string (bytes:[int])
    sfn base64Decode:RgBytesResult (s:string)      ; strict padding
    sfn base64UrlEncode:string (bytes:[int])       ; -_ alphabet, no padding
    sfn base64UrlDecode:RgBytesResult (s:string)
}

class RgBytesResult {
    def ok:boolean false
    def value:[int]
    def errorKind:string ""                        ; InvalidCharacterError, …
    def errorMessage:string ""
}
```

`btoa`/`atob` map onto `base64Encode`/`base64Decode` in the manifest with the
Annex-B latin1 quirk handled in the binding, since that quirk is about JS string
semantics and not about base64.

## 6. `lib/core/RgCrypto.rgr`

### 6.1 Streaming digests

An instance per digest, because `update`/`digest` is what lets a caller hash a
file without materialising it — and because the one-shot form is then two lines
on top of it rather than a second implementation.

```ranger
class RgDigest {
    ; kind: "SHA-256" "SHA-384" "SHA-512" "SHA-1" "MD5"
    sfn create:RgDigest (kind:string)
    fn update:RgDigest (bytes:[int])               ; returns this, so it chains
    fn updateString:RgDigest (s:string)            ; UTF-8, via RgStr
    fn digest:[int] ()                             ; finalises; call once
    fn digestHex:string ()
    fn blockSize:int ()                            ; 64 or 128; HMAC needs it
    fn outputSize:int ()
}

class RgCrypto {
    ; --- one-shot ---
    sfn sha256:[int] (bytes:[int])
    sfn sha256Hex:string (bytes:[int])
    sfn sha384:[int] (bytes:[int])
    sfn sha512:[int] (bytes:[int])
    sfn sha1:[int] (bytes:[int])                   ; legacy: not collision-resistant
    sfn md5:[int] (bytes:[int])                    ; legacy: broken; checksums only
    sfn digestOf:[int] (kind:string bytes:[int])

    ; --- HMAC (RFC 2104) ---
    sfn hmac:[int] (kind:string key:[int] msg:[int])
    sfn hmacHex:string (kind:string key:[int] msg:[int])

    ; --- KDF (RFC 8018) ---
    sfn pbkdf2:[int] (kind:string password:[int] salt:[int] iterations:int dkLen:int)

    ; --- random ---
    sfn randomBytes:RgBytesResult (n:int)
    sfn randomUUID:RgStrResult ()                  ; RFC 9562 v4
    sfn randomIntBelow:int (bound:int)             ; rejection sampling, unbiased

    ; --- comparison ---
    ; Compares every byte before answering. Reads both arrays in full even when
    ; the lengths differ, so neither the position of the first difference nor the
    ; length leaks through timing. Use this for HMAC tags — never `==`.
    sfn timingSafeEqual:boolean (a:[int] b:[int])
}
```

`sha1` and `md5` carry the word "legacy" in their doc comments and in the
generated docs table. They exist because HMAC-SHA1 and MD5 checksums appear in
formats that have to be read, not because they should be used for anything new.
`compiler/Lang.rgr`'s `md5` operator stays for backward compatibility and its
comment gains a pointer here.

### 6.2 Implementation notes that matter

**Everything is `RgU32`.** SHA-256, SHA-1 and MD5 are 32-bit algorithms and map
directly onto `RgU32.add/xor/and/or/not/shl/shr/rotr/rotl` — which by
construction never touch `bit_ushr` or `bit_shr` (see
[MATH §2.1](PLAN_JS_STDLIB_MATH.md): `bit_ushr` is a 32-bit operator on es6, a
64-bit one on Go/Rust/C++/Swift, and a masked one on Python/Dart, so
`bit_ushr(-1, 28)` is `15`, `68719476735` and `15` respectively). A SHA-256
written naively against `bit_ushr` produces different digests on different
targets. This is the single most likely way for this phase to ship broken, and
`RgU32` existing first is the mitigation.

**SHA-512 uses 32-bit halves, not `int64`.** SHA-384/512 are defined over 64-bit
words. `int64` exists in `compiler/Lang.rgr`, but relying on 64-bit wrapping
arithmetic and 64-bit rotations behaving identically on ten targets — including
one where `int` is a double — is a bet this phase should not take. Each 64-bit
word is carried as a `(hi, lo)` pair of `RgU32` values with explicit carry
propagation. Slower, and provably the same everywhere, which is the trade this
whole plan makes.

**Message length is a `double`, not an `int`.** SHA appends the message length in
bits as a 64-bit big-endian field. A `double` holds byte counts exactly up to
2^53, which is far past any input a Ranger program will hash, and avoids assuming
anything about `int` width.

## 7. The JS side

A new `crypto` namespace in the engine, following Web Crypto's shape as far as
scope allows:

| JS | Core |
| --- | --- |
| `crypto.getRandomValues(typedArray)` | `RgCrypto.randomBytes`, written into the array's buffer |
| `crypto.randomUUID()` | `RgCrypto.randomUUID` |
| `crypto.subtle.digest(alg, data)` | `RgCrypto.digestOf`, wrapped in an already-resolved Promise |
| `crypto.subtle.sign("HMAC", key, data)` | `RgCrypto.hmac` |
| `crypto.subtle.importKey` (raw HMAC keys only) | a byte copy |
| `crypto.subtle.deriveBits("PBKDF2", …)` | `RgCrypto.pbkdf2` |
| `crypto.subtle.encrypt` / `decrypt` / `generateKey` for any cipher | **absent**, per §2 |
| `btoa` / `atob` | `RgBase.base64Encode` / `Decode` |

`crypto.subtle` returning resolved Promises is legitimate — the spec requires a
Promise, not asynchrony — and the engine already has `Promise` in its globals
(`ComponentEngine.rgr:40170`). `crypto` also has to appear in
`isEngineGlobalName` (`:40153`) and in the `gnames` seeding list of
`seedGlobalConstants` (`:40234`), which is two manifest flags rather than hand
edits once phase 0's generator covers namespace seeding.

Absent `subtle` operations are absent — the property does not exist — rather than
present and throwing. Feature detection is how JS code decides whether to use Web
Crypto, and a present-but-throwing method defeats it.

## 8. Vectors

Published test vectors, checked in as data, not generated by the implementation
under test:

| Set | Source |
| --- | --- |
| `sha2` | NIST FIPS 180-4 examples plus the SHA-2 CAVS short/long message sets |
| `sha1` | FIPS 180-4 |
| `md5` | RFC 1321 §A.5 |
| `hmac` | RFC 4231 (SHA-256/384/512) and RFC 2202 (SHA-1, MD5) |
| `pbkdf2` | RFC 6070 (SHA-1) plus the RFC 7914 SHA-256 vectors |
| `base` | RFC 4648 §10 for base64, base64url and hex, including every padding case |
| `blocks` | inputs at lengths 0, 1, 54, 55, 56, 63, 64, 65, 119, 120, 127, 128, 129 — the padding boundaries for both block sizes |
| `agree` | the same inputs through `RgCrypto.sha256Hex` **and** the existing `sha256` operator (`compiler/Lang.rgr:782`), which must agree on every target — this is also the first real test that the operator's eight implementations agree with each other |
| `randbias` | 100,000 `randomIntBelow(3)` draws; the counts must be within tolerance, which catches a modulo-biased rejection loop |
| `entropy-absent` | on a target with the operator stubbed, the run must fail and the test asserts the failure (§4) |

`blocks` and `agree` are the two that would catch a target-specific error. The
first exercises every padding branch; the second cross-checks against an
independent implementation that already ships.

## 9. Gate for phase 6

1. Every vector set in §8 green on native-vs-engine-vs-Node.
2. `sha2`, `hmac`, `pbkdf2`, `base` and `blocks` byte-identical on every target
   with a toolchain on `PATH` — this is the claim "available on all platforms"
   reduces to, and it is checked per algorithm rather than inferred.
3. `agree` green, i.e. `RgCrypto.sha256Hex` matches the `sha256` operator
   everywhere both exist.
4. `entropy-absent` green: the stubbed target fails, loudly, and the test says so.
5. `timingSafeEqual` reads both inputs in full — asserted by reading the
   generated output for each target, since this is a property of the emitted code
   rather than of the answer.
6. `lib/Crypto.rgr` marked superseded, with a pointer here; the `md5` and
   `sha256` operator comments in `compiler/Lang.rgr` likewise.
7. `lib/core/README.md` carries §2's scope statement — what this provides, what it
   does not, and why — where someone reaching for `RgCrypto` will read it.
