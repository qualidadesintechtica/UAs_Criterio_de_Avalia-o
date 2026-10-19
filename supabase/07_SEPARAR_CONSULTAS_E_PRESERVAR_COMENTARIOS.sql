-- V6.3.1 · 19/10/2026 · consultas independentes dos Planos e dos demais materiais.
-- Execute depois do SQL 05. Funciona com ou sem o SQL 06 anterior.
-- Preserva IDs, comentários e histórico. Não execute SQL antigo depois do 07.
begin;
do $$
begin
  if to_regclass('public.monday_validacao_materiais') is null
     or to_regclass('public.vw_materiais_bi_consolidada') is null
     or to_regprocedure('public.nq_painel_acesso_institucional()') is null
     or to_regprocedure('public.nq_salvar_comentario(text,text,uuid,integer,text,text)') is null then
    raise exception 'Execute primeiro o SQL 05 deste pacote no projeto do BI.';
  end if;
end;
$$;

-- Restaura a consulta de materiais sem JOIN/CTE adicional com os planos.
-- Mantém o campo final da V6.3 para compatibilidade com a estrutura instalada.
create or replace view public.vw_ua_resultados_materiais_autenticados
with (security_barrier=true) as
select
  chave_material,
  monday_item_validacao,
  id_titulo,
  id_ua,
  titulo,
  titulo_ua,
  item_name,
  esteira_producao,
  matriz_oferta,
  semestre_oferta,
  categoria_material,
  eh_ua,
  revisor_validador,
  status_validacao,
  sincronizado_esteira,
  sincronizado_validacao,
  bloco,
  'consolidada'::text as origem_material
from public.vw_materiais_bi_consolidada
where (select public.nq_painel_acesso_institucional());

-- Consulta específica: somente a tabela sincronizada de validações.
-- Não usa a base consolidada, conversão da linha inteira para JSON ou anti-JOIN.
create or replace view public.vw_ua_resultados_planilhas_validacao_autenticadas
with (security_barrier=true) as
select
  'VALIDACAO_PP_'||v.monday_item_id::text as chave_material,
  v.monday_item_id as monday_item_validacao,
  v.id_titulo,v.id_ua,v.titulo,null::text as titulo_ua,v.name as item_name,
  v.esteira as esteira_producao,
  nullif(btrim(v.dados_colunas->'color_mkv9gyw4'->>'text'),'') as matriz_oferta,
  v.periodo as semestre_oferta,'Plano de Produção'::text as categoria_material,
  false as eh_ua,v.revisor_validador,v.status_validacao,
  null::timestamptz as sincronizado_esteira,v.sincronizado_em as sincronizado_validacao,
  v.bloco,'validacao_planos'::text as origem_material
from public.monday_validacao_materiais v
where (select public.nq_painel_acesso_institucional())
  and regexp_replace(translate(lower(btrim(coalesce(v.tipo_material,''))),
    'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc'),'\s+',' ','g')='plano de producao';

revoke all on public.vw_ua_resultados_materiais_autenticados,
  public.vw_ua_resultados_planilhas_validacao_autenticadas from public,anon;
grant select on public.vw_ua_resultados_materiais_autenticados,
  public.vw_ua_resultados_planilhas_validacao_autenticadas to authenticated;

-- Mesmo contrato de gravação; só acrescenta a localização dos planos na nova view.
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
    if v_source is null then
      select to_jsonb(s) into v_source from public.vw_ua_resultados_planilhas_validacao_autenticadas s
        where s.chave_material::text=substr(p_source_key,10) limit 1;
    end if;
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

notify pgrst,'reload schema';
commit;
select 'V6.3.1 instalada: consulta dos planos separada e comentários preservados.' as resultado,
  count(distinct monday_item_id) as planos_sincronizados
from public.monday_validacao_materiais
where regexp_replace(translate(lower(btrim(coalesce(tipo_material,''))),
  'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc'),'\s+',' ','g')='plano de producao';
