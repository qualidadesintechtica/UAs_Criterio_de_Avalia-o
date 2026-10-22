# V6.6.12 — carga de critérios por cursor

1. Execute inteiro **supabase/16_CRITERIOS_POR_CURSOR.sql** no SQL Editor do projeto Supabase atual.
2. Confira a mensagem **V6.6.12: critérios por cursor instalados**.
3. Publique os arquivos deste pacote na raiz do site no GitHub. Inclua **criteria-cursor.mjs**, **app.mjs**, **index.html** e os demais módulos atualizados.
4. Aguarde a publicação, pressione Ctrl + F5, confira **V6.6.12** e clique em **Atualizar dados**.

Não é necessário repetir os SQLs anteriores nem republicar Edge Functions. O CSV de 22/10/2026 já confirmou a correção do cursor dos responsáveis instalada pelo SQL 15.

A carga de critérios usa o último ID lido para buscar o lote seguinte. A chave única confirmada no diagnóstico permite avançar sem OFFSET. O lote inicial é de 500 critérios e diminui em caso de tempo excedido. Os vínculos, comentários e resultados originais são preservados.

Cada lote de critérios tem prazo de 15 segundos. O limite geral da carga passa a três minutos, com o progresso de registros exibido. Uma falha real não é convertida em sucesso com resultados parciais nem provoca nova leitura integral da view antiga.

O nome da esteira confirmado no CSV é **Out a Dez/26 (Antecipada)**. A consulta de auditoria fornecida separadamente usa esse rótulo exato. Ela é de leitura e não altera os materiais.

O relatório de comparação separa Prof. NQ, Revisor e Especialista. Nomes abreviados e e-mails não são automaticamente substituídos por nomes parecidos.

Detalhes técnicos, testes e limites em **LEIA_CARGA_CRITERIOS_V6612.md**. Guias de versões anteriores são histórico.
