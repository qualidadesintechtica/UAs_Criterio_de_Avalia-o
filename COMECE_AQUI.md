# Publicar a V6.4 — Modelagem, Esteira e BDQ

## 1. Atualizar a base

Se você já executou o SQL 07 da V6.3.1, execute **somente o SQL 08** nesta atualização.

1. Extraia o ZIP.
2. No Supabase do BI, abra SQL Editor → New query.
3. Copie **todo o conteúdo** de `supabase/08_GESTOR_DOS_MATERIAIS.sql` e cole no editor.
4. Com o cursor no editor, pressione Ctrl + A e clique em Run.
5. Confira: **V6.4 instalada: gestor disponível nas consultas protegidas; comentários e histórico preservados.**

Se o SQL 07 ainda não foi executado, execute primeiro o 07 e depois o 08. Em uma instalação nova sobre as fontes do BI, execute 05, 07 e 08, nessa ordem. Não execute arquivos antigos depois do 08.

O SQL 08 disponibiliza o Gestor nas consultas protegidas e acrescenta uma consulta direta dos BDQs A1/A2/A3 para incluir os bancos ausentes da consolidada. Preserva os IDs dos itens e as chaves dos materiais que já estavam na página. Comentários e histórico não são apagados ou reimportados. A sincronização da Monday e a base consolidada do restante do BI permanecem como estavam.

## 2. Substituir os arquivos no GitHub

1. Envie **todo o conteúdo extraído** para a raiz publicada da página, substituindo os arquivos anteriores.
2. Mantenha index.html na raiz junto dos módulos, config.js e das pastas vendor e supabase. Não envie apenas o ZIP fechado.
3. Aguarde a publicação e use Ctrl + F5.
4. Confira **V6.4 · 19/10/2026** no topo, clique em Atualizar dados e em Limpar filtros.

## 3. Conferir as alterações

| Aba / recurso | Alteração |
| --- | --- |
| Cartão Requer análise do design | Inclui Ajustes - MODELAGEM e Modelagens, em todas as abas. |
| Planilha de entrada | UC, UA, Unidade da UA e a nova coluna Esteira. |
| BDQ | A1, A2 e A3 identificados ao lado do nome; colunas UC, BDQ, Unidade da UA, Gestor e Revisor. |
| UA e UC | Permanecem com UC, UA e Unidade da UA. |

Gestor vem de Gestor Validação NQ; Revisor vem do revisor atribuído ao material na Monday. O avaliador do formulário continua nos registros, sem ocupar o lugar do revisor atribuído. Se a fonte não informar um responsável, aparece Não informado.

A busca também encontra gestor, revisor atribuído e tipo do banco. O CSV mantém as colunas anteriores e acrescenta Gestor do material, Revisor atribuído na validação e Tipo de BDQ. Esteira já fazia parte do CSV e continua disponível.

O clique continua abrindo os comentários, inclusive nas novas colunas. Edição, versões anteriores, filtros, paginação, login @animaeducacao.com.br / @ulife.com.br, tema escuro e claro off-white foram mantidos.

As consultas de planos e BDQs são independentes. Uma falha complementar mostra um aviso e preserva as demais informações disponíveis.

## Referência de contagem

No diagnóstico de 19/10/2026 às 09:21, havia 455 planos: 318 validados, 56 liberados, 30 A liberar, 2 em Modelagem, 3 N/A e 46 Pausados. Com a regra solicitada, os 2 de Modelagem entram em Requer análise do design; os outros status somam 79. Esses valores são apenas a referência daquele momento e não estão fixados na página.

O SQL 08 não foi executado no seu projeto e a publicação no GitHub não foi realizada nesta entrega.
