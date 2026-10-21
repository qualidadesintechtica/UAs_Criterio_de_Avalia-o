-- V6.6.1 · 21/10/2026 · Leitura de critérios em lotes antes do enriquecimento.
-- Execute COMPLETO no SQL Editor do mesmo projeto do painel.
-- Não reaplica 07/08/09; mantém views, comentários, perfis e política de acesso.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

do $$
declare v_rel regclass; v_kind "char";
begin
  if to_regprocedure('public.nq_painel_acesso_institucional()') is null
     or to_regclass('public.monday_subelementos_validacao') is null
     or to_regclass('public.nq_materiais_enriquecidos') is null then
    raise exception 'Fontes de critérios não localizadas. Execute no projeto Supabase do painel.';
  end if;

  -- Índices somente em tabelas/views materializadas. Uma view comum não aceita índice.
  v_rel := 'public.monday_subelementos_validacao'::regclass;
  select relkind into v_kind from pg_class where oid=v_rel;
  if v_kind in ('r','p','m') then
    execute 'create index if not exists nq_ua_subelementos_criterios_pagina_idx
      on public.monday_subelementos_validacao (monday_item_id)
      where criterio is not null and btrim(criterio) <> ''''';
    execute 'analyze public.monday_subelementos_validacao';
  end if;
  v_rel := 'public.nq_materiais_enriquecidos'::regclass;
  select relkind into v_kind from pg_class where oid=v_rel;
  if v_kind in ('r','p','m') then
    execute 'create index if not exists nq_ua_materiais_parent_idx
      on public.nq_materiais_enriquecidos (parent_item_id)';
    execute 'analyze public.nq_materiais_enriquecidos';
  else
    raise notice 'nq_materiais_enriquecidos é uma view comum: nenhum índice foi criado nela.';
  end if;
end;
$$;

create or replace function public.nq_criterios_pagina(
  p_offset integer default 0,
  p_limite integer default 200
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  -- Usa a política atual, inclusive a troca de senha temporária do SQL 09.
  if not coalesce(public.nq_painel_acesso_institucional(),false) then
    raise exception 'Acesso institucional necessário.' using errcode='42501';
  end if;
  if p_offset is null or p_offset < 0 or p_limite is null or p_limite < 1 or p_limite > 500 then
    raise exception 'Paginação inválida. Use offset não negativo e limite de 1 a 500.' using errcode='22023';
  end if;

  -- O limite é aplicado aos subelementos ANTES da junção. O indicador tem_mais
  -- depende desses subelementos, não da quantidade de linhas após o LEFT JOIN.
  -- Assim, vários materiais do mesmo parent não causam cortes ou repetição de lotes.
  with candidatos as materialized (
    select s.monday_item_id as subitem_id,s.parent_item_id,s.name as pergunta,
      s.criterio,s.classificacao_especialista,s.parecer_especialista,
      s.classificacao_feita_por,s.data_classificacao_especialista,s.apontamos_inconformidade
    from public.monday_subelementos_validacao s
    where s.criterio is not null and btrim(s.criterio) <> ''
    order by s.monday_item_id,s.parent_item_id,s.name,s.criterio,
      s.classificacao_especialista,s.parecer_especialista,s.classificacao_feita_por,
      s.data_classificacao_especialista,s.apontamos_inconformidade
    limit (p_limite + 1) offset p_offset
  ), pagina as materialized (
    select * from candidatos
    order by subitem_id,parent_item_id,pergunta,criterio,
      classificacao_especialista,parecer_especialista,classificacao_feita_por,
      data_classificacao_especialista,apontamos_inconformidade
    limit p_limite
  ), registros as (
    select s.subitem_id,s.parent_item_id,m.matriz_oferta,m.id_ua,m.titulo_ua,
      s.pergunta,s.criterio,s.classificacao_especialista,s.parecer_especialista,
      s.classificacao_feita_por,s.data_classificacao_especialista,s.apontamos_inconformidade,
      m.esteira_producao,m.categoria_material,m.revisor_validador,
      case when btrim(s.classificacao_especialista) in ('Sim','Não') then true else false end as entra_no_calculo,
      m.bloco,m.status_validacao,m.gestor_validacao_nq
    from pagina s
    left join public.nq_materiais_enriquecidos m on m.parent_item_id=s.parent_item_id
  )
  select jsonb_build_object(
    'versao',1,
    'registros',coalesce((select jsonb_agg(to_jsonb(r)) from registros r),'[]'::jsonb),
    'lidos',(select count(*) from pagina),
    'proximo_offset',p_offset+(select count(*) from pagina),
    'tem_mais',(select count(*) from candidatos)>p_limite
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.nq_criterios_pagina(integer,integer) from public,anon;
grant execute on function public.nq_criterios_pagina(integer,integer) to authenticated;
notify pgrst,'reload schema';
commit;

select 'V6.6.1: leitura paginada instalada. Atualize também os arquivos da página.' as resultado;
