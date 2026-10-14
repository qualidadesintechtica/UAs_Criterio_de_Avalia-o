-- Resultados das UAs · preparação para GitHub Pages
-- Execute no SQL Editor do MESMO projeto Supabase utilizado pelo BI.
-- Somente permissões de leitura e views: não altera os dados das avaliações.
-- A publicação do GitHub Pages deve ocorrer após a conclusão deste script.

begin;

do $$
begin
  if to_regclass('public.vw_nq_reuniao_criterios_detalhe') is null then
    raise exception 'A fonte public.vw_nq_reuniao_criterios_detalhe não existe neste projeto.';
  end if;
  if to_regclass('public.vw_materiais_bi_consolidada') is null then
    raise exception 'A fonte public.vw_materiais_bi_consolidada não existe neste projeto.';
  end if;
end;
$$;

-- A verificação do domínio acontece no banco, com o JWT validado pelo Supabase.
create or replace view public.vw_ua_resultados_criterios_autenticados
with (security_barrier = true)
as
select
  subitem_id, parent_item_id, matriz_oferta, id_ua, titulo_ua,
  pergunta, criterio, classificacao_especialista, parecer_especialista,
  classificacao_feita_por, data_classificacao_especialista,
  apontamos_inconformidade, esteira_producao, categoria_material,
  revisor_validador, entra_no_calculo
from public.vw_nq_reuniao_criterios_detalhe
where (select auth.uid()) is not null
  and lower(split_part(coalesce((select auth.jwt()) ->> 'email', ''), '@', 2))
      = 'animaeducacao.com.br';

create or replace view public.vw_ua_resultados_materiais_autenticados
with (security_barrier = true)
as
select
  chave_material, monday_item_validacao, id_titulo, id_ua,
  titulo, titulo_ua, item_name, esteira_producao, matriz_oferta,
  semestre_oferta, categoria_material, eh_ua, revisor_validador
from public.vw_materiais_bi_consolidada
where (select auth.uid()) is not null
  and lower(split_part(coalesce((select auth.jwt()) ->> 'email', ''), '@', 2))
      = 'animaeducacao.com.br';

revoke all on public.vw_ua_resultados_criterios_autenticados,
              public.vw_ua_resultados_materiais_autenticados
from public, anon;
grant select on public.vw_ua_resultados_criterios_autenticados,
                public.vw_ua_resultados_materiais_autenticados
to authenticated;

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

-- Verifica, dentro da transação, que os endpoints do painel não dão SELECT ao anon.
do $$
declare
  nome text;
begin
  foreach nome in array array[
    'public.vw_ua_resultados_criterios_autenticados',
    'public.vw_ua_resultados_materiais_autenticados',
    'public.vw_nq_reuniao_criterios_detalhe',
    'public.vw_materiais_bi_consolidada'
  ]
  loop
    if has_table_privilege('anon', nome, 'SELECT') then
      raise exception 'O papel anon ainda consegue consultar %. Nenhuma alteração foi confirmada.', nome;
    end if;
  end loop;
end;
$$;

commit;

select
  'Proteção de consultas diretas instalada. Entre com a conta institucional.' as resultado,
  has_table_privilege('anon', 'public.vw_ua_resultados_criterios_autenticados', 'SELECT') as anon_pode_ler_criterios,
  has_table_privilege('anon', 'public.vw_ua_resultados_materiais_autenticados', 'SELECT') as anon_pode_ler_materiais,
  has_table_privilege('authenticated', 'public.vw_ua_resultados_criterios_autenticados', 'SELECT') as autenticado_pode_ler_criterios,
  has_table_privilege('authenticated', 'public.vw_ua_resultados_materiais_autenticados', 'SELECT') as autenticado_pode_ler_materiais;

-- Escopo: protege os endpoints e as dependências diretas de dados deste painel.
-- Não modifica RPCs, outras views, buckets ou aplicações não vinculadas a essas fontes.
