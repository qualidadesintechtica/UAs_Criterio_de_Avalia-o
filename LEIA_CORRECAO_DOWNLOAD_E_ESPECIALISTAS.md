# Atualização V6.6.7 — download e especialistas cadastrados

## O que causou o erro de download

Em 21/10/2026, o endereço configurado na página respondeu `404`, código `NOT_FOUND`, tanto para OPTIONS quanto para POST: a Edge Function **nq-baixar-planilha** não foi encontrada no projeto **nkjmgzyjjbepebzurowy**. A página publicada foi conferida e utiliza esse mesmo projeto. Quando o preflight OPTIONS falha, o navegador pode mostrar apenas **Failed to fetch**, sem entregar ao JavaScript o corpo do 404.

Atualizar somente os arquivos do GitHub não instala a função de download no Supabase. O arquivo de servidor completo está neste pacote. A nova página também tenta identificar a ausência do serviço por uma consulta GET sem sessão, e mostra uma orientação em português. Uma falha geral de rede continua sendo indicada como falha de comunicação, sem ser confundida com função ausente.

## 1. Publicar a Edge Function de download

1. Entre no **mesmo projeto Supabase da página**, referência **nkjmgzyjjbepebzurowy**.
2. Abra **Edge Functions → Deploy a new function → Via Editor**.
3. Use o nome exato **nq-baixar-planilha**. Se já houver uma função com esse nome neste projeto, abra-a para atualizar.
4. Abra no Bloco de Notas o arquivo **INSTALAR_PELO_PAINEL/nq-baixar-planilha.ts**, selecione tudo e copie. Ele contém a função completa; funciona sozinho no editor.
5. Substitua todo o exemplo do editor por esse conteúdo e clique em **Deploy function**. Aguarde a confirmação.
6. Mantenha **Verify JWT ativado** nessa função. Além dessa verificação, o código valida a sessão, o domínio institucional, a liberação de acesso e o item exato antes de buscar o arquivo.

**Esse arquivo `.ts` é uma Edge Function. Não deve ser colado no SQL Editor.** O mesmo código também está em `supabase/functions/nq-baixar-planilha/index.ts`.

Se a origem da página continua no GitHub Pages, não é necessário criar um segredo de origem: o padrão já aceita `https://qualidadesintechtica.github.io`. Se houver um segredo **NQ_ORIGINS** configurado, ele precisa incluir essa origem exata. Não coloque o caminho do repositório no valor. Domínios adicionais podem ser separados por vírgula.

O SQL 11, dos links de planilha, não mudou. Execute `supabase/11_LINKS_PLANILHAS_ENTRADA.sql` somente se ainda não tiver sido instalado. Para anexos hospedados na Monday, a função precisa do **MONDAY_API_TOKEN** no ambiente do Supabase. As regras de links, redirecionamentos, arquivos com login adicional e limite de 20 MB permanecem em **LEIA_DOWNLOAD_PLANILHAS.md**.

## 2. Instalar o filtro de especialistas cadastrados

No **SQL Editor**, execute todo o arquivo:

`supabase/12_FILTRO_ESPECIALISTAS_CADASTRADOS.sql`

O resultado deve ser **V6.6.7: filtro de especialistas cadastrados instalado**. Esse arquivo cria somente uma consulta protegida de nomes. Não altera perfis existentes, avaliações, comentários ou totais. Depende do SQL 09 de usuários e acessos, já utilizado em Participantes; se ele faltar, a instalação informa isso e não prossegue.

O filtro **Especialistas** passa a listar somente os nomes das contas institucionais cadastradas no perfil **Especialista**, conforme a tabela privada de perfis utilizada por Participantes. Revisor e Admin não entram. Nomes presentes somente nas avaliações da Monday não entram. Nenhum e-mail, senha ou dado administrativo é exposto pela nova consulta. Não há a opção genérica Não informado nesse filtro.

A lista inclui especialistas ainda sem respostas. Selecioná-los pode retornar zero materiais. O filtro compara o nome cadastrado ao nome da avaliação, ignorando acentos, caixa e espaços repetidos; não adivinha abreviações ou identidades. Caso os nomes sejam diferentes de fato, alinhe o cadastro e a origem correta. Isso não muda os nomes ou a autoria dos registros históricos.

Após criar uma conta ou salvar nome/perfil em **Participantes**, a lista é consultada novamente. **Atualizar dados** também atualiza a lista. Alterações feitas por outra pessoa aparecem na próxima atualização. Se não houver nenhum especialista, a página informa isso. Se a consulta não estiver instalada ou falhar, o filtro fica desativado, sem recorrer à lista antiga da Monday; os demais filtros continuam disponíveis.

## 3. Atualizar a página e conferir

1. Extraia o ZIP e envie **todo o conteúdo extraído** à raiz publicada de **qualidadesintechtica/UAs_Criterio_de_Avalia-o**. Não envie apenas o ZIP e não crie uma pasta adicional.
2. Inclua os novos arquivos `specialist-directory.mjs`, `supabase/12_FILTRO_ESPECIALISTAS_CADASTRADOS.sql` e a pasta `supabase/functions`, já usada pelos módulos do navegador.
3. Confirme o commit, aguarde a publicação, pressione **Ctrl + F5** e confira **V6.6.7 · 21/10/2026**.
4. Clique em **Atualizar dados**. Em Especialistas, confira a lista com os perfis de Participantes. Alterar uma conta para Revisor deve retirá-la do filtro.
5. Em **Planilha de entrada**, clique em **Baixar planilha** em um plano com link. Confira se o arquivo foi baixado e pode ser aberto.

Se houver uma mensagem diferente após publicar a função, use o texto completo para conferir a origem: link protegido, domínio do arquivo, SQL dos links, vínculo alterado ou token Monday ausente. A instalação da função elimina a causa 404 observada; a disponibilidade de cada arquivo depende da sua origem.

## Verificação desta entrega

Passaram 157 testes de lógica e serviço, além de quatro cenários da interface em DOM simulado. Esses testes exercitam a identificação do 404, a preservação dos erros de conexão, download de arquivo de teste, vínculo e autorização do download, consulta paginada dos nomes, troca de perfil e os filtros existentes. O SQL 12 foi executado em PostgreSQL de teste, incluindo consulta por conta comum autenticada, bloqueio de acesso anônimo e temporário, exclusão de perfis Revisor/Admin, dados pessoais reduzidos e reinstalação.

Não foi possível executar a conferência em navegador real neste ambiente. Não houve publicação no Supabase ou GitHub nem teste com uma planilha real da equipe nesta sessão. A ativação em produção exige as três etapas acima.

Referências técnicas: [CORS em Edge Functions](https://supabase.com/docs/guides/functions/cors) e [autenticação das funções](https://supabase.com/docs/guides/functions/auth).
