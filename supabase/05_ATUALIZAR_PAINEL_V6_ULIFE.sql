-- V6 · 16/10/2026 · atualização única do painel.
-- Libera @animaeducacao.com.br e @ulife.com.br nas consultas e nos comentários.
-- Inclui lote/status e instala a estrutura de comentários se ainda estiver ausente.
-- Preserva os comentários, as versões existentes e a sincronização da Monday.
-- Execute no SQL Editor do mesmo projeto Supabase do BI.
begin;
do $$
begin
  if to_regclass('public.vw_nq_reuniao_criterios_detalhe') is null
     or to_regclass('public.vw_materiais_bi_consolidada') is null
     or to_regclass('public.monday_criterios_avaliacao_uas') is null
     or to_regclass('public.monday_criterios_pareceres') is null then
    raise exception 'As fontes da Monday/BI não foram localizadas neste projeto.';
  end if;
end;
$$;

-- Regra única compartilhada pelas views, pelas políticas de leitura e pela gravação.
-- SECURITY INVOKER: esta função não eleva permissões.
create or replace function public.nq_painel_acesso_institucional()
returns boolean language sql stable security invoker set search_path = '' as $$
  select auth.uid() is not null
    and lower(btrim(coalesce(auth.jwt()->>'email',''))) ~
      '^[^@[:space:]]+@(animaeducacao[.]com[.]br|ulife[.]com[.]br)$';
$$;
revoke all on function public.nq_painel_acesso_institucional() from public,anon,authenticated;
grant execute on function public.nq_painel_acesso_institucional() to authenticated;

create table if not exists public.nq_comentarios (
  id uuid primary key default gen_random_uuid(),
  source_key text not null check (length(source_key) between 1 and 240),
  mode text not null check (mode in ('source','addition')),
  body text not null check (length(btrim(body)) between 1 and 10000),
  revision integer not null check (revision >= 1),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_by uuid not null,
  updated_email text not null,
  updated_name text not null,
  updated_at timestamptz not null default now()
);
create unique index if not exists nq_comentarios_one_source
  on public.nq_comentarios(source_key) where mode='source';
create index if not exists nq_comentarios_source on public.nq_comentarios(source_key);

create table if not exists public.nq_comentarios_historico (
  comment_id uuid not null references public.nq_comentarios(id),
  revision integer not null check (revision >= 0),
  body text not null,
  origin text not null check (origin in ('Monday','Painel')),
  author_id uuid,
  author_email text,
  author_name text,
  recorded_at timestamptz not null default now(),
  source_date text,
  primary key (comment_id,revision)
);

alter table public.nq_comentarios enable row level security;
alter table public.nq_comentarios_historico enable row level security;
revoke all on public.nq_comentarios,public.nq_comentarios_historico from public,anon,authenticated;
grant select on public.nq_comentarios,public.nq_comentarios_historico to authenticated;


drop policy if exists nq_comentarios_read on public.nq_comentarios;
create policy nq_comentarios_read on public.nq_comentarios for select to authenticated
using ((select public.nq_painel_acesso_institucional()));
drop policy if exists nq_comentarios_historico_read on public.nq_comentarios_historico;
create policy nq_comentarios_historico_read on public.nq_comentarios_historico for select to authenticated
using ((select public.nq_painel_acesso_institucional()));

create or replace view public.vw_ua_resultados_materiais_autenticados
with (security_barrier = true) as
select chave_material, monday_item_validacao, id_titulo, id_ua,
  titulo, titulo_ua, item_name, esteira_producao, matriz_oferta,
  semestre_oferta, categoria_material, eh_ua, revisor_validador,
  status_validacao, sincronizado_esteira, sincronizado_validacao, bloco
from public.vw_materiais_bi_consolidada
where (select public.nq_painel_acesso_institucional());

create or replace view public.vw_ua_resultados_criterios_autenticados
with (security_barrier = true) as
select subitem_id, parent_item_id, matriz_oferta, id_ua, titulo_ua,
  pergunta, criterio, classificacao_especialista, parecer_especialista,
  classificacao_feita_por, data_classificacao_especialista,
  apontamos_inconformidade, esteira_producao, categoria_material,
  revisor_validador, entra_no_calculo, bloco, status_validacao
from public.vw_nq_reuniao_criterios_detalhe
where (select public.nq_painel_acesso_institucional());

revoke all on public.vw_ua_resultados_materiais_autenticados,
  public.vw_ua_resultados_criterios_autenticados from public,anon;
grant select on public.vw_ua_resultados_materiais_autenticados,
  public.vw_ua_resultados_criterios_autenticados to authenticated;

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
where (select public.nq_painel_acesso_institucional());

create or replace view public.vw_materiais_monday_pareceres_autenticados
with (security_barrier = true)
as
select
  id, monday_item_id, nome_item, avaliador, categoria_material,
  matriz_oferta, numero_criterio, criterio_id, criterio_titulo,
  parecer_id, parecer_titulo, parecer, tipo_formulario,
  data_avaliacao, data_avaliacao_hora, updated_at, synced_at
from public.monday_criterios_pareceres
where (select public.nq_painel_acesso_institucional());


revoke all on public.vw_materiais_monday_avaliacoes_autenticadas,
  public.vw_materiais_monday_pareceres_autenticados from public,anon;
grant select on public.vw_materiais_monday_avaliacoes_autenticadas,
  public.vw_materiais_monday_pareceres_autenticados to authenticated;

create or replace function public.nq_salvar_comentario(
  p_source_key text,
  p_body text,
  p_comment_id uuid default null,
  p_expected_revision integer default 0,
  p_mode text default 'source',
  p_expected_source_body text default null
) returns setof public.nq_comentarios
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(auth.jwt()->>'email');
  v_name text;
  v_body text := btrim(p_body);
  v_current public.nq_comentarios%rowtype;
  v_source jsonb;
  v_source_body text := '';
  v_source_author text;
  v_source_date text;
  v_type text := split_part(p_source_key,':',1);
  v_source_id text := split_part(p_source_key,':',2);
  v_slot text := split_part(p_source_key,':',3);
  v_time timestamptz := clock_timestamp();
begin
  if not public.nq_painel_acesso_institucional() then
    raise exception 'NQ_ACCESS_DENIED' using errcode='42501';
  end if;
  if p_mode is null or p_mode not in ('source','addition') or p_source_key is null
    or length(p_source_key)>240 or p_expected_revision is null or p_expected_revision<0
    or v_body is null or length(v_body) not between 1 and 10000 then
    raise exception 'NQ_INVALID_COMMENT' using errcode='22023';
  end if;
  -- O nome e o e-mail vêm da sessão validada, nunca de campos enviados pelo navegador.
  v_name := coalesce(nullif(auth.jwt()->'user_metadata'->>'nome',''),
    nullif(auth.jwt()->'user_metadata'->>'full_name',''),v_email);

  if v_type='material' then
    select to_jsonb(s) into v_source from public.vw_ua_resultados_materiais_autenticados s
      where s.chave_material::text=substr(p_source_key,10) limit 1;
  elsif v_type='criterio' and p_source_key=('criterio:'||v_source_id) then
    select to_jsonb(s) into v_source from public.vw_ua_resultados_criterios_autenticados s
      where s.subitem_id::text=v_source_id limit 1;
    v_source_body := coalesce(btrim(v_source->>'parecer_especialista'),'');
    v_source_author := v_source->>'classificacao_feita_por';
    v_source_date := v_source->>'data_classificacao_especialista';
  elsif v_type='parecer' and p_source_key=('parecer:'||v_source_id) then
    select to_jsonb(s) into v_source from public.vw_materiais_monday_pareceres_autenticados s
      where s.id::text=v_source_id limit 1;
    v_source_body := coalesce(btrim(v_source->>'parecer'),'');
    v_source_author := v_source->>'avaliador';
    v_source_date := coalesce(v_source->>'data_avaliacao_hora',v_source->>'data_avaliacao');
  elsif v_type='avaliacao' and p_source_key=('avaliacao:'||v_source_id||':'||v_slot)
    and v_slot ~ '^(I[1-7]|metadata)$' then
    select to_jsonb(s) into v_source from public.vw_materiais_monday_avaliacoes_autenticadas s
      where s.monday_item_id::text=v_source_id limit 1;
    v_source_author := v_source->>'avaliador';
    v_source_date := coalesce(v_source->>'data_avaliacao_hora',v_source->>'data_avaliacao');
  end if;
  if v_source is null then raise exception 'NQ_SOURCE_NOT_FOUND'; end if;

  -- Serializa a primeira edição e também protege adições repetidas por falha de rede.
  perform pg_advisory_xact_lock(hashtextextended(
    case when p_mode='source' then p_source_key else coalesce(p_comment_id::text,p_source_key) end,0));
  if p_mode='source' then
    select * into v_current from public.nq_comentarios c
      where c.source_key=p_source_key and c.mode='source' for update;
  elsif p_comment_id is not null then
    select * into v_current from public.nq_comentarios c where c.id=p_comment_id for update;
  end if;

  if v_current.id is not null then
    if v_current.source_key<>p_source_key or v_current.mode<>p_mode
      or (p_comment_id is not null and v_current.id<>p_comment_id) then
      raise exception 'NQ_COMMENT_CONFLICT';
    end if;
    -- Retorno idempotente se a resposta anterior se perdeu depois do COMMIT.
    if v_current.revision=p_expected_revision+1 and v_current.body=v_body and v_current.updated_by=v_user then
      return next v_current; return;
    end if;
    if v_current.revision<>p_expected_revision then raise exception 'NQ_COMMENT_CONFLICT'; end if;
    if v_current.body=v_body then return next v_current; return; end if;
    update public.nq_comentarios c set body=v_body,revision=c.revision+1,
      updated_by=v_user,updated_email=v_email,updated_name=v_name,updated_at=v_time
      where c.id=v_current.id returning * into v_current;
  else
    if p_expected_revision<>0 then raise exception 'NQ_COMMENT_CONFLICT'; end if;
    if p_mode='source' and (p_expected_source_body is null or v_source_body<>btrim(p_expected_source_body)) then
      raise exception 'NQ_SOURCE_CHANGED';
    end if;
    insert into public.nq_comentarios(id,source_key,mode,body,revision,created_by,created_at,
      updated_by,updated_email,updated_name,updated_at)
      values(coalesce(p_comment_id,gen_random_uuid()),p_source_key,p_mode,v_body,1,v_user,v_time,
        v_user,v_email,v_name,v_time) returning * into v_current;
    if p_mode='source' then
      insert into public.nq_comentarios_historico(comment_id,revision,body,origin,author_name,recorded_at,source_date)
        values(v_current.id,0,v_source_body,'Monday',v_source_author,v_time,v_source_date);
    end if;
  end if;
  insert into public.nq_comentarios_historico(comment_id,revision,body,origin,author_id,author_email,author_name,recorded_at)
    values(v_current.id,v_current.revision,v_current.body,'Painel',v_user,v_email,v_name,v_time);
  return next v_current;
end;
$$;
revoke all on function public.nq_salvar_comentario(text,text,uuid,integer,text,text) from public,anon,authenticated;
grant execute on function public.nq_salvar_comentario(text,text,uuid,integer,text,text) to authenticated;
-- Impede a consulta anônima direta às fontes originais e às relações públicas
-- das quais elas dependem. Mantém o SELECT efetivo de authenticated que já existia.
-- Isso preserva o uso dessas fontes pelo BI após o login.
do $$
declare
  r record;
  tinha_acesso_autenticado boolean;
begin
  for r in
    with recursive relacoes(oid) as (
      select c.oid
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in ('vw_nq_reuniao_criterios_detalhe', 'vw_materiais_bi_consolidada')
      union
      select dep.refobjid
      from relacoes base
      join pg_rewrite rw on rw.ev_class = base.oid
      join pg_depend dep on dep.objid = rw.oid
        and dep.classid = 'pg_rewrite'::regclass
        and dep.refclassid = 'pg_class'::regclass
      join pg_class fonte on fonte.oid = dep.refobjid
      where dep.refobjid <> base.oid
        and fonte.relkind in ('r', 'p', 'v', 'm', 'f')
    )
    select distinct c.oid, n.nspname, c.relname
    from relacoes
    join pg_class c on c.oid = relacoes.oid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
  loop
    tinha_acesso_autenticado := has_table_privilege('authenticated', r.oid, 'SELECT');
    execute format('revoke select on table %I.%I from anon, public', r.nspname, r.relname);
    if tinha_acesso_autenticado then
      execute format('grant select on table %I.%I to authenticated', r.nspname, r.relname);
    end if;
  end loop;
end;
$$;

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

notify pgrst,'reload schema';
commit;

select 'V6 instalada: domínios Ânima e Ulife, lote, status e histórico preservado.' as resultado;
