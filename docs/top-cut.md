# Suíço + Top Cut

Modalidade opcional para os cinco jogos. Eventos antigos permanecem no formato anterior. O banco persiste o plano, os seeds homologados e as partidas eliminatórias no JSON versionado do torneio; não exige migração destrutiva.

## Perfis consultados em 06/11/2026

- Yu-Gi-Oh!: [KDE-US v2.5, seções III.G–H e V.B](https://img.yugioh-card.com/en/downloads/penalty_guide/YGOTCG_Tournament_Policy_v_2_5.pdf), Tier 1/2. 4–8: 3/sem corte; 9–16: 4/Top4; 17–32: 5/Top4; 33–64: 6/Top8; depois 7–11/Top8 até 2048. Final sem limite. Derrota dupla nas outras fases elimina ambos, propagando vaga sem classificado/bye.
- ONE PIECE: [manual de 16/01/2026, 3.4–3.6](https://en.onepiece-cardgame.com/pdf/tournament_rules_manual.pdf?20260116=). 4–8: 3/sem corte; 9–16: 4/Top2; 17–32: 5/Top4; 33–128: 6–7/Top8; 129–512: 8–9/Top16; 513–2048: 10–11/Top32. Bo1 suíço, Bo3 corte. Cronômetro 30/60 minutos, com procedimentos extras de 5/10 minutos conduzidos pela arbitragem; final sem limite. Usa rodadas fixas anunciadas.
- Digimon: [manual de 06/06/2024, 3.4–3.6](https://world.digimoncard.com/event/online_event/pdf/tournament_rules.pdf?20240606=). Mesma tabela Bandai até 1024. Acima disso exige regulamento específico. Perfil Bo3, suíço 45 minutos +5 extras, corte 55 +5 extras; final configurada sem limite neste perfil.
- Lorcana: [regras de 14/07/2026, 3.2–3.4 e 6.1](https://files.disneylorcana.com/Tournament-Rules-7.14.2026_Update_EN.pdf). Mínimo 8. 8: 3/sem corte; 9–16: 4/Top4; 17–32: 5/Top8; 33–64: 6/Top8; 65–128: 7/Top8; 129–226: 8/Top8; 227+: 9/Top8. Bo3, suíço 50 minutos; eliminatórias sem limite recomendado. Quando houver restrição do local, definir regulamento específico com ao menos 70 minutos. Melhor seed escolhe jogar/comprar no jogo 1 do corte.
- Pokémon: [portal vigente de documentos](https://play.pokemon.com/en-us/resources/documents/). Perfil de corte fixo configurado pelo regulamento do evento, com referência obrigatória e um torneio por divisão etária. O download do handbook atual estava bloqueado na consulta; nenhuma tabela antiga foi rotulada como atual. Corte assimétrico de grandes eventos, Swiss em dois dias e divisões combinadas não estão automatizados.

Ops Docs/FAQs de eventos específicos prevalecem. O organizador anuncia rodadas, corte e tempos antes de iniciar; o servidor impede alterações posteriores. A modalidade não substitui o registro/reporting exigido pelos fabricantes.

## Classificação e homologação

A chave é fixa, sem reseeding: Top8 = 1×8, 4×5, 2×7, 3×6, mantendo 1 e 2 em metades opostas. Todas as rodadas suíças precisam estar completas. O organizador confirma a ordem final, sem duplicatas, e registra a homologação da arbitragem. A classificação de liga Buchholz/SB não é apresentada como a classificação oficial dos fabricantes. Quando o evento exige TOM/TCG+/Play Hub/KTS, seus desempates e critérios devem ser usados na homologação. O site não decide empates completos por nomes.

Nenhum empate avança no eliminatório. Derrota dupla é exclusiva de Yu-Gi-Oh! (na final sem limite é necessário registrar o desfecho). Byes eliminatórios e ramos vazios são derivados dos resultados anteriores e validados no servidor. Correções que mudam classificados exigem remover/refazer o corte; resultados de fases já utilizadas ficam bloqueados. Resultados de jogadores continuam exigindo confirmação dos dois, com divergências encaminhadas à arbitragem.

## Ranking mensal da liga

Somente pontos suíços entram no ranking mensal. O corte define o campeão do torneio sem dar partidas extras pontuáveis no mês. Essa é uma regra de liga do aplicativo, distinta de Championship Points, convites ou premiação oficial. O campeão do torneio não substitui automaticamente o título mensal de cada jogo.

## Verificação

Simulação isolada com 50 jogadores nos cinco jogos, chave até a final, byes e eliminações duplas; testes de integridade, restrições de resultados e pontos mensais; testes da API de autorização, persistência e plano imutável; fluxo visual de criação, homologação e final. Dados de teste não foram adicionados à produção.
