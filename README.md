# Comentários e avaliações dos materiais — V6.4

Página para GitHub Pages com autenticação institucional, quatro abas, filtros compartilhados e comentários com histórico.

## Alterações desta versão

- **Requer análise do design** passa a incluir Ajustes - MODELAGEM e Ajustes - Modelagens da Monday, em todas as abas. O status original continua preservado nos detalhes e no CSV.
- **Planilha de entrada** recebe a coluna Esteira, mantendo UC, UA, Unidade da UA e o acesso aos comentários pelo clique.
- **BDQ** inclui A1, A2 e A3 e recebe as colunas Gestor e Revisor. O tipo aparece ao lado do nome. A2 passa a ser reconhecido em materiais, critérios, formulários e pareceres.

Os bancos são conferidos também na tabela sincronizada do quadro de validações. A consulta complementar inclui A1/A2/A3 ausentes da base consolidada e atualiza gestor, revisor e status dos itens existentes pelo ID exato da Monday. As chaves dos materiais existentes são preservadas, para manter seus comentários e histórico. A consulta permanece independente e possui limite próprio; em caso de indisponibilidade, os dados disponíveis continuam acessíveis com aviso de contagem parcial.

Gestor corresponde ao campo `gestor_validacao_nq`. Revisor corresponde ao `revisor_validador` atribuído ao banco. O avaliador do formulário continua registrado e pesquisável. Não se atribuem responsáveis de uma UA ou de uma oferta ambígua a um BDQ.

## Atualizar

**Se o SQL 07 já está instalado, execute somente `supabase/08_GESTOR_DOS_MATERIAIS.sql`**, depois substitua todos os arquivos da página. Se ainda não está instalado, siga COMECE_AQUI.md: em instalação nova, execute 05, 07 e 08, nessa ordem. Não execute SQL antigo depois do 08.

O SQL 08 acrescenta o campo Gestor ao final das consultas protegidas e cria a consulta específica de BDQ. A função de gravação mantém seu contrato e ganha uma busca adicional de origem para permitir comentários nos bancos dessa consulta. Não altera os dados sincronizados, a base consolidada, as tabelas de comentários ou as versões anteriores.

Após publicar, confira **V6.4 · 19/10/2026**, clique em Atualizar dados e, para conferir o total completo, em Limpar filtros. Os arquivos usam um novo identificador de versão para reduzir a reutilização de recursos antigos.

Autenticação Ânima/Ulife, consultas independentes, contagem dos planos por ID, busca, filtros entre abas, paginação, lista, exportação e temas continuam disponíveis.

## Domínios autorizados

São permitidos `@animaeducacao.com.br` e `@ulife.com.br`, com conta cadastrada no BI. A mesma regra protege as consultas de avaliações/materiais, as políticas de leitura de comentários/histórico e a função de gravação. O SQL 05 centraliza a verificação em `nq_painel_acesso_institucional`, sem elevar privilégios. Domínios externos, subdomínios não autorizados e usuários anônimos continuam bloqueados no painel. A inclusão de domínio não cria contas nem muda senhas. O carregamento verifica a regra no servidor e avisa quando a página V6 encontra uma base ainda não atualizada.

## Dados da Monday

A página usa a sincronização existente entre Monday e Supabase.

| Menu | Categorias da fonte |
| --- | --- |
| Planilha de entrada | Plano de Produção do quadro de validações, além dos registros PE anteriores |
| UA | Unidade de Aprendizagem / UA |
| BDQ | Banco de questões / BDQ / Avaliação A1 / Avaliação A2 / Avaliação A3 |
| UC | UC / Unidade Curricular |

As fontes protegidas são:

- `vw_ua_resultados_criterios_autenticados`: critérios, classificações, especialistas, revisores, pareceres, lote e status.
- `vw_ua_resultados_materiais_autenticados`: IDs, nomes, unidade, esteira, matriz, semestre, lote e status. Na V6.3.1, essa consulta volta a usar somente a base consolidada. Os 17 campos anteriores e o marcador de origem são preservados.
- `vw_materiais_monday_avaliacoes_autenticadas`: formulários, avaliador, conceito final e sete indicadores de UC com suas pontuações.
- `vw_materiais_monday_pareceres_autenticados`: textos dos pareceres vinculados aos formulários.
- `vw_ua_resultados_bdq_validacao_autenticados`: A1, A2 e A3 diretamente do quadro sincronizado, incluindo gestor e revisor. Consulta independente que complementa os bancos ausentes na consolidada.
- `vw_ua_resultados_planilhas_validacao_autenticadas`: Planos de Produção diretamente do quadro sincronizado, consultados separadamente.
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
| Requer análise do design | Solicitação de análise do design ou ajustes que mencionem Design / DA, incluindo Ajustes - Conteúdistas e DA; Ajustes - MODELAGEM / Modelagens |
| Validadas | Validado / Validada e variantes no plural |

Na Planilha de entrada, cada ID do item do quadro conta uma vez. Os nomes dos grupos físicos não substituem a coluna Status Validação. Formulários sem vínculo inequívoco continuam acessíveis e editáveis, identificados na tabela, mas ficam fora dos totais do quadro. A classificação de um critério, sua pontuação e a existência de um comentário não são usadas para inventar um status operacional. Status diferentes, como Pausado e Revalidar - NQ, permanecem na visão completa. As quatro contagens podem não somar todos os materiais por esse motivo. Uma nota acima dos filtros discrimina os demais status, como A liberar, N/A e Pausado. Ajustes - MODELAGEM e Modelagens entram no cartão Requer análise do design. Se a mesma identidade reúne status simultâneos, a prioridade de apresentação é design, em validação, liberada e validada.

As colunas são específicas de cada aba:

| Aba | Colunas |
| --- | --- |
| Planilha de entrada | UC, UA, Unidade da UA, Esteira |
| BDQ | UC, BDQ, Unidade da UA, Gestor, Revisor |
| UA e UC | UC, UA, Unidade da UA |

No BDQ, o material tem identificação A1, A2 ou A3 ao lado do nome quando esse tipo está informado na fonte. Gestor usa `gestor_validacao_nq` e Revisor usa `revisor_validador` do material. O avaliador do formulário continua preservado nos registros e nos filtros, sem substituir o revisor atribuído. Campos ausentes são apresentados como Não informado. A unidade vem de um campo explícito, do nome de unidade do item ou do código UA numerado. Um título de UA não é trocado pelo número da unidade. Quando o título não está disponível, o código original permanece visível.

Na aba UC, cada unidade recebe uma linha na tabela, mantendo a organização anterior dos indicadores e seus históricos. Clicar abre os registros da unidade selecionada; Ver todos os registros da UC abre a visão completa. O acesso pelo teclado usa o botão com o nome da UA. A opção Comentários conserva a lista de leitura por UC.

Foram removidos os indicadores e gráficos abaixo dos filtros. O detalhamento de critérios continua no painel de comentários. O tema claro usa off-white, com o tema escuro preservado.

## Comentários e histórico

Adicionar comentário cria uma informação complementar. Editar comentário modifica um texto existente. Histórico de comentários mostra cada versão, inclusive o original da Monday preservado pelo banco na primeira edição. Autor, e-mail, data e número da versão são registrados no servidor. O texto é tratado como texto puro, com limite de 10.000 caracteres.

A edição continua colaborativa entre as contas institucionais já autorizadas (`@animaeducacao.com.br` ou `@ulife.com.br`). A função de gravação verifica a sessão e o domínio. O navegador não recebe INSERT, UPDATE ou DELETE diretamente nas tabelas. RLS protege a leitura. Versões desatualizadas geram conflito e mantêm o texto digitado; reenvios da mesma gravação não duplicam o histórico.

Materiais sem avaliação também podem receber comentários. Quando os critérios chegam depois, seus comentários continuam no material. Edições vinculadas a classificações anteriores continuam acessíveis no histórico da classificação.

**Os comentários são salvos no Supabase para o painel. Não há envio de edições à Monday.** O texto atual da fonte continua disponível separadamente; classificações, pontuações e responsáveis pela avaliação não são alterados.

A busca, a lista e o CSV usam os comentários atuais. O CSV mantém as colunas anteriores e acrescenta UA de referência, Unidade da UA, Lote, ID do item de validação, Gestor do material, Revisor atribuído e Tipo de BDQ. Autoria, data, versão e texto da fonte continuam na exportação. O histórico completo permanece no painel.

## Arquivos principais

- `index.html`, `styles.css`: menu, filtros, cartões, tabela, lista e painel de comentários.
- `app.mjs`: autenticação, consultas e interações.
- `source-loading.mjs`: limite independente da consulta dos planos e mensagens que distinguem falha de comunicação de tempo excedido.
- `core.mjs`: vínculos, critérios vigentes, histórico, filtros e exportação.
- `navigation.mjs`: seções por categoria.
- `monday-data.mjs`: formulários e pareceres sincronizados.
- `workflow.mjs`: status, catálogo global de filtros, inventário e linhas da tabela.
- `portal-comments.mjs`: comentários, versões e mensagens de conflito.
- `pe-names.mjs`: nomes da Planilha de entrada sem alterar os vínculos das avaliações e dos comentários.
- `auth-policy.mjs`: validação dos domínios autorizados no cliente.
- `release.mjs`: versão visível da entrega.
- `view-model.mjs`: destaque seguro da pesquisa e funções de resultado dos critérios.
- `supabase/`: instalação incremental das fontes e da gravação protegida.
- `config.js`, `vendor/supabase.js`: configuração pública e SDK.

Nunca use uma chave administrativa em `config.js`. As consultas e gravações continuam condicionadas à sessão e ao domínio institucional no banco. O SQL 05 acrescenta somente o domínio Ulife à autorização institucional e mantém as proteções dos comentários e do histórico.

## Verificação

Passaram 96 testes de lógica (`node --test tests/*.test.mjs`). Os novos testes cobrem Modelagem/Modelagens no design, A1/A2/A3, vínculo exato do A2, responsáveis da fonte, ausência de vínculos inventados, busca e CSV, comentários e integração dos bancos ausentes sem trocar a chave dos existentes. As verificações anteriores de autenticação, filtros, prazos de consulta, nomes e histórico continuam passando.

Em PostgreSQL embarcado, o SQL 08 foi aplicado sobre a instalação do SQL 07, também com as migrações anteriores. Foram conferidos o campo Gestor nas views de materiais e critérios, a nova fonte de A1/A2/A3, o banco A2 ausente da consolidada, a chave antiga do A1, a gravação/edição de comentários do A2, o histórico anterior, a execução repetida e o acesso dos dois domínios, com externos e anônimos bloqueados nas consultas protegidas. Os 455 planos da distribuição de teste foram mantidos; com a regra solicitada, 2 entram no design e 79 ficam nos demais status.

Em DOM simulado, foram verificados Esteira na Planilha, Gestor e Revisor no BDQ, os três tipos de banco, quatro/cinco/três/três colunas nas abas, linhas vazias com colspan correto, pesquisa por gestor, abertura de comentários e texto seguro. Também foram verificadas falhas independentes das fontes complementares e a preservação da última consulta concluída.

A inspeção em navegador real, o login institucional, a execução do SQL 08 no projeto de produção e a publicação no GitHub não foram realizadas nesta entrega.
