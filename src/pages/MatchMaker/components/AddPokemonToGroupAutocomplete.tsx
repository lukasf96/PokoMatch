import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SearchIcon from "@mui/icons-material/Search";
import {
  Autocomplete,
  Box,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  memo,
  useCallback,
  useMemo,
  useState,
  type HTMLAttributes,
  type Key,
} from "react";
import { MatchHighlight } from "../../../utils/MatchHighlight";
import {
  normalizeForSearch,
  normalizedHaystackMatchesQuery,
} from "../../../utils/search-text";
import { PokemonSpriteAvatar } from "../../../components/PokemonSpriteAvatar";
import { SpecialtyChip } from "../../../components/SpecialtyChip";
import {
  getHabitatColors,
  habitatIcons,
} from "../../../services/habitatColors";
import { candidateAddInfoByPokemonId } from "../../../services/matching.service";
import { comparePokemonByDex } from "../../../services/pokemon";
import {
  getPokemonDisplayName,
  type PokemonNameLanguage,
} from "../../../services/pokemon-localization";
import type { Pokemon } from "../../../types/types";
import { formatDexSegment } from "../group-helpers";

/** All substrings we match against (accent-insensitive, lowercased). */
function buildPokemonSearchHaystack(pokemon: Pokemon): string {
  const dex = pokemon.dexNumber.trim();
  const padded = formatDexSegment(dex);
  const numeric = /^\d+$/.test(dex) ? String(Number.parseInt(dex, 10)) : "";

  const nameParts = [
    pokemon.name,
    pokemon.localizedNames?.de,
    pokemon.localizedNames?.fr,
  ].filter((s): s is string => Boolean(s?.length));

  const pieces = [
    ...nameParts,
    dex,
    padded,
    numeric,
    `#${padded}`,
    pokemon.id,
    pokemon.idealHabitat,
    ...pokemon.specialties,
  ];

  return normalizeForSearch(pieces.join(" "));
}

interface AddPokemonToGroupAutocompleteProps {
  group: Pokemon[];
  availablePokemon: Pokemon[];
  nameLanguage: PokemonNameLanguage;
  onSelect: (pokemonId: string) => void;
  /** Omit the field label when a parent section already provides a heading. */
  embedded?: boolean;
}

export const AddPokemonToGroupAutocomplete = memo(
  function AddPokemonToGroupAutocomplete({
    group,
    availablePokemon,
    nameLanguage,
    onSelect,
    embedded = false,
  }: AddPokemonToGroupAutocompleteProps) {
    const theme = useTheme();
    const [inputValue, setInputValue] = useState("");

    const { options, addInfoById } = useMemo(() => {
      const ids = new Set(group.map((m) => m.id));
      const base = availablePokemon.filter((p) => !ids.has(p.id));
      const addInfoById = candidateAddInfoByPokemonId(group, base);
      if (group.length === 0) {
        return { options: base, addInfoById };
      }
      const sorted = [...base].sort((a, b) => {
        const ia = addInfoById.get(a.id)!;
        const ib = addInfoById.get(b.id)!;
        if (ia.habitatCompatible !== ib.habitatCompatible) {
          return ia.habitatCompatible ? -1 : 1;
        }
        if (ia.score !== ib.score) return ib.score - ia.score;
        const dexCmp = comparePokemonByDex(a, b);
        if (dexCmp !== 0) return dexCmp;
        return a.name.localeCompare(b.name);
      });
      return { options: sorted, addInfoById };
    }, [group, availablePokemon]);

    const habitatColors = useMemo(() => getHabitatColors(theme), [theme]);

    const searchHaystackById = useMemo(() => {
      const map = new Map<string, string>();
      for (const p of options) {
        map.set(p.id, buildPokemonSearchHaystack(p));
      }
      return map;
    }, [options]);

    const filterOptions = useCallback(
      (opts: Pokemon[], state: { inputValue: string }): Pokemon[] => {
        const trimmed = state.inputValue.trim();
        if (!trimmed) return opts;
        return opts.filter((p) =>
          normalizedHaystackMatchesQuery(
            searchHaystackById.get(p.id) ?? "",
            trimmed,
          ),
        );
      },
      [searchHaystackById],
    );

    const getOptionLabel = useCallback(
      (option: Pokemon) =>
        `#${formatDexSegment(option.dexNumber)} ${getPokemonDisplayName(option, nameLanguage)}`,
      [nameLanguage],
    );

    const renderOption = useCallback(
      (
        props: HTMLAttributes<HTMLLIElement> & { key: Key },
        option: Pokemon,
      ) => {
        const { key, ...optionProps } = props;
        const hc = habitatColors[option.idealHabitat];
        const HabitatIcon = habitatIcons[option.idealHabitat];
        const dexLabel = `#${formatDexSegment(option.dexNumber)}`;
        const displayName = getPokemonDisplayName(option, nameLanguage);
        const titleText = `${dexLabel} ${displayName}`;
        const add = addInfoById.get(option.id);
        const showScoreChip =
          group.length > 0 && add?.habitatCompatible === true;
        const habitatClash =
          group.length > 0 && Boolean(add) && add!.habitatCompatible === false;

        return (
          <Box
            component="li"
            key={key}
            {...optionProps}
            sx={{
              display: "flex !important",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 1.25,
              py: 1,
              px: 0.5,
              contentVisibility: "auto",
              containIntrinsicSize: "auto 96px",
              ...(habitatClash
                ? {
                    bgcolor: alpha(
                      theme.palette.error.main,
                      theme.palette.mode === "dark" ? 0.12 : 0.06,
                    ),
                  }
                : {}),
            }}
          >
            <PokemonSpriteAvatar pokemon={option} size={40} padding={0.5} />
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                gap: 0.5,
                flex: 1,
                minWidth: 0,
              }}
            >
              <Stack
                spacing={0.5}
                flex={1}
                minWidth={0}
                alignItems="flex-start"
              >
                <Typography
                  variant="body2"
                  lineHeight={1.25}
                  noWrap
                  title={titleText}
                  sx={{ width: "100%" }}
                >
                  <Box
                    component="span"
                    sx={{ color: "text.secondary", fontWeight: 600 }}
                  >
                    <MatchHighlight text={dexLabel} query={inputValue} />
                  </Box>
                  <Box component="span" sx={{ fontWeight: 800 }}>
                    {" "}
                    <MatchHighlight text={displayName} query={inputValue} />
                  </Box>
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                    alignItems: "center",
                    alignContent: "flex-start",
                    width: "100%",
                  }}
                >
                  <Chip
                    icon={<HabitatIcon sx={{ fontSize: "14px !important" }} />}
                    label={
                      <MatchHighlight
                        text={option.idealHabitat}
                        query={inputValue}
                      />
                    }
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                      bgcolor: alpha(
                        hc.bg,
                        theme.palette.mode === "dark" ? 0.35 : 0.65,
                      ),
                      color: hc.text,
                      borderColor: alpha(hc.border, 0.65),
                      "& .MuiChip-icon": {
                        color: hc.text,
                        ml: 0.35,
                      },
                    }}
                  />
                  {option.specialties.map((specialty) => (
                    <SpecialtyChip
                      key={specialty}
                      label={
                        <MatchHighlight text={specialty} query={inputValue} />
                      }
                    />
                  ))}
                </Box>
              </Stack>
              {showScoreChip ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    flexShrink: 0,
                  }}
                >
                  <Chip
                    label={`+${add!.score} Score`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      bgcolor: "action.selected",
                      color: "text.secondary",
                    }}
                  />
                </Box>
              ) : habitatClash ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    flexShrink: 0,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    justifyContent="flex-end"
                  >
                    <ErrorOutlineIcon
                      sx={{ fontSize: 18, color: "error.main" }}
                      aria-hidden
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: "error.main",
                        fontWeight: 800,
                        lineHeight: 1.2,
                        textAlign: "right",
                      }}
                    >
                      Habitat conflict
                    </Typography>
                  </Stack>
                </Box>
              ) : null}
            </Box>
          </Box>
        );
      },
      [
        addInfoById,
        group.length,
        habitatColors,
        inputValue,
        nameLanguage,
        theme,
      ],
    );

    return (
      <Autocomplete
        fullWidth
        options={options}
        disabled={options.length === 0}
        value={null}
        inputValue={inputValue}
        onInputChange={(_, newValue, reason) => {
          if (reason === "reset") return;
          setInputValue(newValue);
        }}
        openOnFocus
        autoHighlight
        selectOnFocus
        clearOnBlur={false}
        getOptionLabel={getOptionLabel}
        filterOptions={filterOptions}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        noOptionsText="No Pokémon match your search"
        renderOption={renderOption}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label={embedded ? undefined : "Choose Pokémon"}
            placeholder="Name, #, habitat, specialty…"
            aria-label={
              embedded ? "Search for a Pokémon to add to this group" : undefined
            }
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start" sx={{ ml: 0.25, mr: -0.5 }}>
                    <SearchIcon
                      fontSize="small"
                      sx={{ color: "text.secondary" }}
                      aria-hidden
                    />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        onChange={(_, value) => {
          if (!value) return;
          onSelect(value.id);
          setInputValue("");
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 320,
              transition: "none",
            },
          },
          popper: {
            sx: {
              "& .MuiPaper-root": {
                transition: "none",
              },
            },
          },
          listbox: {
            sx: { maxHeight: 360, py: 0.5 },
          },
        }}
      />
    );
  },
);
