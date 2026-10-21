# Corrigir a leitura dos critérios — V6.6.1

O erro mostrado na página foi **57014, fonte critérios**: o banco interrompeu a consulta antes da conclusão. A V6.6 já havia carregado, mas essa falha impedia o preenchimento dos resultados e da barra de progresso.

Esta correção da V6.6.1 continua incluída na V6.6.2. Se o SQL 10 já foi instalado e a leitura funciona, não o repita para a mudança de barras e Participantes.

## Aplicar a correção

1. Extraia esta pasta.
2. No **SQL Editor do mesmo projeto Supabase do painel**, execute **todo o conteúdo** de `supabase/10_CRITERIOS_PAGINADOS.sql`. Não selecione somente um trecho.
3. Aguarde a mensagem **V6.6.1: leitura paginada instalada**.
4. No repositório **qualidadesintechtica/UAs_Criterio_de_Avalia-o**, substitua todo o conteúdo publicado pelos arquivos desta pasta. Inclua o novo `criteria-loading.mjs`, ao lado de `app.mjs` e `index.html`. Não envie o ZIP fechado nem crie uma pasta extra acima desses arquivos.
5. Aguarde o GitHub Pages publicar, pressione **Ctrl + F5** e confira **V6.6.2 · 21/10/2026** na tela.
6. Entre e clique em **Atualizar dados**. Após a leitura terminar, confira os totais, os critérios e o progresso com o mesmo recorte dos filtros usado anteriormente.

**Se a V6.6 e o SQL 09 já estão instalados, esta correção exige somente o SQL 10 e os arquivos da página.** Não reaplique 07, 08 ou 09 para corrigir esse erro. A função de usuários não precisa ser publicada novamente.

## O que foi alterado

A fonte recebida usa `monday_subelementos_validacao` com um `LEFT JOIN` em `nq_materiais_enriquecidos`, por `parent_item_id`. A leitura anterior paginava o resultado final da junção e podia solicitar quatro páginas simultâneas da mesma fonte.

A nova função **nq_criterios_pagina** seleciona um lote de 200 subelementos com critério antes de buscar os dados dos materiais. O aplicativo lê os lotes em sequência até o fim. Os limites não restringem o total carregado; cada chamada trata uma parte do conjunto.

O avanço da paginação usa a quantidade de subelementos lidos antes da junção. Isso preserva todos os vínculos quando há várias linhas de materiais para um mesmo `parent_item_id`, mesmo que um lote retorne mais de 200 linhas. Subelementos sem material associado também permanecem, como no `LEFT JOIN` original. O filtro de critério não nulo/não vazio e a regra de Sim/Não para `entra_no_calculo` foram mantidos.

O SQL acrescenta índices de apoio somente quando a fonte correspondente é tabela, tabela particionada ou view materializada. Se `nq_materiais_enriquecidos` for uma view comum, a instalação informa que nenhum índice foi criado nela e continua instalando a função. As estatísticas das fontes indexadas são atualizadas.

As views existentes não são substituídas. A função usa **nq_painel_acesso_institucional**, preservando a política atual, inclusive a exigência de troca de senha temporária quando o SQL 09 está instalado. Somente sessões autenticadas com acesso institucional autorizado podem executá-la.

A página também passa a ler as páginas adicionais das outras fontes em sequência. Ela só aplica os novos dados depois de concluir as fontes obrigatórias. Se uma página falhar, não apresenta o subconjunto como uma carga completa; havendo uma consulta anterior concluída, ela permanece visível com aviso.

O aviso de tempo excedido deixa de orientar a reinstalação do antigo SQL 07 e passa a identificar o SQL 10 para a fonte de critérios.

## Recursos preservados

- Cadastro, três perfis, gestão restrita aos três e-mails autorizados e senha temporária da V6.6.
- Barra de respostas dos especialistas, com o mesmo cálculo e os mesmos filtros.
- Comentários, versões, histórico e texto original da Monday.
- Filtros entre abas, status, nomes, esteiras, lotes, BDQ A1/A2/A3, gestores e revisores.
- Navegação por critério de UA/UC, tabelas, CSV e temas.
- Configuração pública do projeto, SDK, SQLs 01 a 09 e função de gestão de usuários.

## Verificação realizada

- **117 testes de lógica** passaram.
- **195 verificações de SQL** passaram em PostgreSQL embarcado. A comparação preservou exatamente as **1.208 linhas da consulta de referência da base de teste**, com lotes de 37, 200 e 500, incluindo vínculos múltiplos, ausência de material, ID nulo, critérios repetidos, autorização e reinstalação.
- A regressão do aplicativo passou em DOM simulado: abas, filtros, status, UA/UC, BDQ, comentários e histórico. A integração da nova leitura completou dois lotes com 201 critérios, manteve o progresso correto e preservou a consulta anterior quando o segundo lote falhou.

Os números acima são da base de teste, não os totais da Monday da equipe. A instalação no banco real e a publicação no GitHub não foram executadas nesta preparação.

## Se o erro continuar

A definição enviada identifica a junção, mas não traz os índices atuais, o plano de execução nem a carga do servidor. Esta entrega reduz o trabalho feito antes da paginação; não foi possível medir o tempo no seu projeto real.

Se o SQL 10 instalado e a página V6.6.2 ainda mostrarem 57014, envie o aviso completo com a fonte indicada e o resultado desta consulta somente de leitura:

```sql
select c.relname as fonte, c.relkind as tipo,
       case when c.relkind in ('v','m') then pg_get_viewdef(c.oid, true) end as definicao
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('monday_subelementos_validacao', 'nq_materiais_enriquecidos');

select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('monday_subelementos_validacao', 'nq_materiais_enriquecidos');
```

Essa informação permite verificar o próximo nível da consulta caso materiais enriquecidos seja uma view. Não altere o limite global do banco nem refaça migrações antigas para tentar ocultar o problema.
