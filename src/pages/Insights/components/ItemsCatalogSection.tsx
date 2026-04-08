import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
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
import { alpha, type Theme } from "@mui/material/styles";
import { memo, useDeferredValue, useMemo, useState } from "react";
import { itemsCatalogGeneratedAt } from "../../../services/items";
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

/** Keeps columns readable on narrow screens (horizontal scroll). */
const TABLE_MIN_WIDTH_PX = 540;

/** Fixed viewport so the block does not jump when search narrows to few or zero rows. */
const TABLE_VIEWPORT_HEIGHT = {
  xs: "min(52vh, 360px)",
  sm: 400,
} as const;

/** Approximate sticky thead height; subtract from viewport for empty-state body min-height. */
const TABLE_STICKY_HEAD_OFFSET_PX = 52;

const TABLE_EMPTY_STATE_MIN_HEIGHT = {
  xs: `calc(${TABLE_VIEWPORT_HEIGHT.xs} - ${TABLE_STICKY_HEAD_OFFSET_PX}px)`,
  sm: `calc(${TABLE_VIEWPORT_HEIGHT.sm}px - ${TABLE_STICKY_HEAD_OFFSET_PX}px)`,
} as const;

const ITEM_TABLE_COLUMN_COUNT = 4;

const cellFont = {
  fontSize: { xs: "0.8125rem", sm: "0.875rem" },
  lineHeight: 1.45,
} as const;

const headCellSx = {
  py: 0.7,
  px: { xs: 1, sm: 1.25 },
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.055em",
  textTransform: "uppercase" as const,
  color: "text.secondary",
  bgcolor: "background.paper",
  borderBottom: 1,
  borderColor: "divider",
  whiteSpace: "nowrap" as const,
  verticalAlign: "bottom" as const,
  lineHeight: 1.3,
};

const bodyCellSx = {
  py: 0.5,
  px: { xs: 1, sm: 1.25 },
  borderBottom: 1,
  borderColor: "divider",
  verticalAlign: "top" as const,
};

const sortLabelSx = {
  fontWeight: "inherit",
  fontSize: "inherit",
  letterSpacing: "inherit",
  textTransform: "inherit",
  color: "inherit",
  "& .MuiTableSortLabel-icon": { opacity: 0.45, fontSize: "1.05rem" },
  "&.Mui-active": { color: "primary.main" },
  "&.Mui-active .MuiTableSortLabel-icon": { opacity: 1, color: "primary.main" },
};

function zebraRowBg(theme: Theme): string {
  return theme.palette.mode === "dark"
    ? alpha(theme.palette.common.white, 0.035)
    : alpha(theme.palette.common.black, 0.028);
}

function formatItemsCatalogDateOnly(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

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

function CellDash({ children, query }: { children: string; query: string }) {
  const empty = children.trim() === "";
  if (empty) {
    return (
      <Typography
        variant="body2"
        component="span"
        sx={{
          ...cellFont,
          color: "text.disabled",
          fontStyle: "italic",
        }}
      >
        —
      </Typography>
    );
  }
  return (
    <Typography
      variant="body2"
      component="span"
      sx={{ ...cellFont, color: "text.secondary" }}
    >
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
    <TableRow
      sx={{
        "&:nth-of-type(even)": (theme) => ({
          bgcolor: zebraRowBg(theme),
        }),
      }}
    >
      <TableCell
        sx={{
          ...bodyCellSx,
          maxWidth: { xs: 160, sm: 240 },
        }}
      >
        <Typography
          variant="body2"
          component="span"
          sx={{
            ...cellFont,
            color: "text.primary",
            fontWeight: 600,
            display: "block",
            wordBreak: "break-word",
          }}
        >
          <MatchHighlight text={item.name} query={highlightQuery} />
        </Typography>
      </TableCell>
      <TableCell
        sx={{
          ...bodyCellSx,
          whiteSpace: { xs: "normal", sm: "nowrap" },
          maxWidth: { sm: 140 },
        }}
      >
        <CellDash query={highlightQuery}>{item.category}</CellDash>
      </TableCell>
      <TableCell
        sx={{
          ...bodyCellSx,
          whiteSpace: { xs: "normal", sm: "nowrap" },
          maxWidth: { sm: 120 },
        }}
      >
        <CellDash query={highlightQuery}>{item.tag}</CellDash>
      </TableCell>
      <TableCell sx={{ ...bodyCellSx, minWidth: { xs: 140, sm: 180 } }}>
        {item.favoriteCategories.length === 0 ? (
          <Typography
            variant="body2"
            component="span"
            sx={{
              ...cellFont,
              color: "text.disabled",
              fontStyle: "italic",
            }}
          >
            —
          </Typography>
        ) : (
          <Typography
            variant="body2"
            component="p"
            sx={{
              ...cellFont,
              m: 0,
              color: "text.secondary",
              wordBreak: "break-word",
            }}
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

  const {
    categoryOptions,
    tagOptions,
    hasUntagged,
    favoriteOptions,
    hasNoFav,
  } = useMemo(() => {
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
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Item data is work in progress, the list may be incomplete and is
          subject to change.
        </Typography>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ m: 0 }}>
          Data last refreshed on:{" "}
          {formatItemsCatalogDateOnly(itemsCatalogGeneratedAt)}
        </Typography>
      </Stack>

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
              onChange={(e) => setFilterCategory(e.target.value as string)}
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
              onChange={(e) => setFilterFavorite(e.target.value as string)}
              displayEmpty
            >
              <MenuItem value={FILTER_ALL}>All favorite categories</MenuItem>
              {hasNoFav ? (
                <MenuItem value={FILTER_NO_FAV}>
                  No favorite categories
                </MenuItem>
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
        sx={{
          minHeight: TABLE_VIEWPORT_HEIGHT,
          maxHeight: TABLE_VIEWPORT_HEIGHT,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          border: 1,
          borderColor: "divider",
          borderRadius: 1.5,
          bgcolor: "background.paper",
        }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            minWidth: TABLE_MIN_WIDTH_PX,
            tableLayout: "fixed",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                sortDirection={orderBy === "name" ? order : false}
                sx={{
                  ...headCellSx,
                  minWidth: 108,
                  width: "22%",
                }}
              >
                <TableSortLabel
                  active={orderBy === "name"}
                  direction={orderBy === "name" ? order : "asc"}
                  onClick={() => handleSort("name")}
                  sx={sortLabelSx}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={orderBy === "category" ? order : false}
                sx={{
                  ...headCellSx,
                  minWidth: 88,
                  width: "18%",
                }}
              >
                <TableSortLabel
                  active={orderBy === "category"}
                  direction={orderBy === "category" ? order : "asc"}
                  onClick={() => handleSort("category")}
                  sx={sortLabelSx}
                >
                  Category
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={orderBy === "tag" ? order : false}
                sx={{
                  ...headCellSx,
                  minWidth: 72,
                  width: "14%",
                }}
              >
                <TableSortLabel
                  active={orderBy === "tag"}
                  direction={orderBy === "tag" ? order : "asc"}
                  onClick={() => handleSort("tag")}
                  sx={sortLabelSx}
                >
                  Tag
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={orderBy === "favorites" ? order : false}
                sx={{
                  ...headCellSx,
                  minWidth: 160,
                  width: "46%",
                  whiteSpace: { xs: "normal", sm: "nowrap" },
                }}
              >
                <TableSortLabel
                  active={orderBy === "favorites"}
                  direction={orderBy === "favorites" ? order : "asc"}
                  onClick={() => handleSort("favorites")}
                  sx={sortLabelSx}
                >
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Favorite categories
                  </Box>
                  <Box
                    component="span"
                    sx={{ display: { xs: "inline", sm: "none" } }}
                  >
                    Favorites
                  </Box>
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={ITEM_TABLE_COLUMN_COUNT}
                  sx={{
                    ...bodyCellSx,
                    p: 0,
                    borderBottom: 0,
                    verticalAlign: "middle",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: TABLE_EMPTY_STATE_MIN_HEIGHT,
                      gap: 1.5,
                      px: 2,
                      py: 2,
                    }}
                  >
                    <SearchOffOutlinedIcon
                      sx={{
                        fontSize: 40,
                        color: "text.disabled",
                      }}
                      aria-hidden
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      sx={{ maxWidth: 320 }}
                    >
                      No items match the current search and filters.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((item) => (
                <ItemCatalogRow
                  key={item.id}
                  item={item}
                  highlightQuery={deferredSearchQuery}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
