// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));

/**
 * The documentation is one directory of the GitHub Pages site of the
 * repository. The playground holds the root, the games site holds /games/ and
 * this site holds /docs/.
 */
export default defineConfig({
  site: "https://terotests.github.io",
  base: "/Ranger/docs/",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "Ranger",
      // The Ranger mark: the gold R in a shield. The source of the file is
      // ranger-vscode-extension/icons/ranger-file-icon.svg.
      favicon: "/favicon.svg",
      logo: {
        src: "./public/favicon.svg",
        alt: "The Ranger mark",
      },
      head: [
        // An SVG favicon needs Safari 16 or a later version. The PNG is the
        // fallback, and the apple-touch-icon is the mark on an iOS home screen.
        {
          tag: "link",
          attrs: { rel: "icon", type: "image/png", sizes: "32x32", href: "/Ranger/docs/favicon-32.png" },
        },
        {
          tag: "link",
          attrs: { rel: "apple-touch-icon", sizes: "180x180", href: "/Ranger/docs/apple-touch-icon.png" },
        },
      ],
      description:
        "Technical documentation of the Ranger language and of its compiler. " +
        "The operator reference is generated from the compiler sources.",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/terotests/Ranger" },
      ],
      editLink: {
        baseUrl: "https://github.com/terotests/Ranger/edit/master/docs/site/",
      },
      lastUpdated: true,
      customCss: ["./src/styles/docs.css"],
      components: {
        Footer: "./src/components/Footer.astro",
      },
      sidebar: [
        {
          label: "Start",
          items: [
            { label: "About this documentation", slug: "index" },
            { label: "Install the compiler", slug: "start/install" },
            { label: "The first program", slug: "start/first-program" },
            { label: "Questions and answers", slug: "faq" },
          ],
        },
        {
          label: "Language",
          items: [
            { label: "Program structure", slug: "language/structure" },
            { label: "Types", slug: "language/types" },
            { label: "Strings", slug: "language/strings" },
            { label: "Optional values", slug: "language/optionals" },
            { label: "Ownership and lifetime", slug: "language/ownership" },
            { label: "Operators", slug: "language/operators" },
          ],
        },
        {
          label: "Targets",
          items: [
            { label: "Target languages", slug: "targets/overview" },
            { label: "Memory and ownership", slug: "targets/memory" },
          ],
        },
        {
          label: "Operator reference",
          items: [{ autogenerate: { directory: "reference/operators" } }],
        },
        {
          label: "Library operators",
          items: [{ autogenerate: { directory: "reference/libraries" } }],
        },
        {
          label: "Type methods",
          items: [{ autogenerate: { directory: "reference/methods" } }],
        },
        {
          label: "Reference data",
          items: [
            { label: "Macros", slug: "reference/macros" },
            { label: "Coverage", slug: "reference/coverage" },
            { label: "Not covered", slug: "reference/not-covered" },
          ],
        },
        {
          label: "Contributing",
          items: [
            { label: "How to add to the reference", slug: "contributing/documentation" },
            { label: "Writing rules", slug: "contributing/writing-rules" },
          ],
        },
      ],
    }),
  ],
  vite: {
    define: {
      __RANGER_VERSION__: JSON.stringify(pkg.version),
    },
  },
});
