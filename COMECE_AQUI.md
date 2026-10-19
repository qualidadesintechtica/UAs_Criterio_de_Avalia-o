# Publicar a V6.3.1 — corrigir o carregamento

## 1. Executar o SQL 07

A atualização precisa do **SQL 07** e dos arquivos da página.

1. Extraia o ZIP.
2. No Supabase do BI, abra **SQL Editor → New query**.
3. Abra `supabase/07_SEPARAR_CONSULTAS_E_PRESERVAR_COMENTARIOS.sql`, copie todo o conteúdo e cole no editor.
4. Com o cursor no editor, pressione **Ctrl + A** e clique em **Run**.
5. Confira: **V6.3.1 instalada: consulta dos planos separada e comentários preservados.**

Se você já executou o SQL 06, execute agora somente o 07. Se o SQL 06 não foi executado, o 07 também funciona diretamente sobre a instalação do SQL 05. Em uma base nova, execute primeiro o 05 e depois o 07. Não execute 05 ou 06 depois do 07.

O SQL 07 preserva a base consolidada do BI, a sincronização e os comentários existentes. Mantém o identificador dos planos para que os comentários da versão anterior continuem editáveis, com as mesmas versões. Não foi executado na produção nesta entrega.

## 2. Substituir os arquivos no GitHub

1. Substitua **todo o conteúdo da raiz publicada** pelos arquivos extraídos do ZIP, incluindo **source-loading.mjs**.
2. Mantenha `index.html` diretamente na raiz, junto dos módulos, config.js e das pastas vendor e supabase.
3. Aguarde a publicação e recarregue a página com **Ctrl + F5**.
4. Confira **V6.3.1 · 19/10/2026** no topo.
5. Entre, clique em **Atualizar dados**, abra Planilha de entrada e clique em **Limpar filtros**.

A consulta da Planilha de entrada tem limite próprio. Caso ela falhe, as outras abas continuam disponíveis e os totais da Planilha ficam indisponíveis, com aviso. Uma falha não é apresentada como total zero. Se ocorrer outro erro nas consultas principais, a nova mensagem mostra a fonte e o código, quando disponível; envie essa mensagem para análise.

## 3. Conferir os números

O diagnóstico enviado em 19/10/2026 às 09:21 (Brasília) tinha:

| Status da coluna de validação | Quantidade |
| --- | ---: |
| Validado | 318 |
| Liberado para validação - NQ | 56 |
| A liberar | 30 |
| Ajustes - MODELAGEM | 2 |
| N/A | 3 |
| Pausado | 46 |
| Total de planos | 455 |

Os quatro cartões continuam Liberada, Em validação, Requer análise do design e Validadas. Os demais status são discriminados acima dos filtros e continuam disponíveis na visão completa. Ajustes - MODELAGEM permanece como Modelagem, sem ser convertido em análise do design.

O status da coluna vale mais que o nome do grupo físico. No diagnóstico havia, por exemplo, itens A liberar dentro do grupo Validados e itens Validado no grupo Aguardando geração PDF do PP.

Cada ID da Monday conta uma vez. Critérios, subelementos, versões e comentários não aumentam o total de planos. Registros sem vínculo com um plano ficam sinalizados na tabela e fora dos totais dos cartões. Podem continuar sendo consultados e editados.

Os valores são uma referência do momento do diagnóstico. Compare a Monday e a página com os mesmos filtros e a sincronização atualizada. Os números não estão fixados no código.

## Funcionalidades preservadas

- Login institucional para @animaeducacao.com.br e @ulife.com.br, com contas já cadastradas no Supabase do BI.
- Menu lateral, quatro abas e filtros de Esteira, Lote, UC, UA, Revisor e Especialistas mantidos ao trocar de aba.
- Tabela com UC, UA e Unidade da UA; clique para abrir comentários.
- Inserção e edição de comentários, autoria e versões anteriores. As edições continuam no painel, sem alteração do texto na Monday.
- Busca, lista, paginação, CSV, tema escuro e tema claro off-white.

As demais abas mantêm as consultas e as regras anteriores. O ajuste desta entrega é a fonte dos Planos de Produção na Planilha de entrada.
