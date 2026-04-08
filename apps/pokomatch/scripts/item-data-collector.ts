import * as cheerio from "cheerio";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  APP_ROOT,
  SEREBII_ROBOTS_URL,
  SEREBII_URLS,
  absolutizeSerebiiHrefFromPage,
  assertSerebiiRobotsAndGap,
  fetchText,
  isPathAllowedByRobots,
  parseOutPathCli,
  sleep,
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

/**
 * Parse a single item's detail page for favorite categories.
 *
 * Structure (inside table.tab):
 *   Row: fooevo headers "Category | Tag | Paintable | Requirements"
 *   Row: cen data      [category] [tag] [paintable] [requirements]
 *   Row: fooevo headers "Trade Value (colspan=2) | Favorite Categories (colspan=2)"
 *   Row: cen data      [trade value] [favorite categories — links to /pokemonpokopia/favorites/…]
 */
function parseItemDetail(html: string): { favoriteCategories: string[] } {
  const $ = cheerio.load(html);

  const favoriteCategories: string[] = [];

  $("table.tab tr").each((_, tr) => {
    const cells = $(tr).children("td");

    // Look for the header row that contains "Favorite Categories"
    let favHeaderIdx = -1;
    cells.each((i, td) => {
      if ($(td).hasClass("fooevo") && $(td).text().includes("Favorite Categories")) {
        favHeaderIdx = i;
      }
    });

    if (favHeaderIdx < 0) return;

    // The next sibling row holds the data
    const dataRow = $(tr).next("tr");
    const dataCells = dataRow.children("td");

    // Favorite categories cell is at the same relative position among data cells.
    // Header has [Trade Value colspan=2] [Favorite Categories colspan=2].
    // Data has [trade-value td colspan=2] [favorites td colspan=2].
    // So favorites data cell is index 1.
    const favCell = $(dataCells[1]);

    favCell.find("a[href]").each((__, a) => {
      const href = $(a).attr("href") ?? "";
      if (!href.includes("/pokemonpokopia/favorites/")) return;
      const label =
        $(a).find("u").first().text().trim() || $(a).text().trim();
      if (label) favoriteCategories.push(label);
    });

    return false; // stop after first match
  });

  return { favoriteCategories };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const outPath = parseOutPathCli(argv) ?? DEFAULT_OUT_PATH;

  const { group: robotsGroup, serebiiGapMs } = await assertSerebiiRobotsAndGap({
    mustCheckUrls: [SEREBII_URLS.itemsOverview, SEREBII_ROBOTS_URL],
  });

  console.error(`Reading items overview: ${SEREBII_URLS.itemsOverview}`);
  await sleep(serebiiGapMs);
  const overviewHtml = await fetchText(SEREBII_URLS.itemsOverview);
  const listRows = parseItemsOverview(overviewHtml);
  console.error(`Found ${String(listRows.length)} items in overview.`);

  const items: ItemEntry[] = [];

  for (let i = 0; i < listRows.length; i++) {
    const row = listRows[i]!;
    const urlObj = new URL(row.detailUrl);

    writeTerminalProgressLine(
      process.stderr,
      `[items ${String(i + 1)}/${String(listRows.length)}] ${row.name}…`,
    );
    await sleep(serebiiGapMs);

    let favoriteCategories: string[] = [];

    try {
      if (!isPathAllowedByRobots(robotsGroup, urlObj.pathname)) {
        console.error(
          `\nrobots.txt disallows collecting ${urlObj.pathname}; skipping favorites for ${row.name}.`,
        );
      } else {
        const html = await fetchText(row.detailUrl);
        favoriteCategories = parseItemDetail(html).favoriteCategories;
      }
    } catch (err) {
      console.error(`\nFailed ${urlObj.pathname}:`, err);
    }

    items.push({
      id: toItemId(row.name),
      name: row.name,
      category: row.category,
      tag: row.tag,
      favoriteCategories,
    });
  }
  process.stderr.write("\n");

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
