# Organização do código

## JavaScript da aplicação

- `app/api/*/route.js`: entrada HTTP e bindings da hospedagem.
- `lib/events-service.js`: leitura e gravação dos torneios, revisão de dados e permissões.
- `lib/league-service.js`: lojas, inscrições, presença, fidelidade e confirmação de resultados.
- `lib/store-access.js`: identidade da conta e acesso à loja.
- `lib/swiss-core.mjs`: pareamentos manuais/automáticos e classificação suíça.
- `lib/top-cut.mjs`: plano, seeds, progressão e integridade da chave eliminatória.
- `lib/ranking.mjs` e `lib/monthly-titles.mjs`: ranking e títulos mensais.
- `public/app-main.js`: painel do organizador.
- `public/league.js` e `public/player.js`: loja e espaço do jogador.
- `public/top-cut-ui.js`: configuração e apresentação do corte eliminatório.
- `public/ui/dom.js`: seletores e escape de HTML compartilhados pela interface.

As páginas HTML e os estilos CSS ficam separados da lógica. Templates HTML
dentro de JavaScript usam o comentário `/* HTML */` para que o formatador
organize também sua marcação.

## Uma origem para as regras

O servidor importa os módulos de `lib/`. O navegador precisa das mesmas regras
em `public/`, que é a pasta de recursos estáticos. As cópias são sincronizadas
por `npm run sync:core`; evite editá-las diretamente. O comando também mantém
`public/index.html` igual a `app/entrada.html`.

`npm run format` sincroniza automaticamente essas cópias. `npm run format:check`
detecta diferenças, além de verificar a formatação. A biblioteca QR Code e as
ilustrações não são reformatadas como código de aplicação.

## Manutenção

```sh
npm run format
npm run format:check
npm test
npm run build
```

A formatação usa duas posições de indentação e largura preferencial de 90
caracteres. URLs, mensagens ou trechos indivisíveis podem ultrapassar esse valor.
As consultas SQL são divididas em várias linhas, sem mudar sua estrutura.

Os testes são JavaScript portável, com `node:test` e banco SQLite em memória.
Cobrem ranking, pareamentos, Top Cut, autenticação, isolamento por loja,
permissões, inscrições, confirmação de presença, fidelidade e conflitos de revisão.
Nenhum teste precisa de dados ou credenciais de produção.

## TypeScript preservado

O schema Drizzle, os tipos do ambiente e os adaptadores de hospedagem continuam
em TypeScript. Eles fazem parte da integração existente com Vinext e Cloudflare.
As rotas, os serviços do produto e a interface não exigem escrever TypeScript.
