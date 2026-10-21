**Atualização atual: siga LEIA_DOWNLOAD_E_COMENTARIOS_V668.md. A recusa na origem é diferente do antigo erro de função ausente.**

# Baixar a planilha de entrada — base V6.6.4, mantida na V6.6.7

**Para a instalação atual, comece por LEIA_CORRECAO_DOWNLOAD_E_ESPECIALISTAS.md.** A função nq-baixar-planilha não foi encontrada no projeto da página em 21/10/2026. A V6.6.7 acrescenta o diagnóstico dessa falha e o SQL 12 dos especialistas cadastrados.

## Ativação na página atual

São três etapas. Subir os arquivos ao GitHub sozinho não publica o serviço de download.

1. **SQL:** no SQL Editor do mesmo projeto Supabase usado pela página, execute todo o arquivo `supabase/11_LINKS_PLANILHAS_ENTRADA.sql`. O resultado deve ser **V6.6.4: fonte dos links de planilhas instalada**. Não repita os SQLs antigos já instalados.
2. **Função:** em Edge Functions, crie uma função chamada exatamente **nq-baixar-planilha**. No editor, substitua o exemplo por todo o conteúdo de `supabase/functions/nq-baixar-planilha/index.ts` e publique. Esse index.ts está completo e pode ser colado sozinho. Mantenha a verificação JWT ativada. A função existente nq-gerenciar-usuarios permanece como está.
3. **GitHub:** extraia o ZIP e substitua todo o conteúdo na raiz publicada de **qualidadesintechtica/UAs_Criterio_de_Avalia-o**. Inclua os arquivos novos e a pasta supabase, usada também pelo módulo da página. Aguarde a publicação, pressione Ctrl + F5, confira **V6.6.4 · 21/10/2026** e clique em **Atualizar dados**.

Para quem já usa a CLI vinculada ao projeto, a função também pode ser publicada a partir da pasta extraída:

```bash
supabase functions deploy nq-baixar-planilha
```

O serviço usa SUPABASE_URL e a chave pública disponibilizados no ambiente hospedado, incluindo os formatos legado e novo. Não precisa de chave administrativa. A sessão da pessoa protege a consulta no banco. A origem padrão autorizada é `https://qualidadesintechtica.github.io`. Se NQ_ORIGINS já está configurado, confira se inclui essa origem exata, sem caminho ou barra final.

## Uso

Abra **Planilha de entrada**. Cada Plano de Produção possui **Baixar planilha**, abaixo do nome e do progresso. O botão também aparece na lista de Comentários e no detalhe do plano. Clicar no nome continua abrindo os comentários.

O download usa o ID exato do item de validação, sem procurar por nome de UC ou por códigos parecidos. O servidor consulta novamente o vínculo ao receber o pedido. A página recebe o arquivo e aciona o salvamento local, sem abrir outra página. A pasta de destino e uma eventual confirmação de salvamento seguem as configurações do navegador.

O formato original é mantido quando a origem entrega Excel, ODS ou CSV. Links de edição padrão do Google Sheets recebem uma tentativa de exportação para XLSX. Links do OneDrive/SharePoint recebem o parâmetro de download, mantendo os dados de compartilhamento. Isso depende das permissões da origem; não concede acesso a arquivos protegidos.

## De onde vem o link

A fonte nova lê os valores já sincronizados em **monday_validacao_materiais.dados_colunas**, no quadro **9433297929**, somente para a categoria **Plano de Produção**. Não altera a sincronização nem os dados da Monday. Os valores precisam conter os nomes/tipos de coluna gravados pela sincronização atual do DataHub.

Por padrão, a coluna é reconhecida pelo nome **Planilha de entrada** e por variações como **Link da planilha de entrada**, **Link planilha de entrada**, **URL da planilha de entrada**, **Arquivo da planilha de entrada** e **Planilha de entrada preenchida**. Acentos, maiúsculas e pontuação não diferenciam os nomes.

É aceito o endereço da coluna Link, inclusive quando seu valor é um JSON textual, e o ID de um anexo da coluna Arquivos. Links repetidos para o mesmo arquivo são contados uma vez. Se houver dois endereços ou anexos diferentes entre as colunas selecionadas, o botão fica desativado e pede a conferência na Monday.

Se a coluna tiver outro nome ou for necessário escolher uma coluna específica, use o ID real da coluna nos dois lugares:

- No final do `config.js`, depois da atribuição já existente, acrescente `window.UA_CONFIG.entryPlanColumnIds = ['ID_REAL_DA_COLUNA'];`. Preserve o restante do arquivo.
- Em **Edge Functions → Secrets**, configure **NQ_PLANILHA_COLUMN_IDS** com esse mesmo ID. Para mais de um, separe por vírgula.

Quando IDs estão configurados, somente essas colunas são selecionadas. Não copie o texto ID_REAL_DA_COLUNA como se fosse o ID verdadeiro. É possível consultar apenas os nomes e IDs no SQL Editor, sem expor os links:

```sql
select distinct c.key as column_id,
  c.value->>'title' as column_title,
  c.value->>'type' as column_type
from public.monday_validacao_materiais v
cross join lateral jsonb_each(
  case when jsonb_typeof(v.dados_colunas)='object'
    then v.dados_colunas else '{}'::jsonb end
) c
where v.monday_board_id=9433297929
  and v.tipo_material='Plano de Produção'
  and c.value->>'type' in ('link','file')
order by column_title,column_id;
```

## Arquivos e acesso da origem

Para **anexos hospedados na Monday**, o serviço obtém uma URL atual pelo ID do anexo a cada clique. Isso exige **MONDAY_API_TOKEN** no ambiente da função, com acesso de leitura ao arquivo. Se esse segredo já existe no projeto para a sincronização, ele é reutilizado. Nenhum token da Monday vai para o GitHub, config.js ou navegador.

Os domínios previstos incluem Google Drive/Sheets e seus endpoints de arquivo, OneDrive/SharePoint e os endpoints conhecidos de arquivos da Monday. Para outro domínio de arquivos aprovado pela equipe, configure **NQ_PLANILHAS_HOSTS** com o hostname exato, por exemplo `arquivos.exemplo.com.br`. Use apenas um servidor público confiável, sem esquema, caminho ou curingas; vários hosts são separados por vírgula. Redirecionamentos também precisam passar pela lista autorizada. Endereços locais, literais de IP, HTTP e URLs com usuário/senha não são aceitos.

Se o arquivo exige uma sessão adicional da Microsoft ou Google, o serviço não recebe os cookies do navegador. Ele pode retornar uma mensagem de acesso ou visualização. **Não torne o arquivo público para contornar isso.** Esse caso requer uma integração autorizada com o provedor ou um endpoint de download permitido pelas regras da equipe. Esta versão não implementa OAuth de Microsoft/Google.

O limite é de **20 MB por arquivo**, com tempo de download limitado. O serviço não salva cópias no banco. Não aceita URL enviada livremente pelo navegador e não encaminha a sessão Supabase nem o token Monday ao servidor do arquivo. Uma página de login ou visualização não é salva como se fosse uma planilha.

## Mensagens

| Mensagem | Conferência |
| --- | --- |
| Download ainda não configurado | Execute SQL 11, publique nq-baixar-planilha e atualize os dados. |
| Publique a função nq-baixar-planilha | O nome/publicação da Edge Function está faltando. |
| Link da planilha não informado na sincronização | Confira a coluna na Monday, seu nome/ID e a sincronização. |
| Mais de uma planilha vinculada | Confira os arquivos e selecione o ID da coluna desejada nos dois ambientes. |
| Sem vínculo com um item de validação | O formulário não foi ligado a um Plano de Produção exato. |
| O domínio do arquivo precisa ser autorizado | Confira o host real do arquivo e seus redirecionamentos. |
| A origem retornou uma página de acesso ou visualização | A origem exige autenticação ou não ofereceu um arquivo baixável. |
| O vínculo da planilha mudou | Atualize os dados e tente novamente. |
| MONDAY_API_TOKEN | O link é um anexo da Monday e precisa do token no ambiente do servidor. |

## O que foi preservado e testado

SQL 01 a 10, função de usuários, configuração pública, SDK, regras de contagem e de vínculo, permissões, filtros entre abas, status, barras das quatro abas, participantes, comentários e histórico foram preservados. A fonte de links é independente: uma falha nela não troca os totais nem bloqueia as outras fontes.

Passaram **141 testes de lógica e serviço**, **15 verificações do SQL 11 em PostgreSQL embarcado** e a regressão completa do aplicativo em DOM simulado. A função completa que será publicada foi exercitada nos testes, incluindo autenticação, autorização, vínculo exato, alteração de vínculo, URL não permitida, redirecionamentos, tamanho, HTML indevido e renovação de anexo Monday. A interface foi inspecionada no navegador com fontes e arquivos fictícios, incluindo a ação de salvar e a mensagem de acesso bloqueado. A ferramenta do navegador não confirmou um evento de arquivo salvo no disco; a verificação observou a ação de download disparada e a página mantida aberta.

Nenhum link real de planilha foi fornecido para validar sua disponibilidade. Não houve execução de SQL, publicação da função ou do site em produção. A instalação e o primeiro teste com uma planilha real ainda precisam ser realizados após a atualização.
