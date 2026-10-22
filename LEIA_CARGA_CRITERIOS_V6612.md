# V6.6.12 — critérios por cursor

## Evidência recebida

O diagnóstico do CSV confirmou que `monday_subelementos_validacao.monday_item_id` tem chave primária, que o índice parcial de critérios está instalado e que `nq_materiais_enriquecidos.parent_item_id` tem índice único. A função atual `nq_criterios_pagina` ainda usava OFFSET e ordenava vários campos. A página consultava 200 critérios de cada vez e cancelava a carga inteira após 60 segundos.

Os índices presentes não demonstram que cada chamada excede o prazo do banco. A imagem mostrava cancelamento no carregamento, sem medições por lote. Esta versão reduz o trabalho repetido da paginação e distingue o prazo de uma página do prazo da carga completa. A validação remota de tempo continua necessária.

## Alteração

O SQL 16 cria `nq_criterios_cursor(p_apos_id,p_limite)`. A função seleciona os IDs seguintes em ordem numérica, usando o índice, antes de enriquecer os critérios. Não usa OFFSET. A instalação verifica a premissa de ID único e não nulo, sem modificar a chave ou os dados.

O contrato retorna JSON com o cursor do último subelemento, a quantidade lida antes da junção e o indicador de mais registros. A ordenação do cursor usa a coluna numérica de origem qualificada. Os IDs são transmitidos como texto para preservar bigint no navegador.

O leitor começa com 500 critérios por lote. Se uma chamada exceder o prazo, repete o mesmo cursor com 125 e, se necessário, 50. O conjunto só é aplicado depois de todas as páginas válidas. A quantidade de critérios na origem é conferida pelos IDs distintos; mais de um material para um critério é preservado.

Cada página de critérios tem limite de 15 segundos. As páginas das demais fontes comuns têm limite de 30 segundos, preservando os limites específicos já existentes para planos, BDQ, links, especialistas e responsáveis. A carga geral tem limite de três minutos e informa o número de registros lidos. O cancelamento geral tem mensagem própria, evitando atribuir o prazo total a uma consulta SQL isolada.

Se o SQL 16 estiver ausente, a página informa a instalação necessária. Não retorna à view integral antiga. O SQL 10 e as views existentes permanecem disponíveis para outros consumidores e para o histórico de comentários.

## Aplicar e conferir

Siga COMECE_AQUI.md. Após publicar, confira V6.6.12, atualize os dados e acompanhe o progresso. Verifique os filtros com os nomes exibidos na própria tabela. Os especialistas continuam limitados ao cadastro desse perfil. Esta atualização não infere identidades por abreviações ou nomes parecidos e não preenche responsáveis ausentes na Monday.

O rótulo real da esteira é **Out a Dez/26 (Antecipada)**. O CSV anterior não continha os dados de especialistas na produção porque a consulta de auditoria procurava o ano por extenso. A consulta corrigida é fornecida separadamente. Ela não altera o conteúdo do sistema.

## Validação

- Testes locais do SQL 16 com a estrutura diagnosticada, chave primária de critérios, índice por item pai, controle de acesso e reinstalação.
- Comparação do conjunto completo com a projeção original: 9.605 critérios de origem geraram 12.007 linhas após os vínculos em 20 lotes. Foram preservados critérios sem material, comentários e IDs grandes.
- Testes do leitor para cursor, redução de lote, falhas, cancelamento e ausência de fallback.
- Testes simulados da interface para filtros combinados, comentários, participantes, download Microsoft e erros de instalação ou tempo.

Não houve execução do SQL 16 no Supabase institucional nem publicação do site nesta sessão. Os tempos do teste local não representam o tempo de rede ou a carga do banco remoto.
