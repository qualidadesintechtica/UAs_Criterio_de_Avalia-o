-- V6.6.12 · Leitura de critérios pelo último ID, sem OFFSET.
-- Usa a chave única e os índices confirmados no diagnóstico de 22/10/2026.
-- Execute completo no Supabase do painel e publique os arquivos V6.6.12.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
do $$
begin
  if to_regprocedure('public.nq_painel_acesso_institucional()') is null
     or to_regclass('public.monday_subelementos_validacao') is null
     or to_regclass('public.nq_materiais_enriquecidos') is null then
    raise exception 'Fontes de critérios não localizadas. Execute no projeto Supabase do painel.';
  end if;
  if not exists(select 1 from pg_index i join pg_attribute a on a.attrelid=i.indrelid
    and a.attnum=i.indkey[0] where i.indrelid='public.monday_subelementos_validacao'::regclass
    and i.indisunique and i.indisvalid and i.indnkeyatts=1 and i.indpred is null
    and a.attname='monday_item_id' and a.attnotnull) then
    raise exception 'A leitura por cursor exige monday_item_id único e não nulo, conforme a base diagnosticada.';
  end if;
  create index if not exists nq_ua_subelementos_criterios_pagina_idx
    on public.monday_subelementos_validacao(monday_item_id)
    where criterio is not null and btrim(criterio)<>'';
  analyze public.monday_subelementos_validacao;
end;
$$;
create or replace function public.nq_criterios_cursor(p_apos_id text default '0',p_limite integer default 500)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_apos bigint;v_result jsonb;
begin
  if not coalesce(public.nq_painel_acesso_institucional(),false) then
    raise exception 'Acesso institucional necessário.' using errcode='42501';
  end if;
  if p_apos_id is null or p_apos_id !~ '^[0-9]{1,19}$'
     or p_limite is null or p_limite not between 1 and 500 then
    raise exception 'Cursor ou limite de critérios inválido.' using errcode='22023';
  end if;
  v_apos:=p_apos_id::bigint;
  with candidatos as materialized (
    select s.monday_item_id,s.parent_item_id,s.name as pergunta,s.criterio,
      s.classificacao_especialista,s.parecer_especialista,s.classificacao_feita_por,
      s.data_classificacao_especialista,s.apontamos_inconformidade
    from public.monday_subelementos_validacao s
    where s.monday_item_id>v_apos and s.criterio is not null and btrim(s.criterio)<>''
    order by s.monday_item_id limit (p_limite+1)
  ), pagina as materialized (
    select * from candidatos order by monday_item_id limit p_limite
  ), registros as (
    select s.monday_item_id::text as subitem_id,s.parent_item_id::text as parent_item_id,
      m.matriz_oferta,m.id_ua,m.titulo_ua,s.pergunta,s.criterio,
      s.classificacao_especialista,s.parecer_especialista,s.classificacao_feita_por,
      s.data_classificacao_especialista,s.apontamos_inconformidade,
      m.esteira_producao,m.categoria_material,m.revisor_validador,
      case when btrim(s.classificacao_especialista) in ('Sim','Não') then true else false end as entra_no_calculo,
      m.bloco,m.status_validacao,m.gestor_validacao_nq
    from pagina s left join public.nq_materiais_enriquecidos m on m.parent_item_id=s.parent_item_id
  )
  select jsonb_build_object('versao',2,
    'registros',coalesce((select jsonb_agg(to_jsonb(r) order by r.subitem_id::bigint) from registros r),'[]'::jsonb),
    'lidos',(select count(*) from pagina),
    'proximo_id',(select p.monday_item_id::text from pagina p order by p.monday_item_id desc limit 1),
    'tem_mais',(select count(*) from candidatos)>p_limite
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.nq_criterios_cursor(text,integer) from public,anon;
grant execute on function public.nq_criterios_cursor(text,integer) to authenticated;
notify pgrst,'reload schema';
commit;
select 'V6.6.12: critérios por cursor instalados. Publique os arquivos V6.6.12 e atualize os dados.' as resultado;
