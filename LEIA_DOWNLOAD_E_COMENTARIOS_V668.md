# V6.6.8 — comentários dos planos e recusa do download na origem

## O erro atual

A imagem enviada mostra **A origem não autorizou o download. Confira o link e suas permissões.** Essa mensagem é emitida depois de a função validar o acesso ao painel e tentar buscar o arquivo. Portanto, a situação atual é diferente do 404 de função ausente observado anteriormente: o servidor do arquivo retornou uma resposta HTTP sem sucesso.

A mensagem antiga não distinguia 401/403, arquivo ausente, link expirado, limite de requisições ou indisponibilidade do servidor. Sem o endereço real e a resposta desse servidor, não é possível afirmar qual dessas situações ocorreu neste arquivo.

## Atualizar o download

1. No projeto Supabase da página (**nkjmgzyjjbepebzurowy**), abra **Edge Functions → nq-baixar-planilha**.
2. Abra o arquivo **INSTALAR_PELO_PAINEL/nq-baixar-planilha.ts** no Bloco de Notas e copie **todo o conteúdo**.
3. Substitua o código da função por esse conteúdo e publique novamente. Mantenha **Verify JWT ativado**.
4. Atualize os arquivos da página no GitHub conforme a próxima seção.

**Esse `.ts` é código de Edge Function; não deve ser executado no SQL Editor.** O arquivo contém todas as dependências locais incorporadas. A versão modular equivalente está em `supabase/functions/nq-baixar-planilha/`.

Agora o erro informa o **domínio e o HTTP** devolvido pelo servidor do arquivo. Não revela caminhos, parâmetros de compartilhamento, tokens nem credenciais na mensagem.

| Resposta da origem | Orientação exibida |
| --- | --- |
| 401 / 403 | A origem recusou a solicitação; o arquivo pode exigir login ou um link autorizado. |
| 404 / 410 | O arquivo não foi encontrado; o endereço pode ter expirado ou o arquivo ter sido movido. |
| 429 | A origem limitou os downloads; aguarde e tente novamente. |
| Outros códigos | Confira a disponibilidade no domínio informado. |

Se **MONDAY_API_TOKEN** já estiver configurado no Supabase e a origem devolver 401, 403, 404 ou 410, a função consulta uma vez a coluna exata do item da Monday. Se a coluna apontar para um arquivo diferente do sincronizado, tenta obter o endereço atualizado. Não procura outro arquivo pelo nome nem escolhe outro plano. O item também precisa continuar no quadro de validação **9433297929**.

O token precisa ter leitura dos itens e arquivos utilizados. As consultas e os downloads mantêm a lista de domínios autorizados, o limite de 20 MB e a proteção por sessão. URLs novas e seus redirecionamentos passam pelas mesmas verificações. Nenhuma chave administrativa é adicionada à página.

Essa atualização pode resolver um endereço desatualizado. **Ela não concede acesso a um arquivo que exige uma sessão de outro provedor.** O serviço não recebe os cookies de login de Microsoft, Google ou outros sites. Não há uma integração Microsoft/Google instalada por esse pacote. Nesse caso, é necessário conferir o link exato e o acesso autorizado na origem antes de definir a solução.

Para concluir a verificação do arquivo da imagem, forneça o **link exato da coluna Planilha de entrada na Monday**, sem senhas ou códigos de autenticação. Apenas o print não permite testar a resposta da origem.

## Comentários da planilha no Plano de Produção

Ao abrir um Plano de Produção na aba **Planilha de entrada**, aparece a seção **Comentários da planilha de entrada**, com autor, data, critério e origem.

Ela reúne os textos disponíveis nas fontes já consultadas pela página:

- pareceres dos critérios sincronizados;
- pareceres dos formulários de Planilha de Entrada / Plano de Produção, incluindo envios anteriores;
- comentários complementares e edições registradas na própria página;
- textos originais da Monday e comentários das classificações anteriores ainda presentes nas fontes sincronizadas.

Os pareceres de formulários diferentes deixam de ser reduzidos a uma única linha por critério. Dois registros com IDs diferentes continuam sendo dois comentários, mesmo quando os textos coincidem. Uma repetição da mesma fonte por duplicação de consulta não é contada novamente. Um comentário antigo não vira uma nova resposta de critério e não aumenta a barra de progresso.

A busca e **Somente com comentários** também encontram comentários das versões anteriores da Monday que estejam disponíveis. Os totais continuam contando materiais uma vez. A seção **Critérios, fontes e edição dos comentários** preserva a classificação, os controles de edição e o histórico de cada registro. O botão **Adicionar comentário** abre essa área para a gravação.

**Somente vínculos inequívocos são reunidos ao plano.** Quando há mais de um plano possível para a mesma UC/oferta, o registro sem vínculo continua separado na tabela. Os critérios de vínculo entre as fontes não foram ampliados para nomes parecidos.

O pacote não lê anotações dentro do Excel, conversas privadas ou atualizações da Monday que não tenham sido sincronizadas para as fontes utilizadas. Não recupera comentários excluídos ou um histórico que não existe nessas fontes. As versões de edições do painel continuam disponíveis em **Consultar histórico de edições**.

## Atualizar a página

1. Extraia o ZIP.
2. Envie **todo o conteúdo extraído** à raiz publicada de **qualidadesintechtica/UAs_Criterio_de_Avalia-o**. Não envie apenas o ZIP nem coloque os arquivos em uma pasta adicional.
3. Inclua o novo módulo **entry-plan-comments.mjs** e os arquivos atualizados da função de download.
4. Confirme o commit, aguarde a publicação e pressione **Ctrl + F5**.
5. Confira **V6.6.8 · 21/10/2026**. Clique em **Atualizar dados** e abra um Plano de Produção.

**Não há SQL novo nesta versão.** O filtro de especialistas cadastrados continua usando o SQL 12, e os links de planilha continuam usando o SQL 11. Só instale esses arquivos se ainda estiverem faltando. Não repita os SQLs antigos por causa desta atualização.

## Verificação

Passaram **168 testes de lógica e serviço**, incluindo preservação dos envios anteriores, vínculo ambíguo, comentários iguais com IDs diferentes, busca em comentários antigos, edições do painel, contagem por material, progresso, diagnóstico de recusas da origem e atualização do endereço pela coluna exata da Monday.

Quatro cenários de interface em **DOM simulado** passaram: comentários e busca no plano, mensagem de recusa HTTP 403, mudança de perfil e ausência da consulta de especialistas. Não foi realizada conferência visual em navegador real neste ambiente.

Não houve publicação no Supabase ou GitHub. A disponibilidade de uma planilha real da equipe ainda não foi validada; o link do arquivo da imagem não foi fornecido.

Documentação de referência: [consulta de colunas da Monday](https://developer.monday.com/api-reference/reference/column-values-v2), [arquivos da Monday](https://developer.monday.com/api-reference/reference/assets-1) e [download autorizado pelo Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content?view=graph-rest-1.0).
