# Comentários e avaliações dos materiais — V6.2

Página para GitHub Pages com login institucional do BI, menu lateral **Planilha de entrada, UA, BDQ e UC**, filtros compartilhados e comentários com histórico.

## Correção da categoria e das contagens da Planilha de entrada

Na base de validações da Monday, a Planilha de entrada está cadastrada como **Plano de Produção**. A V6.1 excluía essa categoria. A V6.2 passa a reconhecer o nome exato Plano de Produção como PE, além de Planilha de Entrada e PE, tanto nos materiais quanto nos critérios, formulários e pareceres. Não é preciso renomear os itens na Monday.

Quando existe vínculo inequívoco com o plano, seus critérios e formulários são reunidos na mesma identidade de material, evitando contar novamente a planilha como um registro de inventário. O status atual do Plano de Produção prevalece sobre o conceito antigo do formulário. O status de uma UA da mesma UC não é usado como status da planilha.

Os vínculos usam o ID do item de validação, o código exato ou uma UC/título exato que identifique um único plano e oferta compatível. Lotes, matrizes, semestres e esteiras distintos continuam separados. Havendo mais de um plano possível, não se escolhe um arbitrariamente: o formulário permanece sem vínculo com um material específico até a base identificá-lo. Isso ainda pode causar diferença de contagem em registros sem vínculo.

As referências dos comentários continuam sendo os IDs da fonte, preservando edições e histórico. Esta atualização muda apenas os arquivos da página. O SQL 05, a autenticação e as permissões não mudaram.

## Correção dos nomes na Planilha de entrada

Na V6.1, UC e UA mostram o título da UC consultado na base. O rótulo deixa de usar o nome bruto do formulário terminado em `_PP`. A resolução ignora nomes vazios ou preenchidos com o próprio código e aceita diferenças de caixa e espaços para reconhecer o mesmo título. Pode usar o código da UA ou a chave composta quando o ID da UC estiver ausente. Códigos próximos não são associados automaticamente e títulos conflitantes permanecem sinalizados.

Os códigos da fonte e as referências dos comentários são preservados. O nome bruto do formulário é mantido em `sourceName` e aparece nos detalhes como Referência da planilha. A busca pelo código continua disponível. Filtros e exportação usam o título corrigido. Na V6.2, os formulários vinculados ao plano usam os identificadores reais desse material para o agrupamento.

A correção atua somente na seção PE; não muda a autorização, as consultas ao banco nem as respostas da avaliação. Não é necessário repetir o SQL 05 se ele já foi instalado.

## Instalar ou atualizar

Siga `COMECE_AQUI.md`. Para uma base ainda não preparada, execute `supabase/05_ATUALIZAR_PAINEL_V6_ULIFE.sql`. Para atualizar uma V6 já instalada, substitua somente os arquivos da página, incluindo `pe-names.mjs`. O arquivo reúne a preparação das views, lote, status, comentários e domínio Ulife sobre as fontes existentes do BI. Instala a estrutura de comentários quando ausente e preserva os registros já existentes. Os arquivos 01 a 04 permanecem como histórico e não devem ser executados depois do 05.

Envie todo o conteúdo extraído para a raiz publicada pelo GitHub Pages. A página deve mostrar **V6.2 · 19/10/2026** no login e no painel. CSS, configuração, SDK e módulos têm links com versão para reduzir a reutilização de arquivos anteriores.

A execução do SQL no seu projeto e a publicação no GitHub não foram feitas por este pacote.

## Domínios autorizados

São permitidos `@animaeducacao.com.br` e `@ulife.com.br`, com conta cadastrada no BI. A mesma regra protege as quatro views de avaliações/materiais, as políticas de leitura de comentários/histórico e a função de gravação. O SQL 05 centraliza a verificação em `nq_painel_acesso_institucional`, sem elevar privilégios. Domínios externos, subdomínios não autorizados e usuários anônimos continuam bloqueados no painel. A inclusão de domínio não cria contas nem muda senhas. O carregamento verifica a regra no servidor e avisa quando a página V6 encontra uma base ainda não atualizada.

## Dados da Monday

A página usa a sincronização existente entre Monday e Supabase.

| Menu | Categorias da fonte |
| --- | --- |
| Planilha de entrada | Plano de Produção / Planilha de Entrada / PE |
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

A edição continua colaborativa entre as contas institucionais já autorizadas (`@animaeducacao.com.br` ou `@ulife.com.br`). A função de gravação verifica a sessão e o domínio. O navegador não recebe INSERT, UPDATE ou DELETE diretamente nas tabelas. RLS protege a leitura. Versões desatualizadas geram conflito e mantêm o texto digitado; reenvios da mesma gravação não duplicam o histórico.

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
- `pe-names.mjs`: nomes da Planilha de entrada sem alterar os vínculos das avaliações e dos comentários.
- `auth-policy.mjs`: validação dos domínios autorizados no cliente.
- `release.mjs`: versão visível da entrega.
- `view-model.mjs`: destaque seguro da pesquisa e funções de resultado dos critérios.
- `supabase/`: instalação incremental das fontes e da gravação protegida.
- `config.js`, `vendor/supabase.js`: configuração pública e SDK.

Nunca use uma chave administrativa em `config.js`. As consultas e gravações continuam condicionadas à sessão e ao domínio institucional no banco. O SQL 05 acrescenta somente o domínio Ulife à autorização institucional e mantém as proteções dos comentários e do histórico.

## Verificação

Execute `node --test tests/*.test.mjs`: passaram **73 testes de lógica**, incluindo os 62 anteriores e 11 casos da categoria Plano de Produção, reunião dos registros sem duplicar materiais, status, ofertas distintas, vínculos ambíguos, filtros, exportação e preservação de edições e histórico. Os dados dos novos testes são exemplos controlados; os totais reais da Monday não foram consultados nesta entrega.

Em PostgreSQL embarcado (PGlite), nove verificações confirmaram a migração V5 → V6 sem perda do histórico, leitura das quatro views e dos comentários pelos dois domínios, gravação Ulife com autoria, conflitos, reenvios, proteção contra exclusão, bloqueio de outros domínios e anônimos, repetição segura do script e instalação usando somente o SQL 05 sobre as fontes do BI.

Na V6.1, uma simulação adicional verificou nomes nas duas colunas da Planilha, campos de título vazios, filtros por nome, referência original, abertura e edição de comentários e busca pelo código.

Na V6, em DOM simulado, foram verificados login Ulife, bloqueio de domínio externo, marca V6, links com versão, filtros nas quatro abas, cartões, tabela de três colunas, abertura dos comentários, criação, edição, histórico, texto seguro, lista, alternância do tema e saída da sessão.

A execução no seu projeto Supabase, o login institucional real, a inspeção visual em navegador e a publicação no GitHub não foram realizadas aqui.
