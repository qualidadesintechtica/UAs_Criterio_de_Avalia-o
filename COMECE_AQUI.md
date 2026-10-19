# Publicar a V6.5 — leitura de UA e UC

## 1. Substituir os arquivos da página

Se a V6.4 já está instalada com o SQL 08, **não é necessário executar SQL nesta atualização**.

1. Extraia o ZIP.
2. Envie **todo o conteúdo extraído** para a raiz publicada da página no GitHub, substituindo os arquivos anteriores.
3. Inclua o novo arquivo **review-panel.css** junto de index.html, styles.css, módulos e demais pastas. Não envie apenas o ZIP fechado.
4. Aguarde a publicação e pressione Ctrl + F5.
5. Confira **V6.5 · 19/10/2026** na página.

## 2. Usar o novo painel

1. Na aba UA ou UC, clique no material como antes.
2. O painel mostra um critério por vez. Clique em outro critério no menu lateral ou use **Anterior** e **Próximo**.
3. Use **Buscar neste material** para localizar um critério ou um texto de comentário no menu.
4. Abra **Dados do material** quando precisar consultar esteira, lote, matriz, especialistas, revisores ou status original.
5. Use **Editar comentário / Adicionar informação** no critério aberto. **Adicionar comentário** cria um complemento vinculado ao registro selecionado.
6. Salve ou cancele a edição antes de trocar de critério. Após salvar, o painel permanece no registro salvo.
7. Abra **Histórico de comentários** para consultar versões anteriores. O texto original da Monday é preservado.

Em telas menores, use **Ir para critério**. O seletor substitui o menu lateral. Textos longos e históricos podem exigir rolagem na área de leitura, mas os controles de navegação permanecem visíveis.

Na UC, o clique em uma unidade continua mostrando seus indicadores. **Ver todos os registros da UC** abre o conjunto completo.

## 3. O que permanece funcionando

- Filtros compartilhados, busca geral, cartões, paginação e CSV.
- Edição de comentários, autoria, datas, versões e histórico.
- Ajustes - MODELAGEM / Modelagens em Requer análise do design.
- Coluna Esteira na Planilha de entrada.
- BDQ com A1, A2 e A3, Gestor e Revisor.
- Login @animaeducacao.com.br / @ulife.com.br e temas escuro/off-white.

Planilha de entrada e BDQ mantêm sua apresentação anterior. Esta atualização não altera as consultas, a sincronização da Monday ou as tabelas do banco.

## Se a base ainda não recebeu a V6.4

Os scripts anteriores estão incluídos para quem ainda precisa instalá-los:

- SQL 08 já instalado: não execute scripts para a V6.5.
- Somente SQL 07 instalado: execute **todo o conteúdo** de `supabase/08_GESTOR_DOS_MATERIAIS.sql` no SQL Editor do Supabase. A mensagem de sucesso continua dizendo V6.4, que é a versão dessa migração.
- SQL 07 ainda não instalado: instale o 07 antes do 08.
- Instalação nova sobre as fontes do BI: 05 → 07 → 08.

Não execute scripts antigos depois do 08. Não selecione apenas um trecho do SQL; copie e execute o arquivo completo.

## Verificação

Os 96 testes de lógica passaram. A navegação de UA/UC, busca, gravação/edição, conflitos, histórico e regressões das outras abas foram verificados em DOM simulado. A inspeção visual em navegador real e a publicação no GitHub não foram realizadas nesta entrega.
