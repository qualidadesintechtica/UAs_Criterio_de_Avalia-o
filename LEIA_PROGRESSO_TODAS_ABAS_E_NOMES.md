# Progresso em todas as abas e nome da UC — V6.6.3

## Atualizar a página

Extraia o ZIP e substitua todo o conteúdo na raiz publicada do repositório **qualidadesintechtica/UAs_Criterio_de_Avalia-o**. Inclua `app.mjs`, `specialist-progress.mjs`, `pe-names.mjs`, `access.css`, `index.html` e os demais arquivos da pasta. Aguarde o GitHub Pages e confira **V6.6.4 · 21/10/2026** após Ctrl + F5.

As barras não exigem SQL novo. SQL 01 a 10, configuração, SDK e função de gestão de usuários foram preservados. Se a instalação anterior está funcionando, não repita esses scripts. Para o download da V6.6.4, acrescente o SQL 11 e a função nq-baixar-planilha conforme LEIA_DOWNLOAD_PLANILHAS.md. Participantes continua no menu lateral e no cabeçalho, com as mesmas permissões e operações. Consulte COMECE_AQUI.md se essa instalação ainda estiver pendente.

## Onde aparece a barra

| Aba | Cálculo apresentado |
| --- | --- |
| Planilha de entrada | Respostas dos critérios disponíveis da planilha |
| UA | Respostas dos especialistas da respectiva UA |
| BDQ | Respostas dos critérios disponíveis do banco A1, A2 ou A3 |
| UC | Indicadores respondidos da unidade na tabela e no detalhe por unidade; conjunto da UC na lista e na visão completa |

A barra fica abaixo do nome na tabela e na lista de Comentários. Também aparece no detalhe aberto. Os filtros e a busca continuam produzindo o recorte atual. Na tabela da UC, abrir uma unidade usa somente seus indicadores, conforme a mesma seleção do painel de leitura.

O percentual é **respondidos ÷ critérios disponíveis**, arredondado. Respostas negativas e Não se aplica também contam como preenchimento. Pendências não contam como respostas. Comentários complementares, edições de texto, metadados e materiais de inventário não aumentam o progresso.

Sem critérios sincronizados, a barra é cinza, mostra **—** e **Sem critérios sincronizados**. Isso não significa 0% ou 100%. Não existe uma quantidade esperada inventada fora da base. Os quatro status dos materiais continuam independentes da barra.

## O aviso da imagem

A imagem enviada mostra **Monday · base sincronizada** e um aviso de **nome da UC não localizado**. O aviso não é uma falha de carregamento. A mensagem anterior podia contar um formulário sem vínculo como uma planilha com nome ausente.

Nesta versão, o aviso fica somente na aba Planilha de entrada. Ele discrimina **planilhas** e **formulários sem vínculo**. Clique em **Ver registros** para consultar a referência original, o motivo e os IDs disponíveis da UC, do material, do item de validação e do formulário Monday. **Ver detalhes** abre o registro correspondente com os comentários, mesmo se um filtro atual não o mostrar na tabela.

A busca de nomes aproveita o ID exato do item de validação ou a chave exata do material, além do catálogo de códigos já utilizado. Só é aceito um nome inequívoco. Nomes conflitantes não são escolhidos arbitrariamente. A mudança atualiza rótulos; não troca chaves de materiais, vínculos de avaliações, comentários, histórico ou status.

Se o nome continuar pendente, use as referências exibidas para conferir o título e o vínculo na Monday e na sincronização existente. Depois clique em **Atualizar dados**. Um formulário sem vínculo exige associação inequívoca na origem para entrar nos totais do quadro. A página mantém o registro acessível, sem atribuir um vínculo por semelhança.

Não houve consulta autenticada ao registro real nem alteração da origem nesta preparação. Portanto, esta entrega não confirma que um título ausente foi corrigido na base de produção.

## Verificação

Passaram **127 testes de lógica**. A regressão do aplicativo conferiu barras nas quatro abas em tabela, lista e detalhe; percentuais por unidade de UC; nomes por ID exato; conflito de nomes; diagnóstico de formulário sem vínculo; abertura do registro; filtros; contagens; leitor UA/UC; comentários e histórico. Também preservou o último carregamento completo quando uma página posterior de critérios falhou.

A inspeção no navegador usou dados de teste: PE 50%, UAs 75% e 50%, BDQ 67%, UC por unidade 29% e 71%, além de materiais sem critérios com barra cinza. As contagens do conjunto de regressão anterior foram mantidas. Não houve publicação automática, alteração de contas reais ou execução de SQL em produção.
