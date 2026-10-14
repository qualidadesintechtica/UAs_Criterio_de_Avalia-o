# Resultados das avaliações de UAs

Página estática pronta para GitHub Pages, com autenticação pelo Supabase existente do BI.

**Antes de publicar, siga `COMECE_AQUI.md`, começando pela proteção das fontes no banco.**

Filtros: esteira, UC, UA, revisor e especialistas. A tabela apresenta UC, UA, especialista, revisor, resultado e comentários. Os gráficos acompanham o mesmo recorte. Cada UA abre os critérios e pareceres completos; a exportação CSV preserva os comentários integrais.

## Estrutura

- `index.html`: página e login.
- `app.mjs`: autenticação, leitura paginada, filtros, gráficos e tabela.
- `core.mjs`: vínculos entre UC e UA, resultado vigente por critério e cálculos.
- `config.js`: URL do projeto, chave publicável e fontes protegidas.
- `styles.css`: identidade Sintechtica e layout responsivo.
- `vendor/supabase.js`: SDK oficial, sem dependência de CDN durante o acesso.
- `supabase/01_PROTEGER_ACESSO_RESULTADOS_UAS.sql`: preparação das permissões de leitura e das fontes institucionais.

## Mapeamento

| Campo exibido | Fonte |
| --- | --- |
| UC | `titulo` e `id_titulo` da base de materiais |
| UA | `titulo_ua` e `id_ua` |
| Especialista | `classificacao_feita_por` |
| Revisor | `revisor_validador` |
| Comentários | `parecer_especialista` de cada critério |

O vínculo prioriza o ID do item Monday. Relações ambíguas continuam visíveis como UC não localizada. UAs de ofertas distintas permanecem separadas. A classificação mais recente é selecionada pela data e pelo ID do subitem.

## Cálculos

Só entram Unidades de Aprendizagem. `entra_no_calculo=true` define os critérios avaliados. Dentro desse conjunto, `apontamos_inconformidade=Sim` indica inconformidade; os demais são conformes, seguindo o BI existente. Registros fora desse conjunto não entram no percentual de conformidade.

## Acesso

A página usa o login institucional já cadastrado, sem criar novas contas. O SQL verifica a sessão e o domínio institucional no banco. A sessão fica na aba do navegador, e os resultados são removidos ao sair. Nunca substitua a chave publicável em `config.js` por uma chave administrativa.

A proteção descrita cobre os endpoints deste painel e as relações de dados de que dependem. Outros endpoints, funções ou aplicações existentes precisam de suas próprias políticas de acesso.

## Testes

Execute `node --test tests/core.test.mjs`. O projeto não precisa de build para publicação.
