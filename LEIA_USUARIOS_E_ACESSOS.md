# Usuários, perfis e respostas dos especialistas — V6.6

## Instalação em três etapas

Use **o mesmo projeto Supabase da página atual**, identificado em `config.js`. A autenticação é compartilhada com as contas já existentes do BI.

Para corrigir o erro 57014 de critérios em uma V6.6 já instalada, siga **LEIA_CORRECAO_57014.md**: SQL 10 e arquivos novos. O procedimento abaixo continua descrevendo a instalação dos acessos.

1. Execute **o arquivo completo** `supabase/09_USUARIOS_E_ACESSOS.sql` no SQL Editor, depois dos scripts já instalados do painel. Uma base na V6.5 com SQL 08 precisa somente do 09. Instalação nova sobre as fontes existentes do BI: 05 → 07 → 08 → 09.
2. Publique a Edge Function **nq-gerenciar-usuarios**, usando **todo o arquivo** `supabase/functions/nq-gerenciar-usuarios/index.ts`.
3. Execute também o SQL 10 para a leitura paginada de critérios, se ainda não estiver instalado. Substitua todos os arquivos publicados da página pelos desta pasta e confira **V6.6.4 · 21/10/2026** após Ctrl + F5. A instalação de acessos não precisa ser repetida se já está disponível. Para baixar planilhas na V6.6.4, acrescente o SQL 11 e nq-baixar-planilha conforme LEIA_DOWNLOAD_PLANILHAS.md.

**Enviar os arquivos para o GitHub não executa o SQL nem publica a função.** A barra de progresso funciona com as fontes atuais; a gestão de acessos exige a instalação no servidor.

### Publicar a função no painel do Supabase

Em **Edge Functions**, escolha criar/publicar pelo editor. Informe o nome exato **nq-gerenciar-usuarios**, apague o exemplo, cole o arquivo completo e publique. A função precisa da verificação de JWT ativada, além da validação da sessão e da permissão que já faz internamente. Não desative essa proteção para contornar erros.

Para quem usa a CLI com o projeto já vinculado, a pasta contém `supabase/config.toml` e o código da função. O comando de publicação é:

```bash
supabase functions deploy nq-gerenciar-usuarios
```

O servidor usa `SUPABASE_URL` e as chaves disponibilizadas pelo ambiente hospedado. Aceita os mapas `SUPABASE_PUBLISHABLE_KEYS` e `SUPABASE_SECRET_KEYS` com a entrada `default`, ou as variáveis legadas `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. Chaves administrativas pertencem somente ao ambiente do servidor. Não as inclua em `config.js`, arquivos públicos ou mensagens.

A origem padrão autorizada é `https://qualidadesintechtica.github.io`. Se o site usa outro domínio, configure em **Edge Functions → Secrets** o segredo **NQ_ORIGINS**, com a origem exata, por exemplo `https://qualidade.exemplo.com.br`. Para várias origens, separe por vírgula. Não inclua caminho, barra final ou curingas. No GitHub Pages, o caminho do repositório não faz parte da origem.

### Cadastro público e confirmação de e-mail

O botão **Criar login e senha** fica na tela inicial. Aceita nome, e-mail institucional, perfil Especialista ou Revisor, senha pessoal e confirmação. Os domínios permitidos no painel continuam sendo **@animaeducacao.com.br** e **@ulife.com.br**.

O cadastro usa a configuração existente de Authentication do projeto. Para permitir autocadastro, a criação de novas contas por e-mail precisa estar habilitada. Se a confirmação estiver ligada, a pessoa deve confirmar o e-mail antes de entrar; o envio depende da configuração de e-mail do projeto. Se ela já tem uma conta do BI, deve usar **Entrar**, sem criar outra.

Na V6.6.2, Participantes também aparece para contas sem permissão ou sem instalação confirmada, com uma explicação do bloqueio. A lista de contas e as alterações continuam protegidas no servidor. Consulte **LEIA_PARTICIPANTES_E_PROGRESSO_UA.md**.

## Os três perfis

| Perfil | Uso nesta versão |
| --- | --- |
| Especialista | Identifica a função da pessoa; mantém as consultas e a edição de comentários disponíveis anteriormente. |
| Revisor | Identifica a função da pessoa; mantém as consultas e a edição de comentários disponíveis anteriormente. |
| Admin | Pode gerir contas, nomes, perfis e senhas temporárias, desde que também esteja na lista autorizada do servidor. |

Não foi criada uma restrição de materiais por proprietário ou por perfil. Especialista e Revisor mantêm os acessos de consulta e comentários que o painel já permitia a usuários institucionais.

A autorização de gestão está limitada a:

- ligia.neta@animaeducacao.com.br
- joao.cane@animaeducacao.com.br
- cristina.brito@animaeducacao.com.br

O SQL atribui Admin a essas contas quando elas já existem. Se ainda não existem, podem ser cadastradas pela tela inicial e confirmar o e-mail; o servidor reconhece o endereço autorizado. Uma conta Admin confirmada também pode cadastrar outra das três contas, com senha temporária.

Os demais usuários existentes recebem **Revisor** inicialmente, exceto quando já têm uma solicitação de perfil Especialista. O Admin pode editar a atribuição. Reexecutar o SQL não sobrescreve os perfis já registrados na tabela protegida.

O cadastro público não oferece Admin. Mudar metadados de usuário ou controles da tela não concede administração. O servidor verifica perfil protegido, e-mail atual e confirmado, lista autorizada e ausência de senha temporária pendente. Não é possível atribuir Admin a um quarto e-mail pela página. A pessoa também não pode remover o próprio perfil Admin; outro Admin autorizado pode fazer essa alteração.

## Criar login dentro do painel

1. Entre com uma das três contas autorizadas e abra **Participantes**, no menu lateral.
2. Confira o aviso **Serviço disponível**.
3. Clique em **Criar login**, preencha nome, e-mail institucional e perfil e informe a senha temporária duas vezes.
4. Confirme a criação e comunique a senha à pessoa pelo canal interno usado pela equipe. A função não envia a senha por e-mail.

Contas criadas por um Admin têm o e-mail confirmado pelo provisionamento da equipe e precisam trocar a senha no primeiro acesso. A pessoa que administra permanece na própria sessão. Se a conta já existe, a página orienta localizá-la na lista, sem criar duplicidade.

## Editar nome e perfil

Busque a pessoa por nome ou e-mail, ou use o filtro de perfil. Clique em **Editar nome e perfil**, ajuste os campos e salve. O e-mail não é alterado por essa tela. Se outro Admin mudou o nome no intervalo, atualize a lista antes de tentar novamente.

## Definir uma senha temporária

Clique em **Trocar senha** na pessoa correta, digite e confirme a senha e salve. O nome, o perfil e a confirmação de e-mail da conta existente são preservados. Use de **8 a 128 caracteres**; as regras adicionais de senha configuradas no projeto também se aplicam.

No próximo acesso ao Acompanhamento da Qualidade, a pessoa verá **Crie sua senha pessoal**. Até salvar uma senha diferente, o painel bloqueia suas consultas e gravações. O servidor registra a atribuição e a troca, sem copiar senhas ou hashes para as tabelas do painel. Há um intervalo mínimo de um minuto entre atribuições temporárias à mesma conta.

Para redefinir a senha de uma das contas Admin, outro Admin autorizado deve realizar a operação. A tela não permite redefinir a própria senha temporária.

**A senha e o nome pertencem à conta Supabase compartilhada:** mudar esses dados também afeta o login da mesma pessoa em outras páginas que usam essa conta, como o BI. A exigência de troca antes de consultar os dados foi aplicada às fontes protegidas deste painel; não foram alteradas as permissões das consultas próprias de outras aplicações. Sessões já abertas em outros aplicativos seguem o comportamento existente do projeto Auth.

## Barras de progresso dos materiais

As quatro abas têm uma barra por material abaixo do nome, na tabela, na lista e no detalhe. Ela mostra **respondidos / critérios disponíveis** e o percentual arredondado, considerando os filtros atuais. Na UC, cada unidade usa seus próprios indicadores na tabela e no detalhe por unidade; a lista e a visão completa usam o conjunto da UC. O título é Respostas dos especialistas na UA, Progresso dos indicadores na UC e Progresso das respostas em Planilha de entrada e BDQ. Consulte **LEIA_PROGRESSO_TODAS_ABAS_E_NOMES.md**.

- Um critério respondido conta mesmo quando a resposta é negativa ou **Não se aplica**. Progresso mede preenchimento, não aprovação.
- Classificações pendentes ou ainda não sincronizadas não contam como resposta.
- Comentários complementares, pareceres apenas textuais, metadados e linhas de inventário não aumentam o progresso.
- Editar o texto de um comentário não muda a resposta do especialista.
- Materiais sem critérios sincronizados são sinalizados; não se inventa um total esperado para eles. Sem critérios disponíveis, a barra mostra um traço e o aviso correspondente.

O denominador vem dos critérios sincronizados na base, não de um número fixo de perguntas esperado fora dela. **100% significa que os critérios disponíveis do material no recorte têm resposta**. Sem critérios, aparece uma barra cinza com traço e Sem critérios sincronizados. O percentual não substitui os quatro status operacionais dos materiais. Atualizar os dados consulta a sincronização existente; a página não passa a enviar respostas para a Monday.

## Diagnóstico

| Mensagem ou situação | Providência |
| --- | --- |
| Gestão ainda não instalada / PGRST202 | Execute todo o SQL 09 no projeto correto. |
| Serviço não publicado / NOT_FOUND / 404 | Publique a função com o nome exato nq-gerenciar-usuarios. |
| Não foi possível conectar ao serviço | Confira a publicação da função, a conexão e NQ_ORIGINS; uma falha de origem pode impedir a leitura da resposta. |
| Configuração do servidor incompleta | Confira as variáveis do ambiente da função; não coloque chaves administrativas no navegador. |
| Sem autorização | Confira e-mail exato, confirmação, perfil Admin e ausência de senha temporária pendente; saia e entre novamente. |
| Conta já existe | Busque a pessoa na lista e use a edição ou a senha temporária. |
| Não foi possível salvar | Atualize a lista, confira a permissão e o cadastro e aguarde um minuto antes de repetir. |
| Cadastro público desativado | Verifique a configuração de cadastro por e-mail ou peça a criação a um Admin. |

Se o SQL ainda não foi instalado, contas antigas sem marca de senha temporária mantêm o uso anterior do painel, sem a gestão de usuários. Isso não dispensa a instalação para usar os novos recursos. Uma conta marcada como temporária nunca recebe essa exceção.

## Verificação da entrega

- **127 testes de lógica** passaram com `node --test tests/*.test.mjs` na V6.6.3, incluindo o progresso das quatro abas e os nomes por vínculo exato.
- **131 verificações do controlador de acessos** na V6.6.2 cobriram perfis, cadastro isolado, edição, senha temporária, instalação ausente, atualização de permissão, falhas e limpeza de sessão. Esse controlador foi preservado na V6.6.3.
- **321 verificações da função de servidor**, com serviços simulados, cobriram autorização, alvos, validações, erros e limites de mutação.
- **39 verificações de SQL** em PostgreSQL embarcado cobriram autorização, perfis, transações de senha, bloqueio pendente, preservação e reinstalação.
- A regressão das abas e do leitor UA/UC passou em DOM simulado. Login, formulários, gestão e barra foram inspecionados visualmente em navegador, com dados de teste.

A entrega contém código e instruções. O login institucional real, o envio de confirmação de e-mail, a publicação no GitHub e a instalação no Supabase de produção precisam ser conferidos no ambiente da equipe. Nenhuma conta real foi criada ou alterada nesta preparação.

Referências oficiais: [Admin createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [Admin updateUserById](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid), [publicar funções pelo painel](https://supabase.com/docs/guides/functions/quickstart-dashboard) e [autenticação das funções](https://supabase.com/docs/guides/functions/auth-headers).
