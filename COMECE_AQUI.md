# Publicar no GitHub Pages

## Se já publicou a versão anterior

1. No projeto Supabase do BI, abra **SQL Editor → New query**.
2. Execute o conteúdo de `supabase/03_COMENTARIOS_COM_HISTORICO.sql`. Se ainda não instalou as fontes dos quatro menus, execute antes o arquivo 02.
3. Extraia este ZIP e substitua os arquivos no repositório GitHub, mantendo `index.html` na raiz.
4. Abra a página publicada e faça login com a conta institucional já cadastrada no BI.
5. Abra **Ver pareceres** em um material. Use **Adicionar comentário** ou **Editar comentário**, salve e abra **Histórico de comentários**. Atualize a página para conferir a persistência.

O SQL 03 cria os comentários e o histórico com gravação protegida. Ele não foi executado no seu banco nesta entrega. Sem a instalação, a consulta das avaliações continua disponível, mas os botões de edição ficam desativados com uma mensagem explicativa.

## Primeira instalação

1. No Supabase, execute `supabase/01_PROTEGER_ACESSO_RESULTADOS_UAS.sql`.
2. Depois execute `supabase/02_CONECTAR_MENUS_E_PARECERES_MONDAY.sql`.
3. Execute `supabase/03_COMENTARIOS_COM_HISTORICO.sql`.
4. Extraia o ZIP e envie os arquivos e pastas para o repositório em **Add file → Upload files**.
5. Em **Settings → Pages**, selecione **Deploy from a branch → main → / (root)**.
6. Clique em **Save** e aguarde o endereço de publicação mostrado pelo GitHub.

Se um SQL apresentar erro, resolva a instalação antes de publicar. Os scripts usam transações para desfazer as alterações dessa execução em caso de erro.

## Dados e navegação

A página consulta os registros da Monday já sincronizados no Supabase. Planilha de Entrada entra no primeiro menu; Unidade de Aprendizagem em UA; Avaliações A1/A3 e Bancos de Questões em BDQ; Unidades Curriculares em UC.

Os conceitos de UC aparecem com a classificação e a pontuação originais. Os pareceres sem resposta de critério aparecem como registros textuais. Um material sem critério ou parecer sincronizado continua visível pelo registro do formulário.

O contador do menu representa os materiais encontrados nessa conexão. Um sinal **!** indica que a fonte não pôde ser consultada. Uma seção vazia informa a ausência de registros na fonte consultada.

O botão Atualizar consulta novamente o banco; as alterações feitas na Monday ficam disponíveis depois da sincronização existente. A página mostra o horário de sincronização disponível e o horário da consulta.

## Comentários e histórico

No painel **Ver pareceres**, os professores com a conta institucional já autorizada podem:

- **Adicionar comentário**: criar uma informação complementar para o material.
- **Editar comentário**: alterar o texto de um parecer ou complemento.
- **Histórico de comentários**: consultar o original e cada versão, com autor e data.

As edições são colaborativas entre essas contas. O e-mail e o identificador do autor são registrados pelo servidor. O texto original da Monday é preservado na primeira edição; alterações posteriores são acrescentadas ao histórico. Os comentários não podem ser apagados pela página. Uma edição simultânea gera um aviso e mantém seu texto no formulário para você conferir a versão mais recente.

Os comentários são salvos no Supabase e compartilhados entre os usuários do painel. **A edição no painel não altera o comentário nem a classificação na Monday.** O texto atual da fonte continua acessível separadamente. Novos comentários e edições aparecem na busca, na tabela e na exportação. O CSV identifica o autor e a versão do comentário; o histórico completo é consultado no painel.

Se os professores ainda não têm uma conta institucional no BI, o administrador deve provisionar esse acesso. A página mantém o domínio autorizado `animaeducacao.com.br`.

## Recursos

- Filtros de esteira, UC, material, revisor e especialistas.
- Cartões clicáveis por resultado e status de ajustes registrado.
- Tabela e lista de comentários por UC.
- Painel lateral com criação, edição e histórico de comentários.
- Temas claro e escuro e menu no celular.
- Exportação CSV com status, classificação, comentários e origem.

Use seu e-mail `@animaeducacao.com.br` e a senha cadastrada no BI. A página funciona no GitHub Pages sem login no ChatGPT. Nunca coloque uma chave administrativa do Supabase nos arquivos da página.

## Referências

- [Configurar GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Proteção de views no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
