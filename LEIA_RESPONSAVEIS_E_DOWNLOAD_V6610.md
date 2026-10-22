# V6.6.10 — responsáveis da Monday e download Microsoft

## O problema encontrado no ZIP enviado

O ZIP está na V6.6.9. A página lia `classificacao_feita_por` e `avaliador` para preencher os nomes de pessoas, mas não consultava as colunas de responsáveis atribuídos na Monday. Além disso, as views de materiais utilizadas pela página não expõem o especialista atribuído. Alterar a comparação dos nomes no navegador não supre essa informação.

A V6.6.10 acrescenta uma consulta protegida dos responsáveis sincronizados da Monday. Ela é usada pelas duas novas colunas da tabela e pelos filtros. A autoria de cada avaliação e comentário permanece nos seus registros.

## 1. Instalar a consulta no Supabase

No **SQL Editor** do projeto usado pela página (**nkjmgzyjjbepebzurowy**), execute **todo** o arquivo:

**supabase/13_RESPONSAVEIS_MONDAY.sql**

Esse é o SQL novo desta versão. Ele cria a view `vw_ua_responsaveis_monday_autenticados` e instala o contrato da lista de especialistas cadastrados. Não reaplique os SQLs 01 a 12.

O script exige as fontes de sincronização já usadas pelo BI e os perfis do SQL 09. Se alguma fonte não existir, a transação informa isso e não instala uma consulta incompleta.

O resultado deve ser **V6.6.10: responsáveis da Monday e lista de especialistas instalados**.

## 2. Publicar os arquivos

1. Extraia o ZIP.
2. Substitua **todo o conteúdo** na raiz publicada de `qualidadesintechtica/UAs_Criterio_de_Avalia-o`. Inclua o novo módulo **monday-people.mjs**.
3. Confirme o commit, aguarde a publicação e pressione **Ctrl + F5**.
4. Confira **V6.6.10 · 22/10/2026** e clique em **Atualizar dados**.

Não é necessário republicar as Edge Functions para esta atualização. A função de download dos outros provedores foi preservada. Não publique apenas o ZIP e não coloque os arquivos em uma pasta adicional.

## Tabela e filtros

As quatro abas passam a ter **Revisor na Monday** e **Especialista na Monday**. Na UC, cada linha de unidade mostra os responsáveis vinculados àquela unidade. Os CSVs passam a incluir essas duas informações também.

Os nomes vêm de **monday_item_colunas**, nas colunas que identificam especialistas e revisores, e das fontes de materiais de validação e produção. O revisor validador também usa o campo explícito de validação. O docente conteudista só é considerado especialista quando seu papel na fonte está explicitamente identificado como Especialista. Colunas de e-mail, status, pareceres e comentários não viram nomes de responsáveis.

O vínculo usa o ID do item de validação e as relações explícitas da esteira. Quando só existe código, exige correspondência de categoria, código e oferta, sem escolher entre itens diferentes quando o vínculo for ambíguo. Não agrupa materiais por nomes parecidos.

Os filtros de pessoas usam os mesmos responsáveis exibidos na tabela e mantêm os critérios e comentários completos dos materiais selecionados. **Especialistas** continua mostrando somente nomes de participantes cadastrados com esse perfil. O cadastro de login não atribui materiais; o nome precisa corresponder ao responsável informado na Monday, ignorando diferenças de caixa, acento e espaços.

Se a fonte não puder ser consultada, a página informa a falha e desativa os filtros de pessoas, em vez de usar autores de avaliações como se fossem os responsáveis atribuídos. **Não informado na Monday** indica ausência de nome nas fontes consultadas; **Vínculo ambíguo** exige conferência da origem.

Os dados acompanham a sincronização já instalada. A página não altera as pessoas na Monday. Depois de uma alteração lá, aguarde a sincronização e clique em Atualizar dados.

## Download do SharePoint

O erro da imagem anterior veio de `animaeducacao.sharepoint.com`, com HTTP 401. O serviço de download hospedado não possui os cookies da sessão Microsoft do usuário. Repetir a mesma solicitação desse serviço não fornece essa autenticação.

Para links reconhecidos de SharePoint e OneDrive, **Baixar planilha** agora solicita o download diretamente à Microsoft pelo navegador, preservando o link de compartilhamento e o parâmetro de download. Assim, a Microsoft pode usar a sessão da pessoa que clicou.

**Se a sessão estiver vencida ou ausente, pode abrir uma aba de login. Entre com a conta institucional que tem permissão no arquivo e conclua o download.** Sem permissão na origem, a Microsoft continuará bloqueando o arquivo. O sistema não torna os arquivos públicos.

O navegador não informa à página se o download externo foi concluído. Por isso, a mensagem é **Download solicitado à Microsoft**, sem marcar o arquivo como baixado. Alguns formatos de link e políticas do SharePoint podem abrir uma página de acesso ou visualização antes do download. Isso precisa ser conferido com uma planilha real da equipe.

Anexos hospedados na Monday e links de outros provedores continuam usando o serviço existente. O fluxo Microsoft não envia a sessão Supabase para o SharePoint e não exige uma chave administrativa na página.

## Conferir depois de instalar

1. Abra um material conhecido e compare as novas colunas com os responsáveis da Monday.
2. Escolha esse revisor e esse especialista nos filtros. Confira tabela, cartões, menu lateral e exportação.
3. Troque de aba, teste uma combinação sem resultado e use **Limpar filtros**.
4. Em Planilha de entrada, clique em Baixar planilha e entre na Microsoft se solicitado. Confirme o arquivo na pasta de downloads.

Se a tabela continuar sem nomes, execute no SQL Editor esta conferência administrativa das colunas sincronizadas. A view protegida da página exige a sessão de uma pessoa do site, que o SQL Editor não fornece automaticamente; por isso a consulta abaixo lê somente os metadados e as contagens da fonte:

```sql
select monday_board_id,column_id,column_title,column_type,
       count(*) filter (where nullif(btrim(column_text),'') is not null) as valores_preenchidos
from public.monday_item_colunas
where monday_board_id in (9433297929,9376982027)
  and column_title ~* '(especial.sta|revis.r)'
group by monday_board_id,column_id,column_title,column_type
order by monday_board_id,column_title;
```

Esses resultados ajudam a identificar colunas com nomes diferentes ou valores de pessoas não sincronizados. IDs de pessoas sem nome legível não são transformados em nomes inventados.

## Validação desta entrega

O SQL 13 foi executado em PostgreSQL de teste, com leitura de responsáveis, exclusão de campos de e-mail/status/parecer, controle de acesso e reinstalação. Os testes da página exercitaram responsáveis diferentes dos autores das avaliações, vínculos por ID e oferta, ambiguidades, filtros, tabela das quatro abas, CSV e comentários.

Passaram **186 testes de lógica e serviço** e os cenários de interface em **DOM simulado**. O clique Microsoft foi verificado como navegação para a origem com pedido de download, sem chamar o serviço que recebia HTTP 401. Isso não comprova o salvamento de uma planilha real.

Não houve aplicação do SQL ou publicação no ambiente real nesta sessão. O download ainda precisa ser validado com a conta Microsoft que acessa o arquivo da equipe.
