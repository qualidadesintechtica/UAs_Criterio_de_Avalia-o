# V6.6.11 — consulta dos responsáveis e filtros

A imagem da página publicada mostra que a fonte de responsáveis da Monday falhou. Quando isso ocorre, a V6.6.10 desabilita os filtros de pessoas e mostra apenas uma mensagem genérica. A imagem não permite distinguir tempo excedido de permissão ou outra falha da base.

Também foi identificado um problema no caminho de leitura: a view da V6.6.10 materializa os itens e as colunas da base inteira antes da paginação. A página consultava essa view novamente em cada lote de 1.000 linhas, dentro de um prazo único de 15 segundos. O teste anterior com uma base pequena não demonstrava o comportamento com um volume maior.

## O que muda

- A função `nq_painel_responsaveis_pagina` seleciona até 500 materiais por vez, usando a chave board + item. Só então consulta as colunas desses materiais.
- Não usa OFFSET nem volta ao início da base a cada página. Os índices específicos atendem à paginação e à leitura de colunas por item.
- A resposta é um único JSON por chamada. Várias colunas de pessoas do mesmo item não são cortadas pelo limite de linhas do serviço.
- Materiais sem responsáveis também avançam o cursor. IDs bigint são transportados como texto, sem perda de precisão no navegador.
- Em caso de tempo excedido, o leitor reduz o lote para 125 e, se necessário, 50, repetindo o mesmo cursor. O carregamento tem prazo total de 45 segundos, dentro do limite geral de 60 segundos da página.
- Falha em qualquer página rejeita a consulta inteira. A tabela não apresenta os responsáveis de um lote parcial como se toda a base tivesse sido lida.
- O aviso exibe o código real da falha e distingue instalação, permissão, sessão e tempo. Os demais filtros e os materiais continuam disponíveis quando só a fonte de pessoas falha.

## Aplicar

1. Execute inteiro `supabase/14_RESPONSAVEIS_PAGINADOS.sql` no projeto `nkjmgzyjjbepebzurowy`.
2. Confira a mensagem de instalação **V6.6.11**. Se o SQL retornar um erro, envie esse erro antes de publicar.
3. Atualize todos os arquivos do site na raiz do repositório publicado, incluindo `monday-people-loading.mjs`.
4. Aguarde a publicação, pressione Ctrl + F5, confira V6.6.11 e clique em Atualizar dados.

Não é necessário repetir os SQLs anteriores nem republicar Edge Functions. O SQL 14 instala também o contrato atual da lista de especialistas cadastrados. Os registros da Monday, comentários, perfis e views existentes não são reescritos.

## Conferir na página

Selecione um nome que aparece na coluna Revisor na Monday e confira se os materiais exibidos têm esse responsável. Limpe os filtros. Selecione um especialista cadastrado que aparece na coluna Especialista na Monday e confira a seleção combinada. Um especialista cadastrado sem atribuições na Monday resulta em um recorte vazio. A lista de especialistas continua limitada ao perfil Especialista do cadastro do site.

Se o aviso persistir, copie a mensagem completa. Exemplos de códigos: `57014` (tempo no banco), `42501` (acesso recusado), `PGRST202` (função não encontrada) e `NQ_SOURCE_TIMEOUT` (prazo do navegador). Não é necessário compartilhar senha, token ou dados da sessão.

## Validação e limites

O SQL 14 foi executado e reinstalado em PostgreSQL de teste, usando a estrutura das fontes sincronizadas. A integração leu 4.005 materiais e 40.020 colunas não relacionadas, em nove lotes, passando o resultado real do SQL pelo leitor JavaScript e pelos filtros. Foram verificados controle de acesso, recusa a anon, especialistas cadastrados, IDs grandes, materiais vazios e cursor entre os dois boards.

Os testes da interface simulada cobrem seleção combinada nas quatro abas, troca de aba, limpeza, cadastro de especialistas, fonte ausente, tempo excedido, acesso negado, falha após um lote concluído e manutenção dos comentários. Os testes locais não substituem a conferência no Supabase publicado: não houve acesso à sessão institucional nem execução remota do SQL.

O fluxo de download permanece o da V6.6.10: SharePoint e OneDrive usam a sessão Microsoft do navegador e podem solicitar autenticação. Esta atualização não altera as permissões dos arquivos nem confirma um download real na conta Microsoft.
