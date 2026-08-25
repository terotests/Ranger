// @ts-check
// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { execSync } from "node:child_process";

/**
 * Commit of the tree that the site describes. Source links pin to this ref so
 * a line number in the API reference stays correct when master moves.
 * The Pages workflow sets RANGER_COMMIT; a local build reads HEAD.
 */
function rangerCommit() {
  const fromEnv = (process.env.RANGER_COMMIT || "").trim();
  if (fromEnv) {
    return fromEnv;
  }
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const commit = rangerCommit();
if (commit && !process.env.RANGER_COMMIT) {
  process.env.RANGER_COMMIT = commit;
}

/**
 * The Office documentation is one directory of the GitHub Pages site.
 * The playground holds /office/, the generated HTML dump holds
 * /office/reference/, and this site holds /office/docs/.
 *
 * It lives under gallery/ rather than under docs/ because the pages quote
 * AGPL sources — see gallery/office/docs/README.md.
 */
export default defineConfig({
  site: "https://terotests.github.io",
  base: "/Ranger/office/docs/",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "Office",
      favicon: "/favicon.svg",
      logo: {
        src: "./public/favicon.svg",
        alt: "The Ranger mark",
      },
      description:
        "Technical documentation of the Ranger Office applications: EVG, " +
        "Word, Excel, PowerPoint, charts and diagrams.",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/terotests/Ranger" },
      ],
      editLink: {
        baseUrl: "https://github.com/terotests/Ranger/edit/master/gallery/office/docs/site/",
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
            { label: "The Office stack", slug: "start/overview" },
            { label: "Licenses", slug: "start/licenses" },
          ],
        },
        {
          label: "The glue",
          items: [{ label: "EVG", slug: "evg" }],
        },
        {
          label: "Applications",
          items: [
            { label: "PowerPoint", slug: "powerpoint" },
            { label: "Charts", slug: "charts" },
            { label: "Word", slug: "word" },
            { label: "Excel", slug: "excel" },
            { label: "Diagrams", slug: "diagrams" },
          ],
        },
        {
          label: "API reference",
          items: [{ autogenerate: { directory: "reference" } }],
        },
      ],
    }),
  ],
  vite: {
    define: {
      "import.meta.env.RANGER_COMMIT": JSON.stringify(commit),
    },
  },
});
