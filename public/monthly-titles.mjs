export const MONTHLY_TIERS = {
  yugioh: [
    { id: 'king', label: 'Rei dos Duelistas', max: 1, range: '1º lugar' },
    { id: 'obelisk', label: 'Obelisco Azul', max: 8, range: '2º–8º lugar' },
    { id: 'ra', label: 'Rá Amarelo', max: 16, range: '9º–16º lugar' },
    { id: 'slifer', label: 'Slifer Vermelho', max: Infinity, range: '17º em diante' },
  ],
  pokemon: [
    { id: 'champion', label: 'Campeão da Liga', max: 1, range: '1º lugar' },
    { id: 'elite', label: 'Elite 4', max: 5, range: '2º–5º lugar' },
  ],
  onepiece: [
    { id: 'pirate', label: 'Rei dos piratas', max: 1, range: '1º lugar' },
    { id: 'emperor', label: '4 Imperadores', max: 5, range: '2º–5º lugar' },
  ],
};
export function monthlyTitle(game, rank) {
  if (!Number.isInteger(rank) || rank < 1) return null;
  const tier = MONTHLY_TIERS[game]?.find((t) => rank <= t.max);
  return tier ? { id: tier.id, label: tier.label } : null;
}
