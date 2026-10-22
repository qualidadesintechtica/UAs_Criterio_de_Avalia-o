# V6.6.11 — corrigir a consulta dos filtros

1. **SQL Editor do Supabase:** execute todo **supabase/14_RESPONSAVEIS_PAGINADOS.sql** no projeto **nkjmgzyjjbepebzurowy**. O resultado deve começar com **V6.6.11: responsáveis paginados e permissões instalados**. Não é necessário repetir o SQL 13.
2. **GitHub:** substitua todo o conteúdo extraído na raiz publicada do repositório. Inclua o novo **monday-people-loading.mjs**, além de **app.mjs**, **index.html** e os demais arquivos atualizados.
3. Aguarde a publicação, pressione **Ctrl + F5**, confira **V6.6.11** e clique em **Atualizar dados**.

Não precisa republicar Edge Functions nesta atualização. Não reaplique SQLs anteriores.

A tabela mostra **Revisor na Monday** e **Especialista na Monday** nas quatro abas. Os filtros consultam os mesmos nomes. Especialistas continua limitado aos participantes cadastrados com esse perfil.

Para SharePoint e OneDrive, o botão solicita o download à Microsoft pelo navegador. Pode ser necessário entrar na conta institucional que possui acesso à planilha. O salvamento real precisa ser conferido na pasta de downloads.

Se a fonte dos responsáveis ainda falhar, a mensagem exibirá o **código real**, como 57014 (tempo), 42501 (permissão) ou PGRST202 (função não localizada). Envie a mensagem completa para identificar a falha, sem precisar abrir o console do navegador.

Detalhes e verificações: **LEIA_FILTROS_V6611.md**. Os guias de versões anteriores ficam como histórico.
