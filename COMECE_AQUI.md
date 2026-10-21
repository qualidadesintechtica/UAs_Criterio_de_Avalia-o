# Atualizar para V6.6.7 — download e especialistas cadastrados

1. **Edge Functions:** publique **nq-baixar-planilha** no projeto Supabase **nkjmgzyjjbepebzurowy**, colando todo o conteúdo de **INSTALAR_PELO_PAINEL/nq-baixar-planilha.ts**. Mantenha Verify JWT ativado. A função não foi encontrada nesse projeto na conferência de 21/10/2026.
2. **SQL Editor:** execute todo **supabase/12_FILTRO_ESPECIALISTAS_CADASTRADOS.sql**. Esse é o novo SQL para o filtro. O SQL 11 só precisa ser instalado se ainda faltar a fonte dos links.
3. **GitHub:** envie todo o conteúdo extraído à raiz do repositório publicado, confirme o commit e aguarde. Pressione **Ctrl + F5**, confira **V6.6.7** e clique em **Atualizar dados**.

Passo a passo: **LEIA_CORRECAO_DOWNLOAD_E_ESPECIALISTAS.md**.

Especialistas agora vêm dos participantes cadastrados com esse perfil, sem recorrer aos nomes de autores da Monday. Revisor e Admin ficam fora da lista. Menu, cartões, totais e exportações mantêm os mesmos filtros da tabela.

## Conferir os números depois de atualizar

Os ajustes anteriores de contagens foram preservados. Para a V6.6.7, execute o SQL 12 e publique a função de download conforme o guia novo. Ela separa a quantidade de materiais dos registros de critérios e comentários.

Acima dos filtros, confira **Total no recorte**, a soma dos quatro cartões com **Outros status** e a opção **Conferir totais por status Monday**. O botão Outros status mostra os materiais que não pertencem aos quatro cartões, incluindo A liberar, N/A e Pausado. Os filtros continuam funcionando em todas as abas.

Use **Exportar materiais desta conferência (CSV)** para comparar uma linha por material com a Monday. Na Planilha de entrada, a coluna de ID corresponde ao item exato de validação. Menu lateral, cartões, total, conferência e os dois CSVs consideram os mesmos filtros, a busca, Somente com comentários e o status selecionado. Ao selecionar um cartão, as outras categorias de status ficam zeradas nesse recorte; clique novamente no cartão ou em Limpar filtros para voltar.

Formulários sem vínculo continuam acessíveis para consulta e edição; ficam fora dos totais de planilhas. O menu lateral aplica a seleção atual a cada uma das quatro abas e recalcula seus números imediatamente. A seleção permanece ao trocar de aba. Na UC, as linhas de unidades podem ser mais numerosas que as UCs contadas.

Veja **LEIA_CONTAGENS_COM_FILTROS.md** e **LEIA_CONFERENCIA_CONTAGENS.md**. Os passos de instalação anteriores, abaixo, só são necessários se o respectivo recurso ainda não estiver instalado.

## 2. Ativar Baixar planilha, se ainda não estiver instalado

1. No SQL Editor do mesmo projeto Supabase da página, execute **todo** `supabase/11_LINKS_PLANILHAS_ENTRADA.sql`.
2. Em Edge Functions, crie/publique **nq-baixar-planilha**, colando o conteúdo completo de `supabase/functions/nq-baixar-planilha/index.ts`. Esse arquivo funciona sozinho no editor. Mantenha JWT ativado.
3. Depois da atualização da página, clique em **Atualizar dados** e abra **Planilha de entrada**. Use **Baixar planilha**, abaixo do nome do plano. Clicar no nome continua abrindo os comentários.

A coluna Planilha de entrada é reconhecida pelo nome ou pelo ID configurado. Links ausentes ou ambíguos ficam sinalizados. Arquivos que exigem login adicional na origem podem precisar de integração autorizada; não são salvos como páginas de login. O passo a passo, nomes alternativos de coluna e as mensagens estão em **LEIA_DOWNLOAD_PLANILHAS.md**.

## 3. Ver o progresso de cada material

As abas **Planilha de entrada, UA, BDQ e UC** mostram uma barra abaixo do nome de cada material, na tabela, na lista de Comentários e no detalhe. Na tabela da UC, cada unidade tem seu próprio percentual de indicadores respondidos. As colunas existentes foram mantidas.

Sem critérios sincronizados, aparece uma barra cinza com **—**, sem inventar 0% ou 100%. O percentual mede preenchimento dos critérios disponíveis, considerando o recorte atual. Comentários complementares não contam como respostas.

O aviso da imagem indica **nome da UC pendente**, com a consulta concluída. Nesta versão, expanda **Ver registros** para conferir a referência, os IDs e **Ver detalhes**. O diagnóstico distingue planilhas do quadro e formulários sem vínculo. Nomes são recuperados por vínculo exato quando disponíveis; nomes ausentes ou ambíguos ainda precisam ser corrigidos na origem sincronizada. Consulte **LEIA_PROGRESSO_TODAS_ABAS_E_NOMES.md**.

**O download exige SQL 11 e a nova função.** Os scripts 01 a 10 e a função de usuários existentes foram mantidos; não repita uma instalação que já funciona.

## 4. Abrir Participantes

Use **Participantes**, no menu lateral ou junto de **Atualizar dados**, no cabeçalho. A área permite criar login, editar nome/perfil e trocar a senha temporária quando a conta tem autorização no servidor.

Se aparecer **gestão ainda não instalada**, execute todo o arquivo **supabase/09_USUARIOS_E_ACESSOS.sql** no projeto Supabase da página e publique a função **nq-gerenciar-usuarios**, usando todo o arquivo **supabase/functions/nq-gerenciar-usuarios/index.ts**. Mantenha JWT ativado. Depois, volte a Participantes e clique em **Atualizar**.

**SQL 10 não substitui o SQL 09 nem publica a função de usuários.** O GitHub publica a interface; a criação e a troca de senhas dependem do servidor configurado.

A gestão permanece restrita a **ligia.neta@animaeducacao.com.br**, **joao.cane@animaeducacao.com.br** e **cristina.brito@animaeducacao.com.br**, com e-mail confirmado e perfil Admin. Outras contas veem a explicação da restrição e não conseguem listar ou alterar participantes.

Leia **LEIA_PARTICIPANTES_E_PROGRESSO_UA.md** para os passos completos. Se a gestão já está instalada e disponível, não repita os scripts.

## O que permanece

SQL 01 a 10, correção de leitura de critérios, função de gestão de usuários, autenticação, perfis, troca obrigatória de senha, fontes da Monday, filtros, contagens, status, leitura UA/UC, BDQ A1/A2/A3, comentários e versões, CSV e temas foram mantidos.

A V6.6.6 passou **151 testes de lógica e serviço**, a regressão das quatro abas e 24 combinações de aba/filtro e a conferência visual em navegador com dados de teste. SQLs e funções foram preservados; as 15 verificações anteriores do SQL 11 continuam documentadas. As 131 verificações anteriores do controlador de acessos continuam documentadas; esse controlador foi preservado. O código está pronto para atualização; não foi publicado automaticamente no GitHub ou no banco real.
