import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";
import type { Pokemon } from "../../../types/types";
import { PokemonChip } from "./PokemonChip";

interface DistributionSectionProps {
  title: string;
  items: ReadonlyArray<readonly [string, Pokemon[]]>;
  totalPokemon: number;
  maxVisibleItems?: number;
}

interface DistributionRowProps {
  label: string;
  pokemon: Pokemon[];
  totalPokemon: number;
}

function DistributionRow({
  label,
  pokemon,
  totalPokemon,
}: DistributionRowProps) {
  const theme = useTheme();
  const percentage = Math.round((pokemon.length / totalPokemon) * 100);
  const isDark = theme.palette.mode === "dark";
  const progressTrackColor = isDark
    ? alpha(theme.palette.common.white, 0.12)
    : theme.palette.action.hover;
  const progressFillColor = isDark
    ? theme.palette.primary.light
    : theme.palette.primary.main;

  return (
    <Accordion elevation={0} sx={{ overflow: "hidden" }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} aria-hidden />}
        sx={{
          minHeight: 0,
          px: 1.5,
          py: 0.75,
          "&.Mui-expanded": { minHeight: 0 },
          "& .MuiAccordionSummary-content": {
            margin: 0,
            alignItems: "center",
          },
          "& .MuiAccordionSummary-content.Mui-expanded": { margin: 0 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            pr: 0.5,
            gap: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }} noWrap>
            {label}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 6,
                borderRadius: 3,
                bgcolor: progressTrackColor,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${percentage}%`,
                  height: "100%",
                  bgcolor: progressFillColor,
                  borderRadius: 3,
                }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 12, minWidth: 24, textAlign: "right" }}
            >
              {pokemon.length}
            </Typography>
          </Stack>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Divider />
        <Box
          sx={{ px: 1.5, py: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}
        >
          {pokemon.map((member) => (
            <PokemonChip key={member.id} pokemon={member} />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export function DistributionSection({
  title,
  items,
  totalPokemon,
  maxVisibleItems,
}: DistributionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { visibleItems, hasMore } = useMemo(() => {
    if (maxVisibleItems === undefined || maxVisibleItems >= items.length) {
      return { visibleItems: items, hasMore: false };
    }
    const visibleItems = isExpanded ? items : items.slice(0, maxVisibleItems);
    return { visibleItems, hasMore: !isExpanded };
  }, [isExpanded, items, maxVisibleItems]);

  return (
    <>
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
        {title}
      </Typography>
      <Stack spacing={0.75}>
        {visibleItems.map(([label, pokemon]) => (
          <DistributionRow
            key={label}
            label={label}
            pokemon={pokemon}
            totalPokemon={totalPokemon}
          />
        ))}
      </Stack>

      {hasMore ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Button
            size="small"
            onClick={() => setIsExpanded(true)}
            endIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} aria-hidden />}
          >
            Show all
          </Button>
        </Box>
      ) : maxVisibleItems !== undefined && isExpanded ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Button
            size="small"
            onClick={() => setIsExpanded(false)}
            endIcon={<ExpandLessIcon sx={{ fontSize: 18 }} aria-hidden />}
          >
            Show less
          </Button>
        </Box>
      ) : null}
    </>
  );
}
