-- V6.6.7: nomes do filtro obtidos somente dos participantes Especialistas.
-- Execute completo no mesmo projeto Supabase do Acompanhamento da Qualidade.
begin;
do $$
begin
  if to_regclass('nq_acessos_privado.perfis') is null
     or to_regprocedure('public.nq_painel_acesso_institucional()') is null then
    raise exception 'Instale primeiro o SQL 09 de usuários e acessos.';
  end if;
end;
$$;
create or replace function public.nq_painel_listar_especialistas(
  p_offset integer default 0, p_limite integer default 200
)
returns table(user_id uuid, nome text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not coalesce(public.nq_painel_acesso_institucional(),false) then
    raise exception 'Acesso institucional necessário.' using errcode='42501';
  end if;
  if p_offset is null or p_offset<0 or p_limite is null or p_limite not between 1 and 200 then
    raise exception 'Paginação inválida.' using errcode='22023';
  end if;
  return query
  select u.id, btrim(regexp_replace(coalesce(
    nullif(btrim(u.raw_user_meta_data->>'nome'),''),
    nullif(btrim(u.raw_user_meta_data->>'full_name'),''),
    nullif(btrim(u.raw_user_meta_data->>'display_name'),''),''), '[[:space:]]+', ' ', 'g'))
  from auth.users u
  join nq_acessos_privado.perfis p on p.user_id=u.id and p.perfil='especialista'
  where u.deleted_at is null
    and lower(btrim(coalesce(u.email,''))) ~ '^[^@[:space:]]+@(animaeducacao[.]com[.]br|ulife[.]com[.]br)$'
    and coalesce(nullif(btrim(u.raw_user_meta_data->>'nome'),''),
      nullif(btrim(u.raw_user_meta_data->>'full_name'),''),
      nullif(btrim(u.raw_user_meta_data->>'display_name'),'')) is not null
  order by u.id
  limit p_limite offset p_offset;
end;
$$;
revoke all on function public.nq_painel_listar_especialistas(integer,integer) from public, anon;
grant execute on function public.nq_painel_listar_especialistas(integer,integer) to authenticated;
commit;
select 'V6.6.7: filtro de especialistas cadastrados instalado.' as resultado;
