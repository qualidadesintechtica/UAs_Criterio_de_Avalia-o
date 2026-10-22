# Correção NQ_PEOPLE_CURSOR — V6.6.11

O erro da imagem foi reproduzido com a mesma função SQL e o mesmo leitor JavaScript entregues na V6.6.11. Não se tratava de falha de login ou tempo de consulta: o SQL calculava incorretamente o próximo item da paginação.

Os registros da página estavam ordenados numericamente. Na subconsulta que calculava `proximo_item`, a expressão `item_id::text` conservava o nome `item_id`. O `ORDER BY item_id` resolvia esse nome como a saída textual da subconsulta. Isso selecionava um cursor diferente do último registro quando os IDs tinham quantidades diferentes de algarismos. Por exemplo, a página terminava em 10478, mas o cursor devolvido era 9999. O leitor rejeitava essa divergência com NQ_PEOPLE_CURSOR.

O SQL 15 qualifica explicitamente a coluna numérica de origem (`p.item_id`) na ordenação. A conversão para texto permanece somente na saída para evitar perda de precisão de IDs bigint no navegador. A mesma correção foi aplicada ao marcador do board.

## Aplicar na V6.6.11 já publicada

1. Abra o SQL Editor do mesmo projeto Supabase do site.
2. Execute inteiro `15_CORRIGIR_CURSOR_RESPONSAVEIS.sql`.
3. Confira a mensagem **Cursor de responsáveis corrigido. Volte ao site e clique em Atualizar dados.**
4. Volte ao site e clique em **Atualizar dados**.

Não é necessário atualizar o GitHub nem repetir o SQL 14. A função mantém o contrato, os índices, as permissões institucionais e a paginação existentes. Nenhum material, comentário ou perfil é alterado. O SQL 15 pode ser executado novamente.

Para instalações novas, o SQL 14 deste pacote já inclui a correção. Os demais arquivos do site são iguais aos da V6.6.11.

## Validação

O teste primeiro reproduziu o erro com o SQL anterior. Em seguida instalou o SQL 15 e passou a mesma resposta pelo leitor JavaScript, mantendo todas as verificações de avanço do cursor. Foram conferidas páginas com IDs de comprimentos diferentes, mudança de board, materiais sem responsáveis, múltiplas atribuições e IDs bigint. A comparação verificou ausência de perda e duplicação de materiais, além de seleção combinada de revisor e especialista com o resultado real da função.

A correção foi testada localmente em PostgreSQL. Ainda é necessário executá-la no Supabase publicado para confirmar o resultado com a base institucional.
