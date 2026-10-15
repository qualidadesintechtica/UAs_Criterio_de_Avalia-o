-- Execute após 01_PROTEGER_ACESSO_RESULTADOS_UAS.sql.
-- Conecta Planilha de entrada, UA, BDQ (A1/A3) e UC às fontes sincronizadas.
-- Não altera as respostas, os pareceres ou os status da Monday.
begin;

do $$
begin
  if to_regclass('public.monday_criterios_avaliacao_uas') is null
     or to_regclass('public.monday_criterios_pareceres') is null then
    raise exception 'As tabelas de formulários e pareceres da Monday não existem neste projeto.';
  end if;
  if to_regclass('public.vw_ua_resultados_materiais_autenticados') is null then
    raise exception 'Execute primeiro 01_PROTEGER_ACESSO_RESULTADOS_UAS.sql.';
  end if;
end;
$$;

create or replace view public.vw_materiais_monday_avaliacoes_autenticadas
with (security_barrier = true)
as
select
  id, monday_item_id, nome_item, data_avaliacao, data_avaliacao_hora,
  avaliador, categoria_material, matriz_oferta, conceito_final,
  validacao_material_item_id,
  indicador_1, indicador_2, indicador_3, indicador_4,
  indicador_5, indicador_6, indicador_7,
  indicador_1_score, indicador_2_score, indicador_3_score, indicador_4_score,
  indicador_5_score, indicador_6_score, indicador_7_score,
  synced_at, updated_at
from public.monday_criterios_avaliacao_uas
where (select auth.uid()) is not null
  and lower(split_part(coalesce((select auth.jwt()) ->> 'email', ''), '@', 2))
      = 'animaeducacao.com.br';

create or replace view public.vw_materiais_monday_pareceres_autenticados
with (security_barrier = true)
as
select
  id, monday_item_id, nome_item, avaliador, categoria_material,
  matriz_oferta, numero_criterio, criterio_id, criterio_titulo,
  parecer_id, parecer_titulo, parecer, tipo_formulario,
  data_avaliacao, data_avaliacao_hora, updated_at, synced_at
from public.monday_criterios_pareceres
where (select auth.uid()) is not null
  and lower(split_part(coalesce((select auth.jwt()) ->> 'email', ''), '@', 2))
      = 'animaeducacao.com.br';

-- Mantém as colunas anteriores e acrescenta o status e as datas reais da esteira.
create or replace view public.vw_ua_resultados_materiais_autenticados
with (security_barrier = true)
as
select
  chave_material, monday_item_validacao, id_titulo, id_ua,
  titulo, titulo_ua, item_name, esteira_producao, matriz_oferta,
  semestre_oferta, categoria_material, eh_ua, revisor_validador,
  status_validacao, sincronizado_esteira, sincronizado_validacao
from public.vw_materiais_bi_consolidada
where (select auth.uid()) is not null
  and lower(split_part(coalesce((select auth.jwt()) ->> 'email', ''), '@', 2))
      = 'animaeducacao.com.br';

revoke all on public.vw_materiais_monday_avaliacoes_autenticadas,
              public.vw_materiais_monday_pareceres_autenticados,
              public.vw_ua_resultados_materiais_autenticados
from anon, public;
grant select on public.vw_materiais_monday_avaliacoes_autenticadas,
                public.vw_materiais_monday_pareceres_autenticados,
                public.vw_ua_resultados_materiais_autenticados
to authenticated;

-- Fecha a leitura anônima direta destas duas fontes e preserva o acesso
-- de authenticated que já existia para o BI.
do $$
declare
  nome text;
  tinha_acesso boolean;
begin
  foreach nome in array array[
    'public.monday_criterios_avaliacao_uas',
    'public.monday_criterios_pareceres'
  ]
  loop
    tinha_acesso := has_table_privilege('authenticated', nome, 'SELECT');
    execute format('revoke select on table %s from anon, public', nome::regclass);
    if tinha_acesso then
      execute format('grant select on table %s to authenticated', nome::regclass);
    end if;
    if has_table_privilege('anon', nome, 'SELECT') then
      raise exception 'A leitura anônima de % continua liberada. A transação será desfeita.', nome;
    end if;
  end loop;
end;
$$;

commit;

select
  'Fontes institucionais dos quatro menus instaladas.' as resultado,
  has_table_privilege('anon', 'public.vw_materiais_monday_avaliacoes_autenticadas', 'SELECT') as anon_pode_ler_avaliacoes,
  has_table_privilege('anon', 'public.vw_materiais_monday_pareceres_autenticados', 'SELECT') as anon_pode_ler_pareceres;

-- Contagem administrativa: somente registros efetivamente sincronizados.
select categoria_material, count(*) as registros_avaliacao, max(synced_at) as ultima_sincronizacao
from public.monday_criterios_avaliacao_uas
group by categoria_material
order by categoria_material;
