-- V6.3 · 19/10/2026 · Planilha de entrada a partir do quadro de validações.
-- Execute uma vez depois do SQL 05. Não execute SQLs antigos depois deste.
-- Acrescenta à consulta protegida os Planos de Produção ausentes da consolidada.
-- Não altera a consolidada, a sincronização, as tabelas de comentários ou o histórico.
begin;
do $$
begin
  if to_regclass('public.monday_validacao_materiais') is null
     or to_regclass('public.vw_materiais_bi_consolidada') is null
     or to_regclass('public.vw_ua_resultados_materiais_autenticados') is null
     or to_regprocedure('public.nq_painel_acesso_institucional()') is null then
    raise exception 'Execute primeiro o SQL 05 deste pacote no projeto Supabase do BI.';
  end if;
end;
$$;

create or replace view public.vw_ua_resultados_materiais_autenticados
with (security_barrier=true) as
with planos as (
  select p.*
  from public.monday_validacao_materiais v
  cross join lateral (select to_jsonb(v) as d) j
  -- Usa os tipos da view existente para manter os 17 campos anteriores compatíveis.
  cross join lateral jsonb_populate_record(null::public.vw_materiais_bi_consolidada,
    jsonb_build_object(
      'chave_material','VALIDACAO_PP_'||v.monday_item_id::text,
      'monday_item_validacao',v.monday_item_id,
      'id_titulo',v.id_titulo,'id_ua',v.id_ua,
      'titulo',v.titulo,'titulo_ua',null,'item_name',v.name,
      'esteira_producao',v.esteira,
      'matriz_oferta',coalesce(nullif(btrim(j.d->>'matriz_oferta'),''),
        nullif(btrim(j.d->'dados_colunas'->'color_mkv9gyw4'->>'text'),'')),
      'semestre_oferta',v.periodo,'categoria_material','Plano de Produção',
      'eh_ua',false,'revisor_validador',v.revisor_validador,
      'status_validacao',v.status_validacao,'sincronizado_esteira',null,
      'sincronizado_validacao',v.sincronizado_em,'bloco',v.bloco
    )) p
  where regexp_replace(translate(lower(btrim(coalesce(v.tipo_material,''))),
    'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc'),'\s+',' ','g')='plano de producao'
), base as (
  select
    m.chave_material,
    m.monday_item_validacao,
    m.id_titulo,
    m.id_ua,
    m.titulo,
    m.titulo_ua,
    m.item_name,
    m.esteira_producao,
    m.matriz_oferta,
    m.semestre_oferta,
    m.categoria_material,
    m.eh_ua,
    case when p.monday_item_validacao is not null then p.revisor_validador else m.revisor_validador end as revisor_validador,
    case when p.monday_item_validacao is not null then p.status_validacao else m.status_validacao end as status_validacao,
    m.sincronizado_esteira,
    case when p.monday_item_validacao is not null then p.sincronizado_validacao else m.sincronizado_validacao end as sincronizado_validacao,
    m.bloco,
    case when p.monday_item_validacao is not null then 'validacao_planos' else 'consolidada' end::text as origem_material
  from public.vw_materiais_bi_consolidada m
  left join planos p on p.monday_item_validacao=m.monday_item_validacao
    and (lower(btrim(coalesce(m.categoria_material,''))) in ('plano de produção','plano de producao','planilha de entrada','pe'))
)
select
  b.chave_material,
  b.monday_item_validacao,
  b.id_titulo,
  b.id_ua,
  b.titulo,
  b.titulo_ua,
  b.item_name,
  b.esteira_producao,
  b.matriz_oferta,
  b.semestre_oferta,
  b.categoria_material,
  b.eh_ua,
  b.revisor_validador,
  b.status_validacao,
  b.sincronizado_esteira,
  b.sincronizado_validacao,
  b.bloco,
  b.origem_material
from base b
where (select public.nq_painel_acesso_institucional())
union all
select
  p.chave_material,
  p.monday_item_validacao,
  p.id_titulo,
  p.id_ua,
  p.titulo,
  p.titulo_ua,
  p.item_name,
  p.esteira_producao,
  p.matriz_oferta,
  p.semestre_oferta,
  p.categoria_material,
  p.eh_ua,
  p.revisor_validador,
  p.status_validacao,
  p.sincronizado_esteira,
  p.sincronizado_validacao,
  p.bloco,
  'validacao_planos'::text as origem_material
from planos p
where (select public.nq_painel_acesso_institucional())
  and not exists (select 1 from base b
    where b.origem_material='validacao_planos' and b.monday_item_validacao=p.monday_item_validacao);

revoke all on public.vw_ua_resultados_materiais_autenticados from public,anon;
grant select on public.vw_ua_resultados_materiais_autenticados to authenticated;
notify pgrst,'reload schema';
commit;

-- Resultado de conferência: usa os itens, não os subelementos ou o grupo físico.
select 'V6.3 instalada: Planos de Produção incluídos na consulta protegida.' as resultado,
  count(distinct monday_item_id) as planos_sincronizados,
  count(distinct monday_item_id) filter(where status_validacao='Validado') as validados,
  count(distinct monday_item_id) filter(where status_validacao='Liberado para validação - NQ') as liberados
from public.monday_validacao_materiais
where regexp_replace(translate(lower(btrim(coalesce(tipo_material,''))),
  'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc'),'\s+',' ','g')='plano de producao';
