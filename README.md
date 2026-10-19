# Comentários e avaliações dos materiais — V6.3.1

Página para GitHub Pages com login institucional, menu lateral, filtros compartilhados e comentários com histórico.

## Correção do carregamento

A consulta dos planos agora é independente da consulta dos demais materiais. O SQL 07 restaura a consulta de materiais anterior e cria uma view protegida específica dos Planos de Produção, sem o JOIN e a conversão da linha inteira para JSON usados no SQL 06.

Uma falha ou demora da fonte de planos não interrompe UA, BDQ e UC. A consulta dos planos tem um limite próprio de 12 segundos. Se não concluir, a página informa que a Planilha de entrada está indisponível e deixa seus totais em branco, mantendo os demais dados carregados. A próxima atualização tenta novamente. A fonte indisponível não é tratada como uma planilha com total zero.

As mensagens distinguem tempo excedido no banco, limite do carregamento e falha de comunicação. Falhas nas fontes principais indicam a fonte e, quando disponível, o código do erro. A última consulta concluída continua visível se uma atualização falhar.

## Instalar ou atualizar

**Execute `supabase/07_SEPARAR_CONSULTAS_E_PRESERVAR_COMENTARIOS.sql` e substitua todos os arquivos da página**, incluindo o novo módulo `source-loading.mjs`. O SQL 07 funciona com ou sem o SQL 06 anterior, desde que o SQL 05 esteja instalado. Em instalação nova, execute 05 e depois 07. Não repita os scripts antigos depois do 07.

O SQL 07 mantém os IDs `VALIDACAO_PP_<item>`, os comentários e as versões anteriores. A função de gravação recebe somente uma busca adicional na nova view protegida, mantendo autoria, conflitos, verificação de origem e histórico. Os dois domínios institucionais e as demais proteções continuam vigentes.

Confira **V6.3.1 · 19/10/2026** no login e no painel após a publicação. Todos os recursos usam um novo identificador de versão.

## Conferência das contagens

O diagnóstico enviado em 19/10/2026 confirmou 455 Planos de Produção na tabela sincronizada e nenhum deles na consolidada que o painel consultava. A consulta específica continua trazendo esses planos por ID do item, com seus títulos, esteiras, matrizes, semestre, lote, revisor e status da coluna de validação.

No diagnóstico havia 318 Validados, 56 Liberados para validação, 30 A liberar, 2 em Ajustes - MODELAGEM, 3 N/A e 46 Pausados: total de 455 itens. Esses números não são fixados na aplicação. Formulários sem vínculo continuam visíveis e editáveis, fora dos totais operacionais. Grupos físicos da Monday não substituem o status da coluna.

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
- `vw_ua_resultados_materiais_autenticados`: IDs, nomes, unidade, esteira, matriz, semestre, lote e status. Na V6.3.1, essa consulta volta a usar somente a base consolidada. Os 17 campos anteriores e o marcador de origem são preservados.
- `vw_materiais_monday_avaliacoes_autenticadas`: formulários, avaliador, conceito final e sete indicadores de UC com suas pontuações.
- `vw_materiais_monday_pareceres_autenticados`: textos dos pareceres vinculados aos formulários.
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

Passaram 86 testes de lógica (`node --test tests/*.test.mjs`). Os novos casos verificam o limite independente da consulta, cancelamento de sessão, preservação de erros, combinação sem duplicidade e diferenciação entre fonte vazia e fonte indisponível. Os testes anteriores cobrem nomes, filtros, contagens, comentários, histórico e domínios institucionais.

Em PostgreSQL embarcado, foram verificadas as atualizações SQL 05 → 07 e SQL 06 → 07, a consulta independente dos 455 planos, os 318 validados e 56 liberados da distribuição usada nos testes, a edição de comentários criados antes do SQL 07, o histórico, a repetição segura e as permissões Ânima/Ulife, com bloqueio de externos e anônimos. Os itens dos testes são sintéticos; sua distribuição foi obtida do diagnóstico enviado.

No DOM simulado, uma consulta dos planos foi mantida pendente de propósito: UA carregou e a Planilha ficou com aviso e totais indisponíveis. A recuperação trouxe 455 planos/318 validados. Um erro de banco 57014 foi identificado como tempo excedido, mostrando a fonte e preservando a última consulta concluída. Também passaram as verificações dos filtros, cartões, detalhes de comentários, três colunas e limpeza da sessão.

A imagem enviada confirma a publicação da V6.3 e uma falha genérica de conexão; ela não contém o código técnico que permita afirmar a causa exata no servidor. A V6.3.1 remove a dependência conjunta das consultas e melhora a identificação de novas falhas. Não houve execução do SQL 07 na produção, login institucional real, inspeção em navegador real ou publicação no GitHub nesta entrega.
