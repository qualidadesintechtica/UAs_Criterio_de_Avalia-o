# Publicar a V6.2 — categoria e contagens da Planilha de entrada

## Aplicar esta correção

**Se o SQL 05 já foi executado, não precisa executar nenhum SQL novamente.** Esta correção altera os arquivos da página.

1. Extraia o ZIP e substitua todo o conteúdo na raiz publicada do GitHub Pages, incluindo o novo arquivo **pe-names.mjs**.
2. Aguarde a publicação e recarregue a página com **Ctrl + F5**.
3. Confira a marca **V6.2 · 19/10/2026** e abra **Planilha de entrada**.
4. Clique em **Atualizar dados** e **Limpar filtros**. Compare com a Monday usando os mesmos filtros de lote, esteira e status.

A página passa a incluir os itens cadastrados como **Plano de Produção** na base de validações, dentro de **Planilha de entrada**. Quando há vínculo inequívoco, material, critérios e formulário contam como uma só planilha, e o status é o atual do plano. Não é preciso alterar a categoria na Monday.

A contagem de planilhas corresponde a materiais agrupados; a quantidade de registros inclui critérios e pareceres. As duas quantidades podem ser diferentes. Formulários sem vínculo inequívoco e status fora dos quatro cartões continuam visíveis na visão completa. Os totais reais da sua base precisam ser conferidos após a publicação; não foram consultados nesta entrega.

As colunas UC e UA passam a mostrar o título da UC encontrado na base, em vez do código `_PP`. Filtros, busca e exportação usam o nome. Os códigos continuam preservados nos vínculos e em **Referência da planilha**, no painel de comentários.

Campos de título vazios, códigos repetidos no lugar do nome e variações de maiúsculas não descartam um nome disponível. Quando o ID da UC está vazio, a busca também considera o código exato da UA ou da chave composta do material. Não há associação por semelhança de nomes.

Se o nome estiver ausente ou houver títulos conflitantes para o mesmo código, a página mostra **Nome da UC não localizado**, com a referência original nos detalhes. O nome deve ser corrigido na base; a página não inventa títulos.

## Se o SQL 05 ainda não foi executado

1. Extraia o ZIP em uma pasta nova.
2. Abra o projeto Supabase do BI → **SQL Editor → New query**.
3. Copie e execute todo o arquivo **supabase/05_ATUALIZAR_PAINEL_V6_ULIFE.sql**.
4. Aguarde a mensagem **V6 instalada: domínios Ânima e Ulife, lote, status e histórico preservado.**

O arquivo 05 reúne a atualização das consultas, o lote, os status, os comentários e os dois domínios. Ele funciona sobre as fontes da Monday já existentes no seu BI e não exige executar os arquivos 01 a 04 antes. Se você já executou esses arquivos, execute somente o 05 nesta atualização. Não execute um SQL antigo depois do 05.

Os comentários e seus históricos anteriores são preservados. O script usa uma transação: se falhar, a execução é desfeita. O SQL não foi executado no seu projeto nesta entrega.

## Substituir os arquivos da página

1. No repositório GitHub, abra a pasta usada pelo GitHub Pages.
2. Envie **todo o conteúdo extraído do ZIP**, substituindo os arquivos anteriores e incluindo os arquivos novos. Mantenha **index.html na raiz publicada**, junto de config.js, app.mjs, auth-policy.mjs, release.mjs, workflow.mjs, pe-names.mjs, os outros módulos e as pastas vendor e supabase.
3. Não envie o ZIP fechado como se ele fosse a página. Não coloque os arquivos dentro de uma segunda pasta abaixo da raiz publicada.
4. Aguarde a publicação terminar no GitHub. Abra a página e recarregue com **Ctrl + F5**.
5. Confira a marca **V6.2 · 19/10/2026** no login e no topo do painel. Se essa marca não aparecer, a página exibida ainda não é a V6.2.

Os arquivos da V6 usam um identificador de versão nos links do CSS, da configuração, do SDK e dos módulos. Isso reduz a reutilização de arquivos antigos pelo navegador. A marca visível permite verificar o HTML que foi publicado. O painel também consulta a regra de acesso no banco e avisa quando a atualização V6 ainda não foi confirmada.

## Acesso

São permitidos **@animaeducacao.com.br** e **@ulife.com.br**, com uma conta já cadastrada no Supabase do BI. Liberar o domínio não cria contas e não muda senhas. Não use chave administrativa nos arquivos da página.

A permissão dos dois domínios está na página e no banco: leitura das avaliações, dos pareceres, dos comentários e do histórico, além da gravação de comentários. Outros domínios e acesso anônimo continuam bloqueados para este painel.

## Como conferir as alterações

- **Esteira** oferece o catálogo conjunto das quatro abas, inclusive na Planilha de entrada.
- **Lote** usa o campo Bloco da base.
- Os seis filtros mantêm as seleções ao trocar entre Planilha de entrada, UA, BDQ e UC.
- Os cartões são **Liberada**, **Em validação**, **Requer análise do design** e **Validadas**. Clique novamente no cartão selecionado para mostrar todos os status.
- Os indicadores e gráficos abaixo dos filtros foram removidos.
- A tabela mostra somente **UC, UA e Unidade da UA**. Clique na linha ou no nome da UA para abrir os comentários.
- O tema claro usa **off-white**; o tema escuro continua disponível.
- Login, busca, lista de comentários, paginação, exportação, edição e histórico foram mantidos.

Na aba UC, cada unidade aparece em sua linha. O clique abre os registros daquela unidade; **Ver todos os registros da UC** mantém o acesso à visão completa.

As escolhas não são apagadas ao trocar de aba. Uma aba sem resultados para o recorte atual fica vazia. Use **Limpar filtros** para voltar à visão completa.

As edições continuam salvas no painel, com autor, data e versões anteriores. O original da Monday permanece preservado. A edição no painel não altera o texto nem a classificação da Monday.
