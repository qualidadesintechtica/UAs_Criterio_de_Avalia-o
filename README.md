# Comentários e avaliações dos materiais — Monday

Página para GitHub Pages com login institucional do BI e menu lateral **Planilha de entrada, UA, BDQ e UC**.

## Instalar ou atualizar

Siga `COMECE_AQUI.md`. Nesta versão, execute no Supabase `supabase/03_COMENTARIOS_COM_HISTORICO.sql` após os arquivos 01 e 02. Em seguida, substitua os arquivos no repositório GitHub. A execução do SQL e a publicação no GitHub não foram feitas por este pacote.

## Dados da Monday

A página usa a sincronização já existente entre Monday e Supabase:

| Menu | Categorias registradas na fonte |
| --- | --- |
| Planilha de entrada | Planilha de Entrada / PE |
| UA | Unidade de Aprendizagem / UA |
| BDQ | Banco de questões / BDQ / Avaliação A1 / Avaliação A3 |
| UC | UC / Unidade Curricular |

As fontes protegidas são:

- `vw_ua_resultados_criterios_autenticados`: critérios formais, classificação, especialista, revisor e parecer da esteira.
- `vw_ua_resultados_materiais_autenticados`: IDs, nomes, esteira, matriz, semestre e status atual do material.
- `vw_materiais_monday_avaliacoes_autenticadas`: formulários, avaliador, conceito final e os sete indicadores de UC com suas pontuações.
- `vw_materiais_monday_pareceres_autenticados`: textos integrais dos pareceres, vinculados ao item do formulário.

**Atualizar dados** consulta novamente o Supabase. As mudanças feitas na Monday aparecem depois que a rotina de sincronização existente as registrar. O painel mostra a data de sincronização disponível e o horário da consulta.

## Comentários dos professores

No painel **Ver pareceres**, **Adicionar comentário** cria uma informação complementar e **Editar comentário** altera um texto existente. **Histórico de comentários** mostra todas as versões, inclusive o original da Monday preservado pelo banco na primeira edição. Autor, e-mail, data e número da versão são registrados a cada alteração. O texto é tratado como texto puro, com limite de 10.000 caracteres.

A edição é colaborativa entre as contas institucionais já autorizadas (`@animaeducacao.com.br`), sem ampliar os domínios de acesso. A autoria usa o usuário e o e-mail da sessão no servidor. Somente a função de gravação recebe permissão de escrita; o navegador não pode atualizar ou apagar diretamente as tabelas de comentários e histórico. RLS protege a leitura. Versões desatualizadas geram conflito e mantêm o texto digitado; reenvios da mesma gravação não duplicam o histórico.

**Os comentários são salvos no Supabase para o painel. Não há envio de edições à Monday.** O texto atual da Monday continua disponível separadamente; a classificação, a pontuação e os responsáveis pela avaliação não são alterados. A sincronização pode atualizar a fonte sem substituir a edição salva no painel. Se uma nova classificação do mesmo critério passar a ser a vigente, as edições da classificação anterior continuam dentro do histórico daquela classificação, e os complementos continuam no material.

A busca, a lista e o CSV usam os comentários atuais. O CSV acrescenta autoria, data e versão da edição e texto atual da fonte. O histórico completo é consultado no painel. Sem o SQL 03 ou em falha de acesso aos comentários, a página informa a indisponibilidade e desativa a edição.

## Organização

Os filtros de esteira, UC, material, revisor e especialistas afetam a tabela, os cartões, os gráficos e a exportação. A opção Comentários agrupa a leitura por UC. O painel lateral mostra o material completo, as classificações e os pareceres atuais e anteriores disponíveis. O menu também fica disponível no celular.

Os vínculos priorizam o ID do material da validação, o código exato da UA e o código da UC. Relações ambíguas ficam sem associação automática; o código do formulário continua visível. O especialista é o responsável pela classificação formal, quando fornecido pela fonte. O revisor do formulário vem de `avaliador`. Campos ausentes permanecem sinalizados como não informados.

## Cálculos e classificações

- Critérios formais: seguem a regra do BI para `entra_no_calculo` e `apontamos_inconformidade`.
- UC: os conceitos e as pontuações são preservados. A média considera as pontuações registradas; não é um percentual de respostas Sim/Não.
- Parecer textual: aparece na leitura e na exportação, sem entrar como resposta de conformidade.
- Status do material: usa o status atual da esteira quando houver um vínculo exato; caso contrário, usa o conceito final registrado no formulário.
- Registros sem resposta individual continuam visíveis. A falta de resposta não gera uma reprovação automática.

Os cartões selecionam materiais inteiros do recorte. Requer atenção considera inconformidade formal ou status de ajustes registrado. Classificadas/Avaliadas considera resultado de critério ou validação registrada. Sem classificação indica que esses resultados não estão disponíveis no recorte.

## Arquivos principais

- `index.html`, `styles.css`: layout, menu, tabela, lista, gráficos e painel lateral.
- `app.mjs`: login, consulta paginada, seleção da seção e interação.
- `core.mjs`: vínculos, critérios vigentes, histórico e cálculos.
- `navigation.mjs`: quatro menus e categorias.
- `monday-data.mjs`: integração dos formulários e pareceres reais.
- `portal-comments.mjs`: aplicação das edições, complementos, vínculos estáveis e mensagens de conflito.
- `supabase/03_COMENTARIOS_COM_HISTORICO.sql`: tabelas, RLS e gravação transacional com versões.
- `view-model.mjs`: seleção de materiais completos e destaque seguro da pesquisa.
- `config.js`: URL, chave publicável e nomes das fontes.
- `vendor/supabase.js`: SDK oficial.

Nunca use chave administrativa em `config.js`. As views verificam a sessão e o domínio institucional no banco; os SQLs fecham a leitura anônima direta das fontes deste painel e preservam o acesso autenticado existente do BI. Outras aplicações e endpoints mantêm suas próprias regras.

## Verificação

Execute `node --test tests/*.test.mjs`. Foram conferidos os campos das fontes reais, a adaptação dos dados sincronizados e os testes de categorias, vínculos, conceitos, pareceres, histórico, filtros e exportação. Nesta versão, passaram 38 testes de lógica e 12 verificações locais da gravação em PostgreSQL embarcado (PGlite), incluindo histórico, permissão, conflitos, reenvios e preservação da fonte. A instalação foi executada duas vezes nessa base de teste. Também foram exercitados, em DOM simulado, os fluxos de adicionar, editar, abrir histórico, tratar conflito e encerrar a sessão. A execução dos SQLs no seu projeto Supabase, o login institucional completo, a inspeção visual em navegador e a publicação no GitHub não foram realizados aqui.
