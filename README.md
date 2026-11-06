# Duelist Kingdom

Plataforma para lojas e comunidades de TCG: Yu-Gi-Oh!, Pokémon, One Piece, Lorcana e Digimon.

## Recursos
- Entrada por perfil e seleção do jogo.
- Lojas com dados separados e perfis de proprietário, funcionário, juiz e jogador.
- Inscrições antecipadas, fila de espera e check-in por QR Code.
- Mesas, resultados confirmados pelos dois jogadores e resolução pela arbitragem.
- Suíço + Top Cut, com planejamento por jogo, seeds homologados e chave eliminatória.
- Pareamentos manuais nos cinco jogos, com geração automática opcional.
- Ranking mensal e títulos temáticos por jogo.
- Fidelidade, recompensas, resgates e estorno de pontos.
- Indicadores de presença, retorno, valores recebidos, custos e organização.
- Identidade visual por jogo, com ilustrações próprias, modos claro/escuro e interface para celular.
- Cliente Windows em Electron, em `desktop/`.

## Tecnologias
Node.js 22.13 ou superior, Vinext/Vite, Cloudflare Workers + D1, Drizzle, JavaScript/TypeScript e Electron.

## Desenvolvimento do site
```sh
npm ci
npm run dev
```
O servidor local normalmente usa `http://127.0.0.1:5173`.
O projeto utiliza autenticação fornecida pela hospedagem Sites e cabeçalhos autenticados no servidor. Em desenvolvimento local, use `/signin-with-chatgpt?return_to=/` para entrar com a identidade de teste local. Não use a identidade simulada em produção.

## Compilação
```sh
npm run build
```
O schema está em `db/schema.ts`; as migrações versionadas estão em `drizzle/`. O banco usa o binding `DB`. A configuração de hospedagem Sites está em `.openai/hosting.json` e identifica a implantação existente. Não são incluídos credenciais nem conteúdo do banco de produção.

## Aplicativo Windows
```sh
cd desktop
npm ci
npm run start
npm run build
```
O cliente abre o site publicado em janela própria e requer internet e uma conta autorizada. O empacotamento usa Electron Builder; `Installer.cs` e `Uninstall.cs` preservam o instalador alternativo usado no ambiente de desenvolvimento. A abertura e o login do executável Windows não foram validados no ambiente isolado de criação.

## Teste incluído
```sh
node tests/monthly.mjs
node tests/manual-pairings.mjs
node tests/top-cut.mjs
```
O projeto foi validado adicionalmente com 72 verificações isoladas de API e testes dos perfis suíços. A suíte de API original depende do ambiente local de criação; o teste mensal acima é portátil e está incluído no repositório.

## Documentação
- [Guia para lojas](docs/guia-lojas.md)
- [Estratégia comercial](docs/estrategia-comercial.md)
- [Suíço + Top Cut: perfis e limites](docs/top-cut.md)

## Limites atuais
Pagamentos, orçamento mensal e créditos contratados têm registro manual. Não há cobrança automática, gateway de pagamentos ou venda automática de créditos. O site permanece privado; convites da loja não concedem acesso à hospedagem.

## Direitos
Projeto proprietário. As dependências mantêm suas próprias licenças. Os jogos, personagens e marcas pertencem aos respectivos titulares. Este projeto é independente e não representa afiliação com os fabricantes.
