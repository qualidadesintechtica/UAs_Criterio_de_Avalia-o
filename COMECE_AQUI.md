# Publicar a V6.3 — fonte completa da Planilha de entrada

## 1. Atualizar a consulta da base

Esta atualização precisa do **SQL 06**. Trocar apenas a pasta não recupera os planos que estavam ausentes da consulta.

1. Extraia o ZIP em uma pasta nova.
2. No Supabase do BI, abra **SQL Editor → New query**.
3. Abra `supabase/06_INCLUIR_PLANILHAS_DA_VALIDACAO.sql`, copie todo o conteúdo e cole na consulta nova.
4. Com o cursor no editor, pressione **Ctrl + A** e clique em **Run** para executar o arquivo inteiro.
5. Confira a mensagem **V6.3 instalada: Planos de Produção incluídos na consulta protegida.** O resultado também mostra a quantidade atual de planos, validados e liberados.

Se o SQL 05 ainda não foi instalado, execute `supabase/05_ATUALIZAR_PAINEL_V6_ULIFE.sql` e depois o SQL 06. Se o 05 já está instalado, não precisa repeti-lo. Não execute os arquivos antigos depois do 06.

O SQL 06 altera somente a consulta protegida usada por este painel. Mantém os dados, a base consolidada do BI, a sincronização, os comentários e o histórico. A instalação foi testada localmente; não foi executada no seu projeto nesta entrega.

## 2. Atualizar a página no GitHub

1. No repositório da página, substitua **todo o conteúdo da raiz publicada** pelos arquivos extraídos.
2. Mantenha `index.html` diretamente na raiz publicada, junto dos módulos, `config.js` e das pastas vendor e supabase. Não envie apenas o ZIP fechado.
3. Aguarde a publicação, abra a página e pressione **Ctrl + F5**.
4. Confira **V6.3 · 19/10/2026** no login e no topo do painel.
5. Entre, clique em **Atualizar dados**, abra **Planilha de entrada** e clique em **Limpar filtros**.

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
