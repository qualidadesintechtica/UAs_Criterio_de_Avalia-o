-- V6.6.10 · Responsáveis atribuídos na Monday, separados da autoria de avaliações.
-- Execute completo no mesmo projeto Supabase do painel. Não modifica os dados.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
do $$
begin
  if to_regclass('public.monday_item_colunas') is null
     or to_regclass('public.monday_validacao_materiais') is null
     or to_regclass('public.monday_esteira_producao') is null
     or to_regclass('nq_acessos_privado.perfis') is null
     or to_regprocedure('public.nq_painel_acesso_institucional()') is null then
    raise exception 'Execute no projeto do BI com as fontes Monday e o SQL 09 de acessos instalados.';
  end if;
end;
$$;

-- Índice parcial evita varrer todas as colunas da Monday a cada lote de pessoas.
do $$
begin
  if exists(select 1 from pg_class where oid='public.monday_item_colunas'::regclass and relkind in ('r','p','m')) then
    execute 'create index if not exists nq_painel_responsaveis_colunas_idx
      on public.monday_item_colunas(monday_board_id,monday_item_id,column_id)
      where monday_board_id in (9433297929,9376982027)
        and (column_id=''multiple_person_mkx6ryhs'' or column_title ~* ''(especial.sta|revis.r)'')';
  end if;
end;
$$;

create or replace view public.vw_ua_responsaveis_monday_autenticados
with (security_barrier=true) as
with itens as materialized (
  select v.monday_board_id as board_id,v.monday_item_id as item_id,
    v.id_titulo,v.id_ua,v.tipo_material as categoria_material,v.esteira as esteira_producao,
    nullif(btrim(v.dados_colunas->'color_mkv9gyw4'->>'text'),'') as matriz_oferta,
    v.periodo as semestre_oferta,v.bloco,v.revisor_validador as revisor_direto,
    null::text as especialista_direto,null::jsonb as vinculos_validacao,v.sincronizado_em
  from public.monday_validacao_materiais v where v.monday_board_id=9433297929
  union all
  select e.monday_board_id,e.monday_item_id,e.id_titulo,e.id_ua,e.categoria_material,
    e.esteira_producao,e.matriz_oferta,e.semestre_oferta,e.bloco,null::text,
    case when lower(btrim(coalesce(e.papel_conteudista,''))) in ('especialista','docente especialista','professor especialista')
      then nullif(btrim(e.docente_conteudista),'') else null end,
    (select cv->'value' from jsonb_array_elements(case
      when jsonb_typeof(e.dados_originais->'column_values')='array' then e.dados_originais->'column_values' else '[]'::jsonb end) cv
      where cv->>'id'='board_relation_mkseetd5' limit 1),e.sincronizado_em
  from public.monday_esteira_producao e where e.monday_board_id=9376982027
), colunas as materialized (
  select c.*,btrim(regexp_replace(translate(lower(coalesce(c.column_title,'')),
    'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc'),'[^a-z0-9]+',' ','g')) as titulo_normalizado
  from public.monday_item_colunas c where c.monday_board_id in (9433297929,9376982027)
    and (c.column_id='multiple_person_mkx6ryhs' or c.column_title ~* '(especial.sta|revis.r)')
), pessoas as (
  select c.monday_board_id as board_id,c.monday_item_id as item_id,c.column_id,c.column_title,
    c.column_text as nomes,to_jsonb(c)->'column_value' as valor,
    case when c.column_id='multiple_person_mkx6ryhs' and c.monday_board_id=9433297929 then 'revisor'
      when c.titulo_normalizado ~ '\mrevis(or|ores)\M' and c.titulo_normalizado !~ '\mespecialistas?\M' then 'revisor'
      when c.titulo_normalizado ~ '\mespecialistas?\M' and c.titulo_normalizado !~ '\mrevis(or|ores)\M' then 'especialista' end as papel
  from colunas c
  where c.titulo_normalizado !~ '\m(email|e mail|parecer|pareceres|comentario|comentarios|classificacao|status|data|prazo|cronograma|id)\M'
  union all
  select i.board_id,i.item_id,'direto:revisor_validador','Revisor Validador',i.revisor_direto,null::jsonb,'revisor'
    from itens i where nullif(btrim(i.revisor_direto),'') is not null
  union all
  select i.board_id,i.item_id,'direto:docente_especialista','Docente Especialista',i.especialista_direto,null::jsonb,'especialista'
    from itens i where i.especialista_direto is not null
)
select i.board_id::text||':'||i.item_id::text||':'||p.column_id as fonte_chave,
  i.board_id::text as monday_board_id,i.item_id::text as monday_item_id,
  i.id_titulo,i.id_ua,i.categoria_material,i.esteira_producao,i.matriz_oferta,i.semestre_oferta,i.bloco,
  p.papel,p.column_id,p.column_title,p.nomes,p.valor,i.vinculos_validacao,i.sincronizado_em
from itens i join pessoas p on p.board_id=i.board_id and p.item_id=i.item_id
where p.papel is not null and (select public.nq_painel_acesso_institucional());
revoke all on public.vw_ua_responsaveis_monday_autenticados from public,anon;
grant select on public.vw_ua_responsaveis_monday_autenticados to authenticated;

-- Instala também o contrato da lista de Especialistas usado desde a V6.6.7.
create or replace function public.nq_painel_listar_especialistas(p_offset integer default 0,p_limite integer default 200)
returns table(user_id uuid,nome text)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null or not coalesce(public.nq_painel_acesso_institucional(),false) then
    raise exception 'Acesso institucional necessário.' using errcode='42501';
  end if;
  if p_offset is null or p_offset<0 or p_limite is null or p_limite not between 1 and 200 then
    raise exception 'Paginação inválida.' using errcode='22023';
  end if;
  return query select u.id,btrim(regexp_replace(coalesce(nullif(btrim(u.raw_user_meta_data->>'nome'),''),
    nullif(btrim(u.raw_user_meta_data->>'full_name'),''),nullif(btrim(u.raw_user_meta_data->>'display_name'),''),''),'[[:space:]]+',' ','g'))
  from auth.users u join nq_acessos_privado.perfis p on p.user_id=u.id and p.perfil='especialista'
  where u.deleted_at is null and lower(btrim(coalesce(u.email,''))) ~ '^[^@[:space:]]+@(animaeducacao[.]com[.]br|ulife[.]com[.]br)$'
    and coalesce(nullif(btrim(u.raw_user_meta_data->>'nome'),''),nullif(btrim(u.raw_user_meta_data->>'full_name'),''),
      nullif(btrim(u.raw_user_meta_data->>'display_name'),'')) is not null
  order by u.id limit p_limite offset p_offset;
end;
$$;
revoke all on function public.nq_painel_listar_especialistas(integer,integer) from public,anon;
grant execute on function public.nq_painel_listar_especialistas(integer,integer) to authenticated;
notify pgrst,'reload schema';
commit;
select 'V6.6.10: responsáveis da Monday e lista de especialistas instalados.' as resultado;
