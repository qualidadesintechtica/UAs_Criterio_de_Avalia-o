# Comentários e avaliações dos materiais — V6.6.3

Página para GitHub Pages com autenticação institucional, quatro abas, filtros compartilhados e comentários com histórico.

## Progresso em todas as abas e nome da UC — V6.6.3

Planilha de entrada, UA, BDQ e UC mostram a barra de cada material abaixo do nome, na tabela, na lista e no detalhe, mantendo as colunas existentes. Na UC, cada unidade usa seus próprios indicadores; a lista e a visão completa mostram o conjunto da UC. Sem critérios sincronizados, aparece uma barra cinza com traço, sem percentual inventado.

O aviso de nome da UC agora distingue planilhas e formulários sem vínculo, mostra as referências e permite abrir o registro em Ver detalhes. A busca de nomes aceita também vínculos exatos por item de validação e chave do material. Um título ausente ou ambíguo permanece identificado para correção na origem. Consulte **LEIA_PROGRESSO_TODAS_ABAS_E_NOMES.md**.

**Participantes** fica no menu lateral e no cabeçalho, junto de Atualizar dados. A área reúne Criar login, Editar nome e perfil e Trocar senha. Se faltar instalação ou autorização, o painel informa o motivo e bloqueia as operações. O servidor continua exigindo uma das três contas autorizadas com perfil Admin. A atualização não amplia essas permissões.

Esta versão de interface não exige um SQL novo. Para a gestão que ainda não foi instalada, são necessários o SQL 09 e a função nq-gerenciar-usuarios. Siga **COMECE_AQUI.md** e **LEIA_PARTICIPANTES_E_PROGRESSO_UA.md**.

## Correção de leitura dos critérios — V6.6.1 preservada

Para o erro **57014 na fonte critérios**, esta versão limita cada lote de subelementos antes da junção com os materiais enriquecidos. O aplicativo lê os lotes em sequência, preservando o conjunto e as permissões. **Execute todo o SQL 10, depois substitua os arquivos da página**, incluindo `criteria-loading.mjs`. Siga **COMECE_AQUI.md** e **LEIA_CORRECAO_57014.md**. Se o SQL 09 e a função de gestão de usuários já estão instalados, não é necessário repeti-los.

Os recursos da V6.6 descritos abaixo continuam incluídos. Em instalação nova, siga 05 → 07 → 08 → 09 → 10 e publique a função de usuários conforme o guia de acessos.

## Usuários, perfis e progresso — V6.6 preservados

A tela inicial recebe **Criar login e senha**. A área interna **Participantes** permite criar contas, editar nome e perfil e definir senha temporária, restrita no servidor a ligia.neta@animaeducacao.com.br, joao.cane@animaeducacao.com.br e cristina.brito@animaeducacao.com.br. Os perfis são **Especialista, Revisor e Admin**. Quem recebe senha temporária deve escolher outra antes de consultar os resultados.

Cada UA mostra sua barra **Respostas dos especialistas**, com critérios respondidos e percentual no recorte atual, abaixo do nome e no detalhe da UA. Comentários complementares não alteram o progresso; materiais sem critérios sincronizados são sinalizados. O total considera somente critérios disponíveis na base.

Para habilitar a gestão de usuários pela primeira vez, **instale o SQL 09 e publique a função nq-gerenciar-usuarios**. Para a leitura corrigida dos critérios, instale também o SQL 10. Atualize todos os arquivos do GitHub depois. Subir os arquivos ao GitHub não instala o servidor. Siga **COMECE_AQUI.md** e **LEIA_USUARIOS_E_ACESSOS.md** para instalação, perfis iniciais, confirmação de e-mail e uso das contas compartilhadas com o BI.

## Leitura de UA e UC — V6.5 preservada

O painel de UA e UC aproveita mais a largura da tela e apresenta um registro por vez. O menu lateral reúne os critérios, o status de cada um e a indicação de comentário. Os botões Anterior e Próximo permitem percorrer os registros sem rolar uma sequência de cartões. Uma busca localiza critérios ou textos dos comentários no menu.

Esteira, lote, matriz, especialistas, revisores e o status original ficam em **Dados do material**, recolhidos inicialmente. O resumo da avaliação e o botão Adicionar comentário permanecem acessíveis acima da área de leitura. Comentários extensos e históricos abertos podem exigir rolagem dentro da área de leitura. O menu possui rolagem própria quando há muitos registros.

Em telas menores, **Ir para critério** substitui o menu lateral. Na UC, a abertura por unidade e a opção Ver todos os registros da UC foram preservadas. Os critérios e os complementos continuam acessíveis em ambas as visões.

Editar e adicionar comentários usa as mesmas origens e a mesma função de gravação. Trocar de critério com uma edição aberta mantém o texto e solicita salvar ou cancelar. Após salvar, o painel mostra o registro editado ou o novo complemento. Histórico, autoria, versões, classificação e texto original da Monday continuam disponíveis.

A mudança de leitura da V6.5 não exigiu SQL novo. A V6.6 acrescenta o SQL 09 e a função de gestão de acessos. O arquivo `review-panel.css` e a apresentação anterior de Planilha de entrada e BDQ continuam incluídos.

## Correções da V6.4 preservadas

- **Requer análise do design** passa a incluir Ajustes - MODELAGEM e Ajustes - Modelagens da Monday, em todas as abas. O status original continua preservado nos detalhes e no CSV.
- **Planilha de entrada** recebe a coluna Esteira, mantendo UC, UA, Unidade da UA e o acesso aos comentários pelo clique.
- **BDQ** inclui A1, A2 e A3 e recebe as colunas Gestor e Revisor. O tipo aparece ao lado do nome. A2 passa a ser reconhecido em materiais, critérios, formulários e pareceres.

Os bancos são conferidos também na tabela sincronizada do quadro de validações. A consulta complementar inclui A1/A2/A3 ausentes da base consolidada e atualiza gestor, revisor e status dos itens existentes pelo ID exato da Monday. As chaves dos materiais existentes são preservadas, para manter seus comentários e histórico. A consulta permanece independente e possui limite próprio; em caso de indisponibilidade, os dados disponíveis continuam acessíveis com aviso de contagem parcial.

Gestor corresponde ao campo `gestor_validacao_nq`. Revisor corresponde ao `revisor_validador` atribuído ao banco. O avaliador do formulário continua registrado e pesquisável. Não se atribuem responsáveis de uma UA ou de uma oferta ambígua a um BDQ.

## Base necessária para as correções da V6.4

A base de dados dos materiais continua exigindo o SQL 08. Se já está instalado, avance para o SQL 09 da V6.6. Se somente o SQL 07 está instalado, execute 08 e depois 09. Para instalação nova sobre as fontes existentes do BI, siga COMECE_AQUI.md: 05 → 07 → 08 → 09 → 10. Não execute scripts antigos depois do 09.

O SQL 08 acrescenta o campo Gestor ao final das consultas protegidas e cria a consulta específica de BDQ. A função de gravação mantém seu contrato e ganha uma busca adicional de origem para permitir comentários nos bancos dessa consulta. Não altera os dados sincronizados, a base consolidada, as tabelas de comentários ou as versões anteriores.

Após publicar, confira **V6.6.3 · 21/10/2026**, clique em Atualizar dados e, para conferir o total completo, em Limpar filtros. Os arquivos usam um novo identificador de versão para reduzir a reutilização de recursos antigos.

Autenticação Ânima/Ulife, consultas independentes, contagem dos planos por ID, busca, filtros entre abas, paginação, lista, exportação e temas continuam disponíveis.

## Domínios autorizados

São permitidos `@animaeducacao.com.br` e `@ulife.com.br`, com conta institucional existente ou criada pelo cadastro desta página. A mesma regra protege as consultas de avaliações/materiais, as políticas de leitura de comentários/histórico e a função de gravação. O SQL 05 centraliza a verificação em `nq_painel_acesso_institucional`, sem elevar privilégios. Domínios externos, subdomínios não autorizados e usuários anônimos continuam bloqueados no painel. A inclusão de domínio não cria contas nem muda senhas. O carregamento verifica a regra no servidor e avisa quando a página V6 encontra uma base ainda não atualizada.

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
- `review-panel.css`: largura, menu de critérios e área de leitura de UA/UC; adaptações para telas menores.
- `app.mjs`: autenticação, consultas e interações.
- `source-loading.mjs`: limite independente da consulta dos planos e mensagens que distinguem falha de comunicação de tempo excedido.
- `criteria-loading.mjs`: leitura integral dos critérios por lotes, antes da junção.
- `supabase/10_CRITERIOS_PAGINADOS.sql`: função protegida e índices de apoio para a leitura.
- `core.mjs`: vínculos, critérios vigentes, histórico, filtros e exportação.
- `navigation.mjs`: seções por categoria.
- `monday-data.mjs`: formulários e pareceres sincronizados.
- `workflow.mjs`: status, catálogo global de filtros, inventário e linhas da tabela.
- `portal-comments.mjs`: comentários, versões e mensagens de conflito.
- `pe-names.mjs`: nomes da Planilha de entrada sem alterar os vínculos das avaliações e dos comentários.
- `auth-policy.mjs`: validação dos domínios autorizados no cliente.
- `access.mjs`, `access-policy.mjs`, `access.css`: cadastro, perfis, gestão e troca obrigatória.
- `specialist-progress.mjs`: progresso das respostas dos critérios sincronizados.
- `supabase/09_USUARIOS_E_ACESSOS.sql`: autorização, perfis e registro de senha temporária.
- `supabase/functions/nq-gerenciar-usuarios/index.ts`: criação e senha temporária no servidor.
- `release.mjs`: versão visível da entrega.
- `view-model.mjs`: destaque seguro da pesquisa e funções de resultado dos critérios.
- `supabase/`: instalação incremental das fontes e da gravação protegida.
- `config.js`, `vendor/supabase.js`: configuração pública e SDK.

Nunca use uma chave administrativa em `config.js`. As consultas e gravações continuam condicionadas à sessão e ao domínio institucional no banco. O SQL 05 acrescenta somente o domínio Ulife à autorização institucional e mantém as proteções dos comentários e do histórico.

## Verificação

Passaram 127 testes de lógica (`node --test tests/*.test.mjs`). Os testes cobrem Modelagem/Modelagens no design, A1/A2/A3, vínculo exato do A2, responsáveis da fonte, ausência de vínculos inventados, busca e CSV, comentários e integração dos bancos ausentes sem trocar a chave dos existentes. As verificações anteriores de autenticação, filtros, prazos de consulta, nomes e histórico continuam passando.

Na verificação da V6.4 em PostgreSQL embarcado, o SQL 08 foi aplicado sobre a instalação do SQL 07, também com as migrações anteriores. Foram conferidos o campo Gestor nas views de materiais e critérios, a nova fonte de A1/A2/A3, o banco A2 ausente da consolidada, a chave antiga do A1, a gravação/edição de comentários do A2, o histórico anterior, a execução repetida e o acesso dos dois domínios, com externos e anônimos bloqueados nas consultas protegidas. Os 455 planos da distribuição de teste foram mantidos; com a regra solicitada, 2 entram no design e 79 ficam nos demais status.

Em DOM simulado, foram verificados Esteira na Planilha, Gestor e Revisor no BDQ, os três tipos de banco, quatro/cinco/três/três colunas nas abas, linhas vazias com colspan correto, pesquisa por gestor, abertura de comentários e texto seguro. Também foram verificadas falhas independentes das fontes complementares e a preservação da última consulta concluída.

Na V6.5, o DOM simulado também verificou UA com sete critérios; UC por unidade e completa com quatorze indicadores; menu, busca, seletor, Anterior/Próximo, limites da navegação e um cartão aberto por vez. Foram verificadas edição durante troca de critério, gravação mantendo o registro selecionado, complemento no critério atual, conflito sem perda de texto, leitura do original e das versões anteriores, HTML seguro e limpeza da sessão. As verificações de Planilha e BDQ passaram junto das novas interações. Os arquivos SQL e as regras de dados não foram alterados.

Na V6.6, passaram também 108 verificações do controlador de acessos, 321 da função de servidor e 39 do SQL em PostgreSQL embarcado. A inspeção visual em navegador real usou dados de teste. As verificações de acesso e mutação não alteraram contas reais. O login institucional real, a publicação no GitHub, a função hospedada e o SQL em produção não foram executados nesta preparação. Consulte LEIA_USUARIOS_E_ACESSOS.md para os limites e a instalação.

Na V6.6.1, passaram 195 verificações adicionais do SQL de paginação e a integração da nova leitura em DOM simulado. A comparação das 1.208 linhas da base de teste manteve o resultado da definição enviada, com três tamanhos de lote. Consulte LEIA_CORRECAO_57014.md para instalação e limites da verificação em produção.

Na V6.6.2, passaram 131 verificações do controlador de acessos e a regressão das novas barras por UA. A inspeção visual em navegador usou dados de teste. A instalação e a autorização reais do servidor precisam ser conferidas na área Participantes após a publicação.

Na V6.6.3, a regressão verificou barras em tabela, lista e detalhe das quatro abas, indicadores por unidade de UC, diagnóstico de nomes pendentes e abertura do registro afetado. Foram preservados filtros, contagens, comentários, histórico e leitura paginada completa. A inspeção visual em navegador confirmou as quatro abas e a barra cinza sem critérios, com dados de teste. SQL, função de usuários e configuração não foram alterados. Consulte LEIA_PROGRESSO_TODAS_ABAS_E_NOMES.md para os limites da correção na origem.
