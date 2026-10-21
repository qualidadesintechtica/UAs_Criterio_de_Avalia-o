-- V6.6.4 · Download da planilha pelo ID exato do Plano de Produção.
-- Execute depois dos scripts já instalados. Não modifica dados, views anteriores ou comentários.
begin;
do $$
begin
  if to_regclass('public.monday_validacao_materiais') is null
     or to_regprocedure('public.nq_painel_acesso_institucional()') is null then
    raise exception 'Instale primeiro as fontes e a autorização institucional do painel.';
  end if;
end;
$$;

-- Uma linha por item de validação. A seleção da coluna é verificada novamente
-- no serviço de download. Não entrega o JSON completo do item ou outros dados.
create or replace view public.vw_ua_planilhas_links_autenticados
with (security_barrier=true) as
select v.monday_item_id as monday_item_validacao,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',c.key,'title',c.value->>'title','type',c.value->>'type',
      'text',c.value->>'text','value',c.value->'value') order by c.key)
    from jsonb_each(case when jsonb_typeof(v.dados_colunas)='object'
      then v.dados_colunas else '{}'::jsonb end) c
    where c.value->>'type' in ('link','file')
       or (translate(lower(coalesce(c.value->>'title','')),
           'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc') like '%planilha%'
           and translate(lower(coalesce(c.value->>'title','')),
           'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc') like '%entrada%')
  ),'[]'::jsonb) as colunas_planilha,
  v.sincronizado_em
from public.monday_validacao_materiais v
where (select public.nq_painel_acesso_institucional())
  and v.monday_board_id=9433297929
  and regexp_replace(translate(lower(btrim(coalesce(v.tipo_material,''))),
    'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc'),'\s+',' ','g')='plano de producao';

revoke all on public.vw_ua_planilhas_links_autenticados from public,anon;
grant select on public.vw_ua_planilhas_links_autenticados to authenticated;
notify pgrst,'reload schema';
commit;
select 'V6.6.4: fonte dos links de planilhas instalada' as resultado;
