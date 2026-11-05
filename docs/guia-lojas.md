# Duelist Kingdom — Guia para lojas

## Primeira configuração
1. Na entrada, escolha **Sou organizador** e crie sua loja.
2. Configure nome, endereço, apresentação, cor, pontos por presença e recompensas.
3. A opção de exibição disponibiliza a página para outras contas que já tenham acesso ao site. Por padrão, a loja começa privada.
4. Em **Equipe e convites**, gere convites de funcionário, juiz ou jogador. Cada código expira em sete dias e pode ser usado uma vez.

O site continua com o acesso privado existente. O convite da loja não concede, sozinho, acesso à hospedagem: a pessoa também precisa estar autorizada a entrar no site.

## Perfis
- Proprietário: configura a loja, administra equipe, torneios, inscrições e resgates.
- Funcionário: gerencia torneios, presença, valores registrados e entrega de recompensas.
- Juiz: consulta a operação e corrige resultados das mesas existentes. Não configura loja nem altera valores.
- Jogador: vincula sua conta à loja, faz inscrição, acompanha suas mesas, envia resultados e solicita recompensas.

A seleção de perfil na entrada é navegação. As permissões efetivas são verificadas no servidor, pela conta autenticada e vínculo com a loja.

## Preparar o evento
1. Abra **Gerenciar torneios** na loja e crie o torneio.
2. Volte à página da loja e escolha jogo e mês do evento.
3. Configure valor da inscrição, premiação, outros custos e minutos gastos na organização.
4. Compartilhe a página da loja. O jogador entra com a própria conta e faz a inscrição.
5. Quando não há vaga, a inscrição entra na fila de espera. A equipe promove o primeiro da fila quando houver vaga.
6. Antes de iniciar, use **Importar confirmados para as mesas**. Isso traz as inscrições vinculadas às contas para o organizador de torneios.
7. Inicie o evento e gere ou registre as mesas conforme o perfil do jogo.

Os torneios antigos continuam no **espaço pessoal anterior**. Novas lojas têm seus próprios dados e rankings; os eventos anteriores não são transferidos automaticamente.

## Presença e pontos
- A equipe gera um QR de presença, válido por duas horas. O link abre o jogo, mês e evento corretos.
- O jogador com inscrição confirmada abre o link e confirma a presença.
- A equipe também pode confirmar presença manualmente na lista de inscritos.
- A presença gera os pontos configurados; repetir a operação não credita novamente.
- A primeira participação na loja recebe o bônus configurado uma única vez.
- Os pontos são de fidelidade da loja. Não alteram a pontuação nem os desempates dos torneios.

## Resultados pelo celular
Os dois jogadores vinculados à mesa enviam o resultado. Havendo concordância, o resultado é registrado. Divergências ficam pendentes para decisão da arbitragem. Derrota dupla continua exclusiva do Yu-Gi-Oh!, aplicada pela organização ou juiz.

## Recompensas
Cadastre uma recompensa por linha no formato `Nome | pontos`.
O jogador solicita o resgate e os pontos ficam debitados. A equipe confirma a entrega. Se a entrega não puder ocorrer, a equipe pode cancelar e devolver os pontos. O resgate e o estorno são protegidos contra repetição.

## Painel de gestão
O painel usa o jogo e mês selecionados:
- Presenças confirmadas e jogadores distintos.
- Jogadores presentes em mais de um evento do período.
- Valores recebidos registrados pela equipe.
- Saldo dos eventos: receita registrada menos premiação e outros custos informados.
- Tempo de organização registrado manualmente.

O orçamento mensal do software aparece separado, para não ser descontado integralmente em cada jogo. Esses valores são controle gerencial, não conciliação bancária ou promessa de lucro.

## Pagamentos e plano comercial
Esta versão registra pagamentos, orçamento mensal e quantidade de créditos contratados de forma manual. Não processa Pix/cartão, não cobra assinaturas, não compra créditos e não bloqueia torneios por créditos. A integração com um provedor de pagamentos ainda precisa ser configurada para automatizar cobrança.

## Validação
72 verificações de API com banco SQLite isolado: autenticação, isolamento por loja, permissões, convites, limite de vagas, fila, importação, QR, fidelidade, resgates/estornos, privacidade financeira, confirmação e arbitragem. Também passaram as verificações existentes de ranking mensal e suíço por jogo. Fluxos de loja e jogador conferidos visualmente no computador e no celular. Os dados de teste dessas verificações não foram inseridos no banco de produção.
