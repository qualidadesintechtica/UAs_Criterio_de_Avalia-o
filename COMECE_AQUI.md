# Atualizar para V6.6.1 — corrigir o carregamento dos critérios

A V6.6 já aparece na página, mas o erro **57014 — fonte critérios** impede concluir a consulta. Esta pasta contém a correção e todos os recursos anteriores.

## 1. Executar o SQL novo

1. Extraia o ZIP.
2. Abra **Supabase → SQL Editor**, no mesmo projeto da página.
3. Abra o arquivo **supabase/10_CRITERIOS_PAGINADOS.sql** desta pasta.
4. Copie e execute **todo o conteúdo**, sem selecionar somente um trecho.
5. Aguarde a mensagem **V6.6.1: leitura paginada instalada**.

**Se a V6.6 e a gestão de acessos já estão instaladas, não repita SQL 07, 08 ou 09. A função nq-gerenciar-usuarios não precisa ser publicada novamente.**

## 2. Atualizar os arquivos do GitHub

1. Abra o repositório **qualidadesintechtica/UAs_Criterio_de_Avalia-o**.
2. Use **Add file → Upload files** e envie todo o conteúdo extraído, substituindo os arquivos na raiz publicada.
3. Inclua o novo **criteria-loading.mjs**, junto de `index.html`, `app.mjs`, estilos, demais módulos e pastas. Não envie somente o ZIP fechado nem coloque os arquivos dentro de uma pasta extra.
4. Confirme em **Commit changes** e aguarde a publicação do GitHub Pages.
5. Pressione **Ctrl + F5** e confira **V6.6.1 · 21/10/2026** na página.

O SQL e os arquivos da página precisam estar atualizados para usar a nova forma de leitura.

## 3. Conferir os resultados

Entre no painel e clique em **Atualizar dados**. A página lê lotes menores de critérios até completar o conjunto. Confira os mesmos filtros usados antes para comparar os totais. A barra passa a usar os critérios concluídos, com o cálculo já existente.

A leitura foi testada com o mesmo resultado da definição de consulta enviada. Se um lote falhar, o painel informa a falha e preserva a última consulta completa, quando disponível. Não apresenta uma parte dos critérios como carga concluída.

Para detalhes e diagnóstico se o erro persistir, leia **LEIA_CORRECAO_57014.md**.

## Recursos mantidos

- Perfis Especialista, Revisor e Admin; cadastro institucional e gestão restrita aos três e-mails autorizados.
- Senha temporária com troca obrigatória e edição de nome/perfil.
- Progresso das respostas dos especialistas no recorte atual e no detalhe do material.
- Abas, filtros compartilhados, cartões, contagens, CSV e leitura por critério de UA/UC.
- Comentários, autoria, versões, histórico e texto original da Monday.
- Esteira na Planilha de entrada; BDQ A1/A2/A3, Gestor e Revisor; Modelagem no design.
- Domínios Ânima/Ulife e temas escuro/off-white.

## Se os acessos da V6.6 ainda não foram instalados

O SQL 10 trata a leitura de critérios. Ele não substitui o SQL 09 nem publica a função de gestão de usuários. Para instalar esses recursos, siga **LEIA_USUARIOS_E_ACESSOS.md**. Em uma instalação nova sobre as fontes já sincronizadas do BI: **05 → 07 → 08 → 09 → 10**, além da função de usuários.

## Verificação

Passaram **117 testes de lógica**, **195 verificações do SQL de paginação** e a regressão do aplicativo em DOM simulado, incluindo os dois lotes de critérios e a preservação da consulta anterior em caso de falha.

A correção ainda precisa ser aplicada no Supabase e publicada no GitHub da equipe. Nenhum SQL foi executado em produção nesta preparação.
