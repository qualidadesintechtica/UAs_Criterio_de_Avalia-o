# Acompanhamento da Qualidade — V6.6.12

Siga **COMECE_AQUI.md** para aplicar esta atualização.

A versão acrescenta leitura de critérios por cursor, usando a chave única monday_item_id confirmada no diagnóstico do Supabase. A página lê até 500 critérios por chamada, preserva os vínculos e mostra o avanço da carga. Exige **supabase/16_CRITERIOS_POR_CURSOR.sql** e a publicação dos módulos atualizados.

As correções dos responsáveis da Monday e do cursor do SQL 15 permanecem incluídas. A autenticação, os perfis, os comentários, o histórico e o download Microsoft continuam no fluxo existente.

O relatório com nomes e o SQL de auditoria da referência são entregues separadamente e não fazem parte dos arquivos a publicar no GitHub.
