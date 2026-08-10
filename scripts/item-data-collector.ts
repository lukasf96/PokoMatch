import * as cheerio from "cheerio";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  APP_ROOT,
  DEFAULT_SEREBII_CONCURRENCY,
  SEREBII_ROBOTS_URL,
  SEREBII_URLS,
  absolutizeSerebiiHrefFromPage,
  assertSerebiiRobots,
  fetchText,
  isPathAllowedByRobots,
  mapWithConcurrency,
  parseOutPathCli,
  readPositiveIntegerEnv,
  writeTerminalProgressLine,
} from "./utility/script-utils";

const DEFAULT_OUT_PATH = path.join(APP_ROOT, "src", "assets", "items.json");

export interface ItemEntry {
  id: string;
  name: string;
  category: string;
  tag: string;
  favoriteCategories: string[];
}

export interface ItemsJson {
  generatedAt: string;
  items: ItemEntry[];
}

function toItemId(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ItemListRow {
  name: string;
  /** Section heading from the h2 above the table, e.g. "Materials", "Food". */
  category: string;
  /** Tag text from the 4th column (td.fooinfo index 3), often empty. */
  tag: string;
  /** Absolute URL to the item's detail page. */
  detailUrl: string;
}

interface FavoriteCategoryPage {
  name: string;
  url: string;
}

/**
 * Parse the items overview page.
 *
 * Structure:
 *   <h2><a name="materials"></a>List of Materials</h2>
 *   <table class="dextable">
 *     <tr> <td class="fooevo">Picture</td> <td>Name</td> <td>Description</td> <td>Tag</td> <td>Locations</td> </tr>
 *     <tr> <td class="cen"><a href="items/honey.shtml">…</a></td>
 *          <td class="cen"><a href="items/honey.shtml"><u>Honey</u></a></td>
 *          <td class="fooinfo">…description…</td>
 *          <td class="fooinfo">…tag or &nbsp;…</td>
 *          <td class="fooinfo">…locations…</td>
 *     </tr>
 *     …
 *   </table>
 */
function parseItemsOverview(html: string): ItemListRow[] {
  const $ = cheerio.load(html);
  const rows: ItemListRow[] = [];

  // Walk the main content: track the current category from h2 headings,
  // then parse each dextable that follows.
  let currentCategory = "";

  // Cheerio doesn't support sibling-based queries well; iterate the DOM linearly.
  $("h2, table.dextable").each((_, el) => {
    if (el.type !== "tag") return;

    if (el.name === "h2") {
      // "List of Materials" → "Materials"
      const text = $(el).text().replace(/\s+/g, " ").trim();
      const match = /^List of\s+(.+)$/i.exec(text);
      currentCategory = match ? match[1]!.trim() : text;
      return;
    }

    // table.dextable — iterate data rows (skip header rows whose first td is fooevo)
    $(el)
      .find("tr")
      .each((_, tr) => {
        const tds = $(tr).children("td");
        if (tds.length < 4) return;

        // Header rows have td.fooevo; data rows have td.cen
        const firstTd = $(tds[0]);
        if (firstTd.hasClass("fooevo")) return;

        // 2nd cell: name link
        const nameCell = $(tds[1]);
        const nameLink = nameCell.find("a[href]").first();
        const href = nameLink.attr("href");
        if (!href) return;

        const name =
          nameLink.find("u").first().text().trim() || nameLink.text().trim();
        if (!name) return;

        // 4th cell: tag (fooinfo, may be &nbsp;)
        const tag = $(tds[3]).text().replace(/\xa0/g, "").replace(/\s+/g, " ").trim();

        const detailUrl = absolutizeSerebiiHrefFromPage(
          href,
          SEREBII_URLS.itemsOverview,
        );

        rows.push({ name, category: currentCategory, tag, detailUrl });
      });
  });

  // Serebii lists Lost Relic items twice: once in their real category and again
  // under "Lost Relics (L/S)". Deduplicate by URL, keeping the first occurrence
  // (which is always the real-category entry, since sections appear top-to-bottom).
  const seenUrls = new Set<string>();
  return rows.filter((row) => {
    if (seenUrls.has(row.detailUrl)) return false;
    seenUrls.add(row.detailUrl);
    return true;
  });
}

function parseFavoriteCategoryPages(html: string): FavoriteCategoryPage[] {
  const $ = cheerio.load(html);
  const pages: FavoriteCategoryPage[] = [];
  const seenUrls = new Set<string>();

  $('a[href*="/pokemonpokopia/favorites/"]').each((_, a) => {
    const href = $(a).attr("href");
    const name = $(a).text().replace(/\s+/g, " ").trim();
    if (!href || !name) return;
    const url = absolutizeSerebiiHrefFromPage(
      href,
      SEREBII_URLS.favoritesOverview,
    );
    if (seenUrls.has(url)) return;
    seenUrls.add(url);
    pages.push({ name, url });
  });
  return pages;
}

function parseFavoriteCategoryItemUrls(html: string): Set<string> {
  const $ = cheerio.load(html);
  const urls = new Set<string>();
  $('a[href*="/pokemonpokopia/items/"]').each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    urls.add(
      absolutizeSerebiiHrefFromPage(href, SEREBII_URLS.favoritesOverview),
    );
  });
  return urls;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const outPath = parseOutPathCli(argv) ?? DEFAULT_OUT_PATH;

  const { group: robotsGroup } = await assertSerebiiRobots({
    mustCheckUrls: [
      SEREBII_URLS.itemsOverview,
      SEREBII_URLS.favoritesOverview,
      SEREBII_ROBOTS_URL,
    ],
  });
  const serebiiConcurrency = readPositiveIntegerEnv(
    "SEREBII_CONCURRENCY",
    DEFAULT_SEREBII_CONCURRENCY,
  );
  console.error(`Reading items overview: ${SEREBII_URLS.itemsOverview}`);
  const overviewHtml = await fetchText(SEREBII_URLS.itemsOverview);
  const listRows = parseItemsOverview(overviewHtml);
  console.error(`Found ${String(listRows.length)} items in overview.`);

  console.error(`Reading favorite categories: ${SEREBII_URLS.favoritesOverview}`);
  const favoritesHtml = await fetchText(SEREBII_URLS.favoritesOverview);
  const favoritePages = parseFavoriteCategoryPages(favoritesHtml);
  if (favoritePages.length === 0) {
    throw new Error("No favorite category pages found; Serebii markup may have changed.");
  }
  console.error(`Found ${String(favoritePages.length)} favorite categories.`);

  let completed = 0;
  const failures: string[] = [];
  const favoritePageResults = await mapWithConcurrency(
    favoritePages,
    serebiiConcurrency,
    async (page): Promise<Set<string>> => {
      const progress = ++completed;
      writeTerminalProgressLine(
        process.stderr,
        `[favorite categories ${String(progress)}/${String(favoritePages.length)}] ${page.name}…`,
      );
      try {
        const urlObj = new URL(page.url);
        if (!isPathAllowedByRobots(robotsGroup, urlObj.pathname)) {
          throw new Error(`robots.txt disallows ${urlObj.pathname}`);
        }
        const itemUrls = parseFavoriteCategoryItemUrls(
          await fetchText(page.url),
        );
        if (itemUrls.size === 0) {
          throw new Error("favorite category page contained no item links");
        }
        return itemUrls;
      } catch (err) {
        failures.push(`${page.name} (${page.url}): ${String(err)}`);
        return new Set<string>();
      }
    },
  );
  process.stderr.write("\n");

  if (failures.length > 0) {
    throw new Error(
      `Failed to collect ${String(failures.length)} favorite category page(s):\n${failures.join("\n")}`,
    );
  }

  const favoriteCategoriesByItemUrl = new Map<string, string[]>();
  for (const [index, itemUrls] of favoritePageResults.entries()) {
    const favoriteName = favoritePages[index]!.name;
    for (const itemUrl of itemUrls) {
      const names = favoriteCategoriesByItemUrl.get(itemUrl) ?? [];
      names.push(favoriteName);
      favoriteCategoriesByItemUrl.set(itemUrl, names);
    }
  }

  const items: ItemEntry[] = listRows.map((row) => ({
    id: toItemId(row.name),
    name: row.name,
    category: row.category,
    tag: row.tag,
    favoriteCategories: favoriteCategoriesByItemUrl.get(row.detailUrl) ?? [],
  }));

  const payload: ItemsJson = {
    generatedAt: new Date().toISOString(),
    items,
  };

  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outPath} (${String(payload.items.length)} items).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
