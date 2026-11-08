export const metadata = {
  title: 'Duelist Kingdom — Torneios e ranking mensal',
  description: 'Organize torneios de Yu-Gi-Oh! TCG e acompanhe o ranking mensal.',
};
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
