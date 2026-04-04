import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import { memo, useDeferredValue, useMemo, useState } from "react";
import type { Item } from "../../../types/types";
import { MatchHighlight } from "../../../utils/MatchHighlight";
import {
  normalizeForSearch,
  normalizedHaystackMatchesQuery,
} from "../../../utils/search-text";

interface ItemsCatalogSectionProps {
  items: readonly Item[];
}

const FILTER_ALL = "";
const FILTER_NO_TAG = "__no_tag__";
const FILTER_NO_FAV = "__no_fav__";

type SortKey = "name" | "category" | "tag" | "favorites";
type SortDir = "asc" | "desc";

function buildItemNormalizedHaystack(item: Item): string {
  return normalizeForSearch(
    [
      item.name,
      item.category,
      item.tag,
      item.id,
      ...item.favoriteCategories,
    ].join(" "),
  );
}

function itemPassesDropdowns(
  item: Item,
  category: string,
  tag: string,
  favorite: string,
): boolean {
  if (category !== FILTER_ALL && item.category !== category) return false;
  if (tag !== FILTER_ALL) {
    if (tag === FILTER_NO_TAG) {
      if (item.tag.trim() !== "") return false;
    } else if (item.tag !== tag) return false;
  }
  if (favorite !== FILTER_ALL) {
    if (favorite === FILTER_NO_FAV) {
      if (item.favoriteCategories.length > 0) return false;
    } else if (!item.favoriteCategories.includes(favorite)) return false;
  }
  return true;
}

function compareItems(
  a: Item,
  b: Item,
  orderBy: SortKey,
  order: SortDir,
): number {
  const sign = order === "asc" ? 1 : -1;
  let cmp = 0;
  switch (orderBy) {
    case "name":
      cmp = a.name.localeCompare(b.name);
      break;
    case "category":
      cmp =
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      break;
    case "tag": {
      const at = a.tag.trim() === "" ? "\uffff" : a.tag;
      const bt = b.tag.trim() === "" ? "\uffff" : b.tag;
      cmp = at.localeCompare(bt) || a.name.localeCompare(b.name);
      break;
    }
    case "favorites": {
      const as = [...a.favoriteCategories].sort().join("\u0000");
      const bs = [...b.favoriteCategories].sort().join("\u0000");
      cmp = as.localeCompare(bs) || a.name.localeCompare(b.name);
      break;
    }
    default:
      break;
  }
  return cmp * sign;
}

function CellDash({
  children,
  query,
}: {
  children: string;
  query: string;
}) {
  const empty = children.trim() === "";
  if (empty) {
    return (
      <Typography
        variant="body2"
        component="span"
        sx={{ color: "text.disabled", fontStyle: "italic" }}
      >
        —
      </Typography>
    );
  }
  return (
    <Typography variant="body2" component="span" color="text.secondary">
      <MatchHighlight text={children} query={query} />
    </Typography>
  );
}

const ItemCatalogRow = memo(function ItemCatalogRow({
  item,
  highlightQuery,
}: {
  item: Item;
  highlightQuery: string;
}) {
  const favText = item.favoriteCategories.join(" · ");
  return (
    <TableRow hover>
      <TableCell
        sx={{
          fontWeight: 600,
          verticalAlign: "top",
          borderRight: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" component="span">
          <MatchHighlight text={item.name} query={highlightQuery} />
        </Typography>
      </TableCell>
      <TableCell sx={{ verticalAlign: "top" }}>
        <CellDash query={highlightQuery}>{item.category}</CellDash>
      </TableCell>
      <TableCell sx={{ verticalAlign: "top" }}>
        <CellDash query={highlightQuery}>{item.tag}</CellDash>
      </TableCell>
      <TableCell sx={{ verticalAlign: "top", py: 1.25 }}>
        {item.favoriteCategories.length === 0 ? (
          <Typography
            variant="body2"
            color="text.disabled"
            fontStyle="italic"
            component="span"
          >
            —
          </Typography>
        ) : (
          <Typography
            variant="body2"
            component="p"
            sx={{ m: 0, lineHeight: 1.6 }}
          >
            <MatchHighlight text={favText} query={highlightQuery} />
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
});

export function ItemsCatalogSection({ items }: ItemsCatalogSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState(FILTER_ALL);
  const [filterTag, setFilterTag] = useState(FILTER_ALL);
  const [filterFavorite, setFilterFavorite] = useState(FILTER_ALL);
  const [orderBy, setOrderBy] = useState<SortKey>("category");
  const [order, setOrder] = useState<SortDir>("asc");

  const haystackById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      map.set(item.id, buildItemNormalizedHaystack(item));
    }
    return map;
  }, [items]);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const { categoryOptions, tagOptions, hasUntagged, favoriteOptions, hasNoFav } =
    useMemo(() => {
      const categories = new Set<string>();
      const tags = new Set<string>();
      const favorites = new Set<string>();
      let untagged = false;
      let noFav = false;
      for (const item of items) {
        categories.add(item.category);
        if (item.tag.trim() === "") untagged = true;
        else tags.add(item.tag);
        if (item.favoriteCategories.length === 0) noFav = true;
        else for (const f of item.favoriteCategories) favorites.add(f);
      }
      return {
        categoryOptions: [...categories].sort((a, b) => a.localeCompare(b)),
        tagOptions: [...tags].sort((a, b) => a.localeCompare(b)),
        hasUntagged: untagged,
        favoriteOptions: [...favorites].sort((a, b) => a.localeCompare(b)),
        hasNoFav: noFav,
      };
    }, [items]);

  const dropdownFilteredItems = useMemo(
    () =>
      items.filter((item) =>
        itemPassesDropdowns(item, filterCategory, filterTag, filterFavorite),
      ),
    [items, filterCategory, filterTag, filterFavorite],
  );

  const visibleRows = useMemo(() => {
    const filtered = dropdownFilteredItems.filter((item) =>
      normalizedHaystackMatchesQuery(
        haystackById.get(item.id) ?? "",
        deferredSearchQuery,
      ),
    );
    return filtered.slice().sort((a, b) => compareItems(a, b, orderBy, order));
  }, [
    dropdownFilteredItems,
    deferredSearchQuery,
    haystackById,
    orderBy,
    order,
  ]);

  function handleSort(property: SortKey) {
    const isActive = orderBy === property;
    if (isActive) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(property);
      setOrder("asc");
    }
  }

  const total = items.length;
  const shown = visibleRows.length;

  return (
    <>
      <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
        Items
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Search across name, category, tag, and favorite categories. Narrow with
        the filters, then click column headers to sort.
      </Typography>

      <Stack spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search items"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                    aria-hidden
                  />
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          useFlexGap
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 } }}>
            <InputLabel id="items-filter-category" shrink>
              Category
            </InputLabel>
            <Select
              labelId="items-filter-category"
              label="Category"
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(e.target.value as string)
              }
              displayEmpty
            >
              <MenuItem value={FILTER_ALL}>All categories</MenuItem>
              {categoryOptions.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 } }}>
            <InputLabel id="items-filter-tag" shrink>
              Tag
            </InputLabel>
            <Select
              labelId="items-filter-tag"
              label="Tag"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value as string)}
              displayEmpty
            >
              <MenuItem value={FILTER_ALL}>All tags</MenuItem>
              {hasUntagged ? (
                <MenuItem value={FILTER_NO_TAG}>No tag</MenuItem>
              ) : null}
              {tagOptions.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
            <InputLabel id="items-filter-favorite" shrink>
              Favorite category
            </InputLabel>
            <Select
              labelId="items-filter-favorite"
              label="Favorite category"
              value={filterFavorite}
              onChange={(e) =>
                setFilterFavorite(e.target.value as string)
              }
              displayEmpty
            >
              <MenuItem value={FILTER_ALL}>All favorite categories</MenuItem>
              {hasNoFav ? (
                <MenuItem value={FILTER_NO_FAV}>No favorite categories</MenuItem>
              ) : null}
              {favoriteOptions.map((f) => (
                <MenuItem key={f} value={f}>
                  {f}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Showing {shown} of {total}
        </Typography>
      </Stack>

      <TableContainer
        component="div"
        sx={{
          maxHeight: { xs: 360, sm: 520 },
          overflow: "auto",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sortDirection={orderBy === "name" ? order : false}
                sx={{ minWidth: 120 }}
              >
                <TableSortLabel
                  active={orderBy === "name"}
                  direction={orderBy === "name" ? order : "asc"}
                  onClick={() => handleSort("name")}
                  sx={{ fontWeight: 800 }}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={orderBy === "category" ? order : false}
                sx={{ minWidth: 88 }}
              >
                <TableSortLabel
                  active={orderBy === "category"}
                  direction={orderBy === "category" ? order : "asc"}
                  onClick={() => handleSort("category")}
                  sx={{ fontWeight: 800 }}
                >
                  Category
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={orderBy === "tag" ? order : false}
                sx={{ minWidth: 72 }}
              >
                <TableSortLabel
                  active={orderBy === "tag"}
                  direction={orderBy === "tag" ? order : "asc"}
                  onClick={() => handleSort("tag")}
                  sx={{ fontWeight: 800 }}
                >
                  Tag
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={orderBy === "favorites" ? order : false}
              >
                <TableSortLabel
                  active={orderBy === "favorites"}
                  direction={orderBy === "favorites" ? order : "asc"}
                  onClick={() => handleSort("favorites")}
                  sx={{ fontWeight: 800 }}
                >
                  Favorite categories
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((item) => (
              <ItemCatalogRow
                key={item.id}
                item={item}
                highlightQuery={deferredSearchQuery}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {shown === 0 ? (
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No items match the current search and filters.
          </Typography>
        </Box>
      ) : null}
    </>
  );
}
