/// <reference path="./engine.d.ts" />
//
// Shared numeric type aliases for game scripts on the TS → Ranger native path.
// TypeScript treats these as `number`; the emitter maps them to Ranger `int` or
// `double` when generating static game logic.
//
// Usage (optional today, groundwork for stricter emit + future validation):
//   /// <reference path="./game_native_types.ts" />
//   function step(dt: f64, score: i32) { ... }
//

/** Fixed-width integer fields (Ranger `int`). */
type i32 = number;
type u8 = number;
type u16 = number;
type u32 = number;

/** Floating-point physics / positions (Ranger `double`). */
type f64 = number;
type f32 = number;
