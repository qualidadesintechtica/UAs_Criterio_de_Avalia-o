# V6.6.9 — filtros de Especialistas e Revisores

## O que mudou

Os filtros de pessoas passam a selecionar **materiais**, mantendo todos os critérios e comentários dos materiais encontrados. Um especialista e um revisor podem aparecer em registros diferentes do mesmo material: isso deixa de produzir um resultado vazio por não estarem na mesma linha.

Os filtros de esteira, lote, UC e UA/material continuam delimitando o recorte. Materiais de ofertas ou lotes diferentes não são reunidos para encontrar uma combinação de pessoas. Busca, cartões, menu lateral e exportações usam o mesmo conjunto filtrado.

Os nomes agora são lidos em texto, listas JSON e objetos com nome, incluindo mais de uma pessoa. A comparação ignora acentos, caixa, espaços repetidos, espaços não separáveis e caracteres invisíveis. Não transforma IDs numéricos da Monday em nomes e não adivinha abreviações ou sobrenomes.

Em **Especialistas**, as opções continuam vindo exclusivamente dos participantes cadastrados com perfil **Especialista**, conforme o SQL 12 já utilizado. Revisor e Admin não são acrescentados a essa lista. Selecionar uma pessoa cadastrada sem correspondência nos materiais consultados pode retornar zero; o cadastro do login, por si só, não atribui materiais à pessoa.

Em **Revisores**, a lista e a filtragem usam os mesmos nomes disponíveis dos revisores atribuídos e dos avaliadores dos formulários. Quando uma fonte traz várias pessoas, cada nome é reconhecido. **Não informado** identifica materiais em que não há pessoa em nenhum dos registros do recorte, sem confundir uma linha vazia com um material inteiro sem responsável.

Quando a fonte de materiais disponibiliza o especialista atribuído, esse nome também é considerado, inclusive em materiais que ainda não têm critérios. A atualização não inventa responsáveis quando a informação não está nas fontes.

## Instalar

1. Extraia o ZIP.
2. Substitua todo o conteúdo na raiz publicada de **qualidadesintechtica/UAs_Criterio_de_Avalia-o**.
3. Inclua o novo **people-filters.mjs** e os módulos atualizados. Não envie apenas o ZIP nem crie uma pasta adicional na raiz.
4. Confirme o commit, aguarde a publicação e pressione **Ctrl + F5**.
5. Confira **V6.6.9 · 21/10/2026** e clique em **Atualizar dados**.

**Não exige SQL novo nem republicar Edge Functions para esta correção dos filtros.** O SQL 12 continua necessário para a lista de especialistas cadastrados, caso ainda não tenha sido instalado. Os scripts SQL anteriores e as funções de servidor não foram alterados.

## Conferir

Escolha um especialista e um revisor vinculados ao mesmo material. O material deve permanecer na tabela mesmo se cada pessoa estiver em um registro diferente. Seus critérios, comentários e progresso devem continuar completos.

Troque entre Planilha de entrada, UA, BDQ e UC. A seleção deve permanecer e os números de cada aba devem acompanhar o recorte. Uma combinação sem correspondência deve mostrar zero. **Limpar filtros** restaura os totais da consulta.

Se o nome cadastrado for diferente de fato do nome da Monday, como uma abreviação ou um sobrenome diferente, a atualização não faz uma associação automática de identidade. Para conferir esse caso, compare o nome selecionado com o responsável de um material que deveria aparecer. Não há vínculo automático entre o ID de login do Supabase e o ID de pessoa da Monday.

## Download e comentários

Os comentários dos planos e o serviço de download da V6.6.8 foram preservados. O print mais recente mostra recusa de **animaeducacao.sharepoint.com, HTTP 401**. Essa pendência do arquivo é independente dos filtros. A função de download não tem a sessão Microsoft do navegador e não há uma integração Microsoft instalada por este pacote. É necessário conferir o link e o acesso autorizado na origem; a publicação da V6.6.9 não resolve, por si só, a autenticação do SharePoint.

Para os recursos de comentários e download, consulte **LEIA_DOWNLOAD_E_COMENTARIOS_V668.md**. Esse guia anterior continua descrevendo o serviço preservado nesta entrega.

## Verificação

Passaram **177 testes de lógica e serviço**, incluindo filtros individuais e combinados, pessoas em registros diferentes do material, nomes JSON, variações de escrita, múltiplos responsáveis, ofertas distintas, recortes vazios, limpeza, contagens, progresso e preservação de comentários e downloads.

A interação com a página foi validada em **DOM simulado** nas quatro abas, incluindo a seleção combinada de pessoas, permanência dos filtros entre abas, nomes estruturados, resultados vazios e limpeza. Não houve publicação no GitHub ou teste com a sessão real da equipe.
