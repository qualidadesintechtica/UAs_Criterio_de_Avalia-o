# Comentários e avaliações dos materiais — V6.3

Página para GitHub Pages com login institucional do BI, menu lateral Planilha de entrada, UA, BDQ e UC, filtros compartilhados e comentários com histórico.

## Fonte completa da Planilha de entrada

O diagnóstico enviado em 19/10/2026 confirmou 455 Planos de Produção na tabela sincronizada de validações e nenhum deles na base consolidada que a página consultava. A V6.2 corrigiu o nome da categoria, mas essa mudança não podia recuperar registros ausentes da consulta.

O SQL 06 acrescenta esses planos à view protegida do painel, diretamente de `monday_validacao_materiais`. Não modifica `vw_materiais_bi_consolidada`, a sincronização, as demais páginas do BI, as tabelas de comentários, as políticas de histórico ou a função de gravação. A checagem institucional existente continua protegendo a leitura.

Cada plano é identificado pelo ID do item na Monday. Formulários e critérios vinculados a esse item compartilham a mesma identidade, sem contar uma vez por critério, parecer, código de UC ou subelemento. Os códigos e IDs das fontes dos comentários continuam preservados. O detalhe do material e o CSV mostram o ID do item de validação para conferência.

Os nomes de UC e UA usam o título disponível na base. Códigos, referências originais e busca por código continuam disponíveis. Não se inventam nomes nem vínculos em situações ambíguas.

## Instalar ou atualizar

**Esta versão exige o SQL 06 e a substituição dos arquivos da página.** Consulte COMECE_AQUI.md.

Se o SQL 05 já está instalado, execute somente `supabase/06_INCLUIR_PLANILHAS_DA_VALIDACAO.sql`. Em uma instalação nova sobre as fontes existentes do BI, execute o 05 e depois o 06. Não execute SQLs antigos depois do 06.

Envie todo o conteúdo extraído para a raiz publicada pelo GitHub Pages. Confira **V6.3 · 19/10/2026** no login e no painel. Recursos e módulos usam um novo identificador de versão. A página informa quando o SQL 06 ainda não está disponível e deixa os cartões da Planilha sem totais até a atualização da fonte.

No diagnóstico recebido: 318 Validados, 56 Liberados para validação, 30 A liberar, 2 em Ajustes - MODELAGEM, 3 N/A e 46 Pausados, totalizando 455 itens. São valores de conferência daquele momento, nunca números fixados na aplicação. Mudanças na Monday ou filtros ativos alteram o resultado.

## Domínios autorizados

São permitidos `@animaeducacao.com.br` e `@ulife.com.br`, com conta cadastrada no BI. A mesma regra protege as quatro views de avaliações/materiais, as políticas de leitura de comentários/histórico e a função de gravação. O SQL 05 centraliza a verificação em `nq_painel_acesso_institucional`, sem elevar privilégios. Domínios externos, subdomínios não autorizados e usuários anônimos continuam bloqueados no painel. A inclusão de domínio não cria contas nem muda senhas. O carregamento verifica a regra no servidor e avisa quando a página V6 encontra uma base ainda não atualizada.

## Dados da Monday

A página usa a sincronização existente entre Monday e Supabase.

| Menu | Categorias da fonte |
| --- | --- |
| Planilha de entrada | Plano de Produção do quadro de validações, além dos registros PE anteriores |
| UA | Unidade de Aprendizagem / UA |
| BDQ | Banco de questões / BDQ / Avaliação A1 / Avaliação A3 |
| UC | UC / Unidade Curricular |

As fontes protegidas são:

- `vw_ua_resultados_criterios_autenticados`: critérios, classificações, especialistas, revisores, pareceres, lote e status.
- `vw_ua_resultados_materiais_autenticados`: IDs, nomes, unidade, esteira, matriz, semestre, lote e status. A V6.3 acrescenta os Planos de Produção ausentes a partir de `monday_validacao_materiais`, com `origem_material=validacao_planos`, preservando os tipos e a ordem dos 17 campos anteriores.
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

Na Planilha de entrada, cada ID do item do quadro conta uma vez. Os nomes dos grupos físicos não substituem a coluna Status Validação. Formulários sem vínculo inequívoco continuam acessíveis e editáveis, identificados na tabela, mas ficam fora dos totais do quadro. A classificação de um critério, sua pontuação e a existência de um comentário não são usadas para inventar um status operacional. Status diferentes, como Pausado e Revalidar - NQ, permanecem na visão completa. As quatro contagens podem não somar todos os materiais por esse motivo. Uma nota acima dos filtros discrimina os demais status, incluindo Ajustes - MODELAGEM, A liberar, N/A e Pausado; Modelagem não é convertida automaticamente em análise do design. Se a mesma identidade reúne status simultâneos, a prioridade de apresentação é design, em validação, liberada e validada.

A tabela mostra apenas **UC, UA e Unidade da UA**. A unidade vem de um campo explícito, do nome de unidade do item ou do código UA numerado. Um título de UA não é trocado pelo número da unidade. Quando o título não está disponível, o código original permanece visível.

Na aba UC, cada unidade recebe uma linha na tabela, mantendo a organização anterior dos indicadores e seus históricos. Clicar abre os registros da unidade selecionada; Ver todos os registros da UC abre a visão completa. O acesso pelo teclado usa o botão com o nome da UA. A opção Comentários conserva a lista de leitura por UC.

Foram removidos os indicadores e gráficos abaixo dos filtros. O detalhamento de critérios continua no painel de comentários. O tema claro usa off-white, com o tema escuro preservado.

## Comentários e histórico

Adicionar comentário cria uma informação complementar. Editar comentário modifica um texto existente. Histórico de comentários mostra cada versão, inclusive o original da Monday preservado pelo banco na primeira edição. Autor, e-mail, data e número da versão são registrados no servidor. O texto é tratado como texto puro, com limite de 10.000 caracteres.

A edição continua colaborativa entre as contas institucionais já autorizadas (`@animaeducacao.com.br` ou `@ulife.com.br`). A função de gravação verifica a sessão e o domínio. O navegador não recebe INSERT, UPDATE ou DELETE diretamente nas tabelas. RLS protege a leitura. Versões desatualizadas geram conflito e mantêm o texto digitado; reenvios da mesma gravação não duplicam o histórico.

Materiais sem avaliação também podem receber comentários. Quando os critérios chegam depois, seus comentários continuam no material. Edições vinculadas a classificações anteriores continuam acessíveis no histórico da classificação.

**Os comentários são salvos no Supabase para o painel. Não há envio de edições à Monday.** O texto atual da fonte continua disponível separadamente; classificações, pontuações e responsáveis pela avaliação não são alterados.

A busca, a lista e o CSV usam os comentários atuais. O CSV mantém as colunas anteriores e acrescenta UA de referência, Unidade da UA, Lote e ID do item de validação. Autoria, data, versão e texto da fonte continuam na exportação. O histórico completo permanece no painel.

## Arquivos principais

- `index.html`, `styles.css`: menu, filtros, cartões, tabela, lista e painel de comentários.
- `app.mjs`: autenticação, consultas e interações.
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

Passaram 79 testes de lógica (`node --test tests/*.test.mjs`), incluindo a reprodução da distribuição de 455 planos do diagnóstico, IDs diferentes com o mesmo código, status diferente do grupo físico, registros sem vínculo, filtros e preservação das origens dos comentários.

Em PostgreSQL embarcado (PGlite), a instalação SQL 05 → 06 foi testada com 455 itens sintéticos distribuídos conforme o diagnóstico enviado. Foram conferidos: 318 validados, 56 liberados, 81 em outros status; os 17 campos anteriores e o material de UA existente; matriz da coluna sincronizada; gravação e edição de comentários de planos; histórico anterior; instalação repetida; acesso Ânima/Ulife e bloqueio de externos e anônimos. A função de gravação permaneceu idêntica à anterior.

Em DOM simulado, foram conferidos os cartões, a identificação dos registros sem vínculo, os filtros, a abertura dos comentários, a indicação de fonte desatualizada e a limpeza da sessão. Isso não equivale à inspeção em um navegador real.

O diagnóstico real foi lido do arquivo enviado pela usuária, com consulta em 19/10/2026 às 09:21 (Brasília). O SQL 06 não foi executado no projeto de produção, e não houve publicação no GitHub ou login institucional real nesta entrega.
