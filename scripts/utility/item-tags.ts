/**
 * Serebii sometimes pastes a free-text description into the Tag column.
 * Real tags are short shared labels (Food, Toy, Road, …). A phrase that
 * appears on only one item is almost certainly that scrape error — drop it
 * without hardcoding the broken text, which would rot if Serebii edits it.
 */
export const SINGLETON_PHRASE_TAG_MIN_WORDS = 3;

export interface DroppedPhraseTag {
  id: string;
  name: string;
  tag: string;
}

export function clearSingletonPhraseTags<
  T extends { id: string; name: string; tag: string },
>(items: readonly T[]): { items: T[]; dropped: DroppedPhraseTag[] } {
  const counts = new Map<string, number>();
  for (const item of items) {
    const tag = item.tag.trim();
    if (!tag) continue;
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  const dropped: DroppedPhraseTag[] = [];
  const next = items.map((item) => {
    const tag = item.tag.trim();
    if (!tag) return item;
    if ((counts.get(tag) ?? 0) > 1) return item;
    if (tag.split(/\s+/).length < SINGLETON_PHRASE_TAG_MIN_WORDS) return item;
    dropped.push({ id: item.id, name: item.name, tag: item.tag });
    return { ...item, tag: "" };
  });
  return { items: next, dropped };
}
