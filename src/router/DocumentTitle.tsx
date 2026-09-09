import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPageMetadata } from "./metadata";

function setMeta(selector: string, attribute: "name" | "property", value: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  if (element) element.content = value;
  else {
    const meta = document.createElement("meta");
    meta.setAttribute(attribute, selector.match(/"([^"]+)"/)?.[1] ?? "");
    meta.content = value;
    document.head.append(meta);
  }
}

/** Sets document.title from the current route (SPA-friendly; no extra deps). */
export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, description, canonicalUrl } = getPageMetadata(pathname);

    document.title = title;
    setMeta('meta[name="description"]', "name", description);
    setMeta('meta[property="og:title"]', "property", title);
    setMeta('meta[property="og:description"]', "property", description);
    setMeta('meta[property="og:url"]', "property", canonicalUrl);
    setMeta('meta[name="twitter:title"]', "name", title);
    setMeta('meta[name="twitter:description"]', "name", description);

    const canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical) canonical.href = canonicalUrl;
  }, [pathname]);

  return null;
}
