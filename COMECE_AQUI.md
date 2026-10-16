# Atualizar a página no GitHub Pages — V5

## Se você já usa a versão anterior

1. No Supabase do BI, abra **SQL Editor → New query**.
2. Execute `supabase/04_LOTE_E_STATUS_MATERIAIS.sql`. Ele deve ser executado depois dos arquivos 01, 02 e 03. Se ainda não instalou a edição de comentários, execute o arquivo 03 antes do 04.
3. Extraia este ZIP e substitua os arquivos e pastas no repositório GitHub, mantendo `index.html` na raiz.
4. Aguarde a atualização do GitHub Pages e recarregue a página com **Ctrl + F5**.
5. Entre com a conta institucional do BI e clique em **Atualizar dados**.

O SQL 04 acrescenta lote e status às consultas protegidas e mantém os comentários e históricos existentes. Ele também permite comentar materiais que ainda não receberam avaliação. Esse SQL não foi executado no seu projeto nesta entrega.

Não execute novamente os SQLs antigos depois do 04. Em uma instalação nova, siga a ordem abaixo.

## Primeira instalação

1. Execute `supabase/01_PROTEGER_ACESSO_RESULTADOS_UAS.sql`.
2. Execute `supabase/02_CONECTAR_MENUS_E_PARECERES_MONDAY.sql`.
3. Execute `supabase/03_COMENTARIOS_COM_HISTORICO.sql`.
4. Execute `supabase/04_LOTE_E_STATUS_MATERIAIS.sql`.
5. Envie os arquivos e pastas deste ZIP ao repositório em **Add file → Upload files**.
6. Em **Settings → Pages**, selecione **Deploy from a branch → main → / (root)** e clique em **Save**.

Se ocorrer um erro no SQL, resolva a instalação antes de publicar. Os scripts usam transações.

## O que mudou

- **Esteiras**: o filtro reúne as esteiras presentes nas quatro abas, inclusive na Planilha de entrada.
- **Lote**: novo filtro, com os valores do campo Bloco da base.
- **Filtros compartilhados**: esteira, lote, UC, UA/material, revisor e especialistas funcionam nas quatro abas. As escolhas são mantidas ao trocar de aba. Pesquisa, cartão selecionado e opção Somente com comentários também são mantidos. Use **Limpar filtros** para voltar à visão completa.
- **Cartões superiores**: Liberada, Em validação, Requer análise do design e Validadas. Clique no cartão para filtrar; clique novamente para mostrar todos os status.
- **Resumo inferior**: removidos os indicadores e gráficos abaixo dos filtros.
- **Tabela**: somente UC, UA e Unidade da UA. Clique na linha ou no nome da UA para abrir os comentários. O nome da UA também funciona pelo teclado.
- **Tema claro**: fundo e superfícies em off-white. O tema escuro continua disponível.

Os cartões seguem o status registrado na base, sem transformar uma inconformidade de critério em status do material. Materiais pausados ou com outros status continuam na visão completa e podem ficar fora dos quatro cartões. O botão **Limpar filtros** remove também o cartão selecionado.

Na aba UC, as unidades aparecem em linhas distintas. O clique abre os registros da unidade selecionada; **Ver todos os registros da UC** mantém o acesso à visão completa.

Os filtros não são apagados ao trocar de aba. Se a aba não tiver registros correspondentes às escolhas atuais, a tabela ficará vazia até você alterar ou limpar os filtros.

## O que foi preservado

Login institucional, menu lateral, conexão com a base Monday já sincronizada no Supabase, busca, lista de comentários, paginação, exportação CSV, edição dos comentários e histórico com autor, data e versões anteriores.

Na opção **Ver pareceres**, use **Adicionar comentário**, **Editar comentário** e **Histórico de comentários**. As edições continuam colaborativas entre as contas institucionais autorizadas. O original da Monday fica preservado; a edição no painel não altera o texto nem a classificação na Monday.

O CSV mantém os campos anteriores e acrescenta UA de referência, Unidade da UA e Lote.

O botão **Atualizar dados** consulta novamente o Supabase. As mudanças feitas na Monday aparecem depois que a sincronização existente as registrar.

Use seu e-mail `@animaeducacao.com.br` e a senha cadastrada no BI. Nunca coloque uma chave administrativa do Supabase nos arquivos da página.
