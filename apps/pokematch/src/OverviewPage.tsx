import { Container } from '@mui/material'
import OverviewTab from './OverviewTab'
import { allPokemon } from './pokemon'

export default function OverviewPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <OverviewTab pokemon={allPokemon} />
    </Container>
  )
}
