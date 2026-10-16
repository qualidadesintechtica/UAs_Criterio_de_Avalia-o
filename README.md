# Comentários e avaliações dos materiais — V5

Página para GitHub Pages com login institucional do BI, menu lateral **Planilha de entrada, UA, BDQ e UC**, filtros compartilhados e comentários com histórico.

## Instalar ou atualizar

Siga `COMECE_AQUI.md`. A atualização desta versão é `supabase/04_LOTE_E_STATUS_MATERIAIS.sql`, após os SQLs 01, 02 e 03. O script acrescenta colunas às views existentes e atualiza a função de comentários sem remover registros nem versões anteriores. A execução dos SQLs no seu projeto e a publicação no GitHub não foram feitas por este pacote.

## Dados da Monday

A página usa a sincronização existente entre Monday e Supabase.

| Menu | Categorias da fonte |
| --- | --- |
| Planilha de entrada | Planilha de Entrada / PE |
| UA | Unidade de Aprendizagem / UA |
| BDQ | Banco de questões / BDQ / Avaliação A1 / Avaliação A3 |
| UC | UC / Unidade Curricular |

As fontes protegidas são:

- `vw_ua_resultados_criterios_autenticados`: critérios, classificações, especialistas, revisores, pareceres, lote e status.
- `vw_ua_resultados_materiais_autenticados`: IDs, nomes, unidade, esteira, matriz, semestre, lote e status do material.
- `vw_materiais_monday_avaliacoes_autenticadas`: formulários, avaliador, conceito final e sete indicadores de UC com suas pontuações.
- `vw_materiais_monday_pareceres_autenticados`: textos dos pareceres vinculados aos formulários.
- `nq_comentarios` e `nq_comentarios_historico`: comentários e versões salvos pelo painel.

**Atualizar dados** consulta novamente o Supabase. As mudanças na Monday aparecem após a sincronização existente. A data da sincronização e o horário da consulta continuam visíveis.

Materiais reais da esteira também aparecem quando ainda não receberam formulário ou avaliação. A ausência de um critério não gera uma reprovação nem um status inventado.

## Filtros compartilhados

Esteira, Lote, UC, UA/material, Revisor e Especialistas se aplicam às quatro abas. As seleções, a pesquisa, o status e a opção Somente com comentários são mantidos durante a troca de aba. Limpar filtros remove o recorte completo.

O catálogo de esteiras reúne as quatro abas e fica disponível também em Planilha de entrada. As demais opções consideram o catálogo conjunto e os outros filtros. Uma escolha anterior continua visível mesmo quando não há resultados na nova aba.

Lote usa `bloco`, cujos valores na base incluem LOTE 2 e LOTE 4. Os vínculos priorizam IDs e códigos exatos. Planilhas com código terminado em `_PP` podem ser ligadas à UC correspondente. Um título de planilha só recebe associação por nome quando o título é exato e identifica uma única UC. O contexto comum da UC pode ser aproveitado sem atribuir à planilha o status de uma de suas UAs.

Se as ofertas têm esteiras ou lotes diferentes e o formulário não identifica sua oferta, esses campos continuam não informados. Não se escolhe uma oferta arbitrária. A seleção de uma esteira pode, por isso, deixar de exibir formulários sem esse vínculo. As opções do filtro continuam acessíveis.

## Cartões e tabela

Os quatro cartões superiores filtram o status do material:

| Cartão | Status reconhecidos |
| --- | --- |
| Liberada | Liberada / Liberado e variantes de liberação para validação |
| Em validação | Em validação e variantes de validação iniciada ou em andamento |
| Requer análise do design | Solicitação de análise do design ou ajustes que mencionem Design / DA, incluindo Ajustes - Conteúdistas e DA |
| Validadas | Validado / Validada e variantes no plural |

A classificação de um critério, sua pontuação e a existência de um comentário não são usadas para inventar um status operacional. Status diferentes, como Pausado e Revalidar - NQ, permanecem na visão completa. As quatro contagens podem não somar todos os materiais por esse motivo. Se a mesma identidade reúne status simultâneos, a prioridade de apresentação é design, em validação, liberada e validada.

A tabela mostra apenas **UC, UA e Unidade da UA**. A unidade vem de um campo explícito, do nome de unidade do item ou do código UA numerado. Um título de UA não é trocado pelo número da unidade. Quando o título não está disponível, o código original permanece visível.

Na aba UC, cada unidade recebe uma linha na tabela, mantendo a organização anterior dos indicadores e seus históricos. Clicar abre os registros da unidade selecionada; Ver todos os registros da UC abre a visão completa. O acesso pelo teclado usa o botão com o nome da UA. A opção Comentários conserva a lista de leitura por UC.

Foram removidos os indicadores e gráficos abaixo dos filtros. O detalhamento de critérios continua no painel de comentários. O tema claro usa off-white, com o tema escuro preservado.

## Comentários e histórico

Adicionar comentário cria uma informação complementar. Editar comentário modifica um texto existente. Histórico de comentários mostra cada versão, inclusive o original da Monday preservado pelo banco na primeira edição. Autor, e-mail, data e número da versão são registrados no servidor. O texto é tratado como texto puro, com limite de 10.000 caracteres.

A edição continua colaborativa entre as contas institucionais já autorizadas (`@animaeducacao.com.br`). A função de gravação verifica a sessão e o domínio. O navegador não recebe INSERT, UPDATE ou DELETE diretamente nas tabelas. RLS protege a leitura. Versões desatualizadas geram conflito e mantêm o texto digitado; reenvios da mesma gravação não duplicam o histórico.

Materiais sem avaliação também podem receber comentários. Quando os critérios chegam depois, seus comentários continuam no material. Edições vinculadas a classificações anteriores continuam acessíveis no histórico da classificação.

**Os comentários são salvos no Supabase para o painel. Não há envio de edições à Monday.** O texto atual da fonte continua disponível separadamente; classificações, pontuações e responsáveis pela avaliação não são alterados.

A busca, a lista e o CSV usam os comentários atuais. O CSV mantém as colunas anteriores e acrescenta UA de referência, Unidade da UA e Lote. Autoria, data, versão e texto da fonte continuam na exportação. O histórico completo permanece no painel.

## Arquivos principais

- `index.html`, `styles.css`: menu, filtros, cartões, tabela, lista e painel de comentários.
- `app.mjs`: autenticação, consultas e interações.
- `core.mjs`: vínculos, critérios vigentes, histórico, filtros e exportação.
- `navigation.mjs`: seções por categoria.
- `monday-data.mjs`: formulários e pareceres sincronizados.
- `workflow.mjs`: status, catálogo global de filtros, inventário e linhas da tabela.
- `portal-comments.mjs`: comentários, versões e mensagens de conflito.
- `view-model.mjs`: destaque seguro da pesquisa e funções de resultado dos critérios.
- `supabase/`: instalação incremental das fontes e da gravação protegida.
- `config.js`, `vendor/supabase.js`: configuração pública e SDK.

Nunca use uma chave administrativa em `config.js`. As consultas e gravações continuam condicionadas à sessão e ao domínio institucional no banco. O script 04 não amplia os domínios nem remove proteções anteriores.

## Verificação

Execute `node --test tests/*.test.mjs`: passaram **50 testes de lógica**, incluindo os testes anteriores de vínculos, critérios, conceitos, pareceres, histórico, filtros e exportação, além dos novos testes de lote, catálogo global, unidade e status.

Em PostgreSQL embarcado (PGlite), a instalação completa e a repetição do SQL 04 foram verificadas. Seis verificações confirmaram a preservação de comentários antigos e seu histórico, novas colunas, edição após a migração, comentários em materiais sem avaliação, conflitos e controle de acesso.

Em DOM simulado, foram exercitados filtros nas quatro abas, manutenção das escolhas, cartões, tabela com três colunas, clique na linha, lista, tema, unidade de UC, visão completa, gravação, edição, histórico, conflitos e encerramento da sessão.

A execução no seu projeto Supabase, o login institucional real, a inspeção visual em navegador e a publicação no GitHub não foram realizadas aqui.
