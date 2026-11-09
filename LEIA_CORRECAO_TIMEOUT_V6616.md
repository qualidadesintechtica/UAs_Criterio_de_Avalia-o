# V6.6.16 — ajuste do carregamento de critérios

Diagnóstico: `criteria-cursor.mjs` impunha 15 segundos por RPC, independentemente do `statement_timeout` de 120 segundos no PostgreSQL. `app.mjs` cancelava a carga geral após 180 segundos. Com 26.924 critérios válidos e 54 páginas mínimas, estes prazos podem interromper uma carga legítima.

Alterações: prazo por página de critérios de 15 para 30 segundos; prazo geral de 3 para 6 minutos; mensagem de erro correspondente; versão e parâmetros de cache atualizados. A redução de lote 500 → 125 → 50, paginação por cursor, validação das páginas, autenticação institucional e descarte de resultados incompletos foram mantidos.

**Limite:** não é garantia de eliminar timeout. Sem medir cada página na sessão autenticada, não é possível saber se o problema é uma consulta individual lenta, rede, carga concorrente ou o volume total. O carregamento permanece integral e pode levar vários minutos. Não foram feitas alterações no Supabase ou na Monday.

Publicação: faça backup da versão atual; publique os arquivos do pacote na raiz do GitHub Pages, sem a pasta `.git`; aguarde deploy; atualize com Ctrl+F5 e confira V6.6.16. Teste login, filtro Semestre de Oferta, critérios e atualização de IDs corrigidos. Se persistir, coletar tempos das chamadas `nq_criterios_cursor` na aba Network do navegador.
