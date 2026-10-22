-- Correção do NQ_PEOPLE_CURSOR na V6.6.11 · 22/10/2026.
-- Execute este arquivo inteiro no SQL Editor do projeto Supabase atual.
-- A página V6.6.11 já instalada continua compatível. Depois clique em Atualizar dados.
-- O cursor passa a ordenar as colunas numéricas da página, não seus aliases de texto.
-- Preserva os dados, índices, especialistas cadastrados e política de acesso existentes.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
do $$
begin
  if to_regprocedure('public.nq_painel_responsaveis_pagina(text,text,integer)') is null then
    raise exception 'Instale primeiro o SQL 14 da V6.6.11. A função paginada ainda não existe neste projeto.';
  end if;
end;
$$;

create or replace function public.nq_painel_responsaveis_pagina(
  p_apos_board text default '0',p_apos_item text default '0',p_limite integer default 500
) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_board bigint;v_item bigint;v_result jsonb;
begin
  if auth.uid() is null or not coalesce(public.nq_painel_acesso_institucional(),false) then
    raise exception 'Acesso institucional necessário.' using errcode='42501';
  end if;
  if p_apos_board is null or p_apos_board !~ '^[0-9]{1,19}$'
     or p_apos_item is null or p_apos_item !~ '^[0-9]{1,19}$'
     or p_limite is null or p_limite not between 1 and 500 then
    raise exception 'Cursor inválido ou limite fora do intervalo de 1 a 500.' using errcode='22023';
  end if;
  v_board:=p_apos_board::bigint;v_item:=p_apos_item::bigint;

  -- Busca indexada por board + item. Não usa OFFSET nem lê JSON da base inteira.
  with candidatos as materialized (
    select * from (
      (select v.monday_board_id as board_id,v.monday_item_id as item_id
       from public.monday_validacao_materiais v where v.monday_board_id=9433297929
         and (v.monday_board_id>v_board or (v.monday_board_id=v_board and v.monday_item_id>v_item))
       order by v.monday_board_id,v.monday_item_id limit (p_limite+1))
      union all
      (select e.monday_board_id,e.monday_item_id
       from public.monday_esteira_producao e where e.monday_board_id=9376982027
         and (e.monday_board_id>v_board or (e.monday_board_id=v_board and e.monday_item_id>v_item))
       order by e.monday_board_id,e.monday_item_id limit (p_limite+1))
    ) c order by board_id,item_id limit (p_limite+1)
  ), pagina as materialized (
    select * from candidatos order by board_id,item_id limit p_limite
  ), itens as materialized (
    select p.board_id,p.item_id,v.id_titulo,v.id_ua,v.tipo_material as categoria_material,
      v.esteira as esteira_producao,nullif(btrim(v.dados_colunas->'color_mkv9gyw4'->>'text'),'') as matriz_oferta,
      v.periodo as semestre_oferta,v.bloco,v.revisor_validador as revisor_direto,
      null::text as especialista_direto,null::jsonb as vinculos_validacao,v.sincronizado_em
    from pagina p join public.monday_validacao_materiais v
      on v.monday_board_id=p.board_id and v.monday_item_id=p.item_id where p.board_id=9433297929
    union all
    select p.board_id,p.item_id,e.id_titulo,e.id_ua,e.categoria_material,e.esteira_producao,
      e.matriz_oferta,e.semestre_oferta,e.bloco,null::text,
      case when lower(btrim(coalesce(e.papel_conteudista,''))) in ('especialista','docente especialista','professor especialista')
        then nullif(btrim(e.docente_conteudista),'') else null end,
      (select cv->'value' from jsonb_array_elements(case
        when jsonb_typeof(e.dados_originais->'column_values')='array' then e.dados_originais->'column_values' else '[]'::jsonb end) cv
        where cv->>'id'='board_relation_mkseetd5' limit 1),e.sincronizado_em
    from pagina p join public.monday_esteira_producao e
      on e.monday_board_id=p.board_id and e.monday_item_id=p.item_id where p.board_id=9376982027
  ), colunas as materialized (
    select c.monday_board_id as board_id,c.monday_item_id as item_id,c.column_id,c.column_title,
      c.column_text as nomes,c.column_value as valor,
      btrim(regexp_replace(translate(lower(coalesce(c.column_title,'')),
        'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc'),'[^a-z0-9]+',' ','g')) as titulo_normalizado
    from pagina p join public.monday_item_colunas c
      on c.monday_board_id=p.board_id and c.monday_item_id=p.item_id
    where c.monday_board_id in (9433297929,9376982027)
      and (c.column_id='multiple_person_mkx6ryhs' or c.column_title ~* '(especial.sta|revis.r)')
  ), pessoas as (
    select c.board_id,c.item_id,c.column_id,c.column_title,c.nomes,c.valor,
      case when c.column_id='multiple_person_mkx6ryhs' and c.board_id=9433297929 then 'revisor'
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
  ), agrupadas as (
    select board_id,item_id,jsonb_agg(jsonb_build_object('papel',papel,'nomes',nomes,'valor',valor,
      'column_id',column_id,'column_title',column_title) order by column_id) as pessoas
    from pessoas where papel is not null group by board_id,item_id
  ), registros as (
    select i.board_id::text as monday_board_id,i.item_id::text as monday_item_id,i.id_titulo,i.id_ua,
      i.categoria_material,i.esteira_producao,i.matriz_oferta,i.semestre_oferta,i.bloco,
      i.vinculos_validacao,i.sincronizado_em,coalesce(a.pessoas,'[]'::jsonb) as pessoas
    from itens i left join agrupadas a on a.board_id=i.board_id and a.item_id=i.item_id
  )
  select jsonb_build_object('versao',1,
    'registros',coalesce((select jsonb_agg(to_jsonb(r) order by r.monday_board_id::bigint,r.monday_item_id::bigint) from registros r),'[]'::jsonb),
    'lidos',(select count(*) from pagina),
    'proximo_board',(select p.board_id::text from pagina p order by p.board_id desc,p.item_id desc limit 1),
    'proximo_item',(select p.item_id::text from pagina p order by p.board_id desc,p.item_id desc limit 1),
    'tem_mais',(select count(*) from candidatos)>p_limite
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.nq_painel_responsaveis_pagina(text,text,integer) from public,anon;
grant execute on function public.nq_painel_responsaveis_pagina(text,text,integer) to authenticated;


notify pgrst,'reload schema';
commit;
select 'Cursor de responsáveis corrigido. Volte ao site e clique em Atualizar dados.' as resultado;
