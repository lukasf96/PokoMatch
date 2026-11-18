import { appRouteDefinitions, appRouteEntries } from "./routes";

export interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
}

export function getPageMetadata(pathname: string): PageMetadata {
  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const metadata =
    appRouteEntries.find(([, route]) => route.path === normalizedPath)?.[1] ??
    appRouteDefinitions.home;
  return {
    ...metadata,
    canonicalUrl: `https://pokomatch.com${
      normalizedPath === "/" ? "/" : normalizedPath
    }`,
  };
}

export const prerenderRoutes = appRouteEntries.map(([, route]) => route.path);
