/** ESM view of the same package. The implementation is `index.cjs` — one copy,
 *  so the two entry points cannot drift. */
import mod from "./index.cjs";
export const { Pptx, Deck, Slide, Shape, Run, toRanger, fromRanger } = mod;
export default mod;
