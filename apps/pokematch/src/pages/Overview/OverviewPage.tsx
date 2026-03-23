import { Container } from "@mui/material";
import { allPokemon } from "../../services/pokemon";
import OverviewTab from "./components/OverviewTab";

export default function OverviewPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <OverviewTab pokemon={allPokemon} />
    </Container>
  );
}
