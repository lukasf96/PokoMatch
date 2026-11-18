import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getPageMetadata, prerenderRoutes } from "../src/router/metadata";

interface ServerRenderResult {
  appHtml: string;
  styles: string;
}

interface ServerEntry {
  render(url: string): ServerRenderResult;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function pageHead(pathname: string, styles: string): string {
  const { title, description, canonicalUrl } = getPageMetadata(pathname);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "PokoMatch",
        alternateName: ["pokomatch.com", "Poko Match"],
        url: "https://pokomatch.com/",
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        name: "PokoMatch",
        url: canonicalUrl,
        applicationCategory: "GameApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        description,
        about: { "@type": "Thing", name: "Pokémon Pokopia" },
        featureList: [
          "Habitat roommate Match Maker",
          "Habitat and favorites Insights",
          "Standard, Event, and Basin Pokédex tracking",
          "Bubbly Basin Expansion Pass support",
          "Local browser save, no account required",
        ],
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  };
  const jsonLd = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    '<meta property="og:site_name" content="PokoMatch" />',
    '<meta property="og:locale" content="en_US" />',
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    '<meta property="og:image" content="https://pokomatch.com/og-image.png" />',
    '<meta property="og:image:type" content="image/png" />',
    '<meta property="og:image:alt" content="PokoMatch Pokopia habitat planner screenshot" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    '<meta name="twitter:image" content="https://pokomatch.com/og-image.png" />',
    '<meta name="twitter:image:alt" content="PokoMatch Pokopia habitat planner screenshot" />',
    `<script type="application/ld+json">${jsonLd}</script>`,
    styles,
  ].join("\n    ");
}

async function prerender(): Promise<void> {
  const root = process.cwd();
  const clientDirectory = resolve(root, "dist");
  const template = await readFile(resolve(clientDirectory, "index.html"), "utf8");
  const serverEntryUrl = pathToFileURL(
    resolve(root, "dist-ssr", "entry-server.js"),
  ).href;
  const { render } = (await import(serverEntryUrl)) as ServerEntry;

  for (const pathname of prerenderRoutes) {
    const { appHtml, styles } = render(pathname);
    const html = template
      .replace("<!--page-head-->", pageHead(pathname, styles))
      .replace("<!--app-html-->", appHtml);
    const outputDirectory =
      pathname === "/"
        ? clientDirectory
        : resolve(clientDirectory, pathname.slice(1));
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(resolve(outputDirectory, "index.html"), html);
  }
}

void prerender();
