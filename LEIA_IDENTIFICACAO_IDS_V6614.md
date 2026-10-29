# V6.6.14 — Conferência de IDs dos formulários

A tarja de Nome da UC pendente agora apresenta uma sugestão de ID correto **somente** quando:
- O formulário de Plano de Produção está sem vínculo;
- O identificador termina em `_AA_PP`, com ano de dois dígitos;
- Há **um único** Plano de Produção na base oficial com o mesmo código, variando apenas o ano.

A sugestão é uma **hipótese para conferência humana**, não uma correção automática. O usuário confere a UC e a oferta, corrige manualmente o nome do item no quadro Monday e aguarda a sincronização normal. Se houver mais de uma possibilidade ou nenhuma, a página informa que a conferência na Monday é necessária.

**Não há escrita na Monday, nem alteração no Supabase, nem substituição de comentários.** Os avisos continuam visíveis enquanto os registros estiverem sem vínculo.

Para publicar: substitua os arquivos do repositório pelos deste pacote, mantendo `config.js` e as configurações institucionais existentes. Não é necessário executar SQL.
