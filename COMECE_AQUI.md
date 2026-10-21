# Publicar a V6.6 — acessos, perfis e progresso

Esta pasta contém a página completa, preservando as consultas, os filtros e os comentários com histórico. Leia também **LEIA_USUARIOS_E_ACESSOS.md**.

**A V6.6 tem três etapas: SQL, função de servidor e arquivos do GitHub. Enviar os arquivos ao GitHub não instala as duas primeiras etapas.**

## 1. Atualizar o banco

Se a V6.5 já funciona com o SQL 08, execute **todo o arquivo** `supabase/09_USUARIOS_E_ACESSOS.sql` no SQL Editor do mesmo projeto Supabase usado em `config.js`.

Não execute somente um trecho. Não repita scripts antigos depois do 09. Para uma instalação nova sobre as fontes já sincronizadas do BI, a sequência é **05 → 07 → 08 → 09**. Se somente o 07 está instalado, execute 08 e depois 09.

O SQL 09 inclui os perfis, a autorização das três contas e a troca obrigatória de senha temporária. Não cria automaticamente as contas das pessoas.

## 2. Publicar a função de servidor

1. No mesmo projeto Supabase, abra **Edge Functions** e a opção de criar/publicar uma função pelo editor.
2. Use exatamente o nome **nq-gerenciar-usuarios**.
3. Substitua o exemplo por **todo o conteúdo** de `supabase/functions/nq-gerenciar-usuarios/index.ts` e publique.
4. Mantenha a verificação de JWT ativada; `supabase/config.toml` já registra essa configuração para publicação por CLI.
5. O endereço padrão autorizado é `https://qualidadesintechtica.github.io`. Para outro domínio, configure o segredo de servidor `NQ_ORIGINS` com a origem do site, sem caminho ou barra final. Consulte o guia para múltiplas origens e configuração do servidor.

Não coloque uma chave administrativa no GitHub ou em `config.js`.

## 3. Atualizar a página no GitHub

1. Extraia o ZIP.
2. Envie **todo o conteúdo extraído** para a raiz publicada do projeto, substituindo os arquivos correspondentes. Não envie apenas o ZIP fechado.
3. Inclua os novos módulos `access.mjs`, `access-policy.mjs`, `specialist-progress.mjs` e `access.css`, além de todos os arquivos anteriores.
4. Aguarde a publicação e pressione **Ctrl + F5**.
5. Confira **V6.6 · 21/10/2026** na página.

## 4. Conferir os novos recursos

- Na tela de entrada, **Criar login e senha** cadastra uma conta institucional como Especialista ou Revisor. A confirmação de e-mail segue a configuração do projeto.
- Dentro do sistema, **Usuários e acessos** aparece para as três contas Admin autorizadas, confirmadas e sem troca de senha pendente.
- A área permite criar login, editar nome e perfil e definir senha temporária. Quem recebe senha temporária deve escolher outra antes de consultar os resultados.
- Os perfis são **Especialista, Revisor e Admin**. Os demais usuários existentes recebem Revisor inicialmente, salvo perfil de Especialista já solicitado; um Admin pode corrigir a atribuição.
- A barra **Respostas dos especialistas**, acima dos filtros e no detalhe do material, mostra critérios respondidos e percentual. Materiais sem critérios sincronizados são sinalizados.

## 5. O que foi preservado

- Abas Planilha de entrada, UA, BDQ e UC; filtros compartilhados, busca, cartões, paginação e CSV.
- Leitura de UA/UC por critério, navegação e seletor para telas menores.
- Edição de comentários, autoria, datas, versões e histórico; texto original da Monday preservado.
- Ajustes - MODELAGEM / Modelagens em Requer análise do design.
- Esteira na Planilha de entrada; BDQ com A1, A2, A3, Gestor e Revisor.
- Domínios @animaeducacao.com.br e @ulife.com.br; temas escuro e off-white.

## Se aparecer uma mensagem de instalação

- **SQL 09 não instalado:** execute o arquivo completo no projeto correto.
- **Serviço não publicado / NOT_FOUND / erro de conexão:** publique a função com o nome exato e confira `NQ_ORIGINS`. Atualizar o GitHub não publica uma Edge Function.
- **Sem autorização:** confira se a conta usa exatamente um dos três e-mails, foi confirmada e está com perfil Admin. Saia e entre novamente.

A entrega foi verificada localmente, incluindo inspeção visual em navegador com dados de teste. Nenhuma conta real foi criada ou alterada, nenhum SQL foi executado em produção e nenhuma publicação foi feita automaticamente.
