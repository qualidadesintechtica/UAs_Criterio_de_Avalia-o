# Progresso por UA e Participantes — V6.6.2

## Publicar esta versão

Extraia o ZIP e substitua **todo o conteúdo** na raiz publicada do repositório **qualidadesintechtica/UAs_Criterio_de_Avalia-o**. Não envie somente o ZIP nem crie uma pasta extra acima de `index.html`. Aguarde a publicação e pressione **Ctrl + F5**. Confira **V6.6.2 · 21/10/2026** na tela.

Esta atualização de interface não cria uma nova migração SQL. Os arquivos SQL 01 a 10 e a função de gestão da versão anterior foram mantidos sem alterações. A instalação da gestão de contas, se ainda estiver faltando, é descrita abaixo.

## Progresso individual

Na aba **UA**, cada linha mostra sua própria barra **abaixo do nome da UA**, com percentual e quantidade de critérios respondidos. A tabela mantém somente as colunas **UC, UA e Unidade da UA**. A visualização **Comentários** também mostra a barra de cada UA.

O detalhe da UA mantém o progresso do material aberto. A barra geral que ficava acima dos filtros foi retirada. As abas Planilha de entrada, BDQ e UC não exibem essa barra geral de respostas dos especialistas.

Cada percentual usa somente os critérios da respectiva UA no recorte atual. Os filtros por esteira, lote, UC, UA, revisor e especialistas continuam funcionando, assim como a busca e os status.

- Respostas Sim, Não e Não se aplica contam como respondidas. Progresso não é percentual de aprovação.
- Critérios pendentes ficam fora do número de respondidos.
- Comentários complementares e edição de texto não aumentam o progresso.
- Uma UA sem critérios disponíveis mostra **Sem critérios sincronizados**, sem inventar 0% ou 100%.
- O total vem dos critérios disponíveis na base; não de uma quantidade fixa esperada fora dela.

## Onde fica Participantes

O botão **Participantes** fica no menu lateral, logo depois das abas dos materiais, e também no cabeçalho, junto de **Atualizar dados**. Ele aparece após o login, mesmo se a permissão administrativa ou a instalação não tiver sido confirmada. Nessa situação, a área explica o bloqueio e mantém as operações protegidas.

O botão visível não concede autorização. A listagem de contas e as alterações continuam restritas no servidor a:

- ligia.neta@animaeducacao.com.br
- joao.cane@animaeducacao.com.br
- cristina.brito@animaeducacao.com.br

Essas contas precisam estar confirmadas e com perfil Admin na configuração protegida. Contas Especialista e Revisor mantêm as consultas e comentários existentes, sem acesso à listagem ou à gestão de outras pessoas.

## Ativar a gestão, se ainda não estiver disponível

Se Participantes informar **gestão ainda não instalada**:

1. Abra o **SQL Editor** do mesmo projeto Supabase usado pela página.
2. Execute **todo o arquivo** `supabase/09_USUARIOS_E_ACESSOS.sql`, incluído nesta pasta.
3. Em **Edge Functions**, crie/publique uma função com o nome exato **nq-gerenciar-usuarios**.
4. Substitua o exemplo pelo conteúdo completo de `supabase/functions/nq-gerenciar-usuarios/index.ts` e publique. Mantenha a verificação de JWT ativada.
5. Entre na página com uma das três contas autorizadas, abra **Participantes** e clique em **Atualizar**.

**O SQL 10 corrige a leitura de critérios; ele não instala a gestão de participantes.** Se o SQL 10 já foi aplicado e o 09 ainda falta, é possível instalar o 09 agora: a leitura paginada usa a política de acesso atual.

Se a listagem aparece, mas **Criar login** está desativado, confira a mensagem do serviço na própria área. A criação e a troca de senha exigem a função de servidor publicada. A edição de nome e perfil usa o SQL 09.

O endereço padrão autorizado pela função é `https://qualidadesintechtica.github.io`. Se o site usa outro domínio, configure **NQ_ORIGINS** no ambiente da função com a origem exata, sem o caminho do repositório ou barra final. Não coloque chave administrativa nos arquivos públicos. Os detalhes das variáveis e do cadastro por e-mail continuam em **LEIA_USUARIOS_E_ACESSOS.md**.

Se a mensagem for **conta sem autorização**, confira o e-mail com que entrou, sua confirmação e o perfil Admin. A atualização do site não concede administração a um e-mail fora dos três autorizados.

## Operações dentro da página

Com a autorização e o serviço confirmados:

- **Criar login:** informe nome, e-mail institucional, perfil e uma senha temporária confirmada. A pessoa precisará escolher outra no primeiro acesso.
- **Editar nome e perfil:** procure a pessoa, altere e salve. O e-mail não é editado por essa operação.
- **Trocar senha:** defina uma senha temporária e confirme. A troca por uma senha pessoal será exigida no próximo acesso.

A administração permanece na própria sessão. A senha temporária não é enviada por e-mail; deve ser comunicada pelo canal interno da equipe. Para redefinir a própria senha temporária de um Admin, outro Admin autorizado precisa realizar a operação, como na versão anterior.

Na tela inicial, o botão **Criar login e senha** continua disponível para o cadastro institucional como Especialista ou Revisor, conforme as configurações de confirmação do projeto.

## Verificação

Passaram **120 testes de lógica**, **131 verificações do controlador de acessos** e a regressão do aplicativo em DOM simulado. Foram conferidos percentuais separados para duas UAs, filtros, tabela com três colunas, lista, ausência da barra geral, instalação ausente, usuário sem permissão, recuperação pelo botão Atualizar, criação, nome/perfil, senha temporária e perda de autorização durante a verificação.

A tabela e Participantes também foram inspecionados em navegador com dados de teste, incluindo o aviso de SQL ausente. As consultas, filtros, leitor UA/UC, BDQ, comentários e histórico anteriores foram preservados. Nenhuma conta real foi criada ou alterada, e a publicação em produção não foi executada nesta preparação.
