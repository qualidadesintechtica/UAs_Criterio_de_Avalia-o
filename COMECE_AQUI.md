# Atualizar para V6.6.8

1. **Edge Functions:** atualize **nq-baixar-planilha**, colando todo o arquivo **INSTALAR_PELO_PAINEL/nq-baixar-planilha.ts**. Mantenha Verify JWT ativado.
2. **GitHub:** substitua todo o conteúdo na raiz publicada do repositório. Inclua **entry-plan-comments.mjs** e os arquivos atualizados. Aguarde a publicação, pressione Ctrl + F5 e confira **V6.6.8**.
3. Clique em **Atualizar dados** e abra um Plano de Produção na aba **Planilha de entrada**. Confira **Comentários da planilha de entrada**.

**Não há SQL novo.** O SQL 12 do filtro de especialistas e o SQL 11 dos links continuam iguais, caso já estejam instalados.

O erro atual da imagem vem do servidor onde está o arquivo. A nova função informa domínio e HTTP, e consulta uma vez a coluna exata da Monday quando o endereço falhar e houver MONDAY_API_TOKEN configurado. Isso não substitui a autenticação exigida pela origem. O link real precisa ser conferido para concluir a correção deste arquivo.

Leia **LEIA_DOWNLOAD_E_COMENTARIOS_V668.md** para o funcionamento, instalação e limites desta atualização.
