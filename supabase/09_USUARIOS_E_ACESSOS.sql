-- V6.6 · Acompanhamento da Qualidade · 21/10/2026
-- Execute COMPLETO no mesmo projeto Supabase do painel/BI.
-- Preserva avaliações, comentários, históricos e regras das outras aplicações.
begin;
do $$
begin
  if to_regprocedure('public.nq_painel_acesso_institucional()') is null then
    raise exception 'Instale primeiro o SQL 05 do painel.';
  end if;
end;
$$;

create schema if not exists nq_acessos_privado;
revoke all on schema nq_acessos_privado from public, anon, authenticated;
create table if not exists nq_acessos_privado.gestores (
  email text primary key check (email = lower(btrim(email))),
  ativo boolean not null default true
);
insert into nq_acessos_privado.gestores(email, ativo) values
 ('ligia.neta@animaeducacao.com.br', true),
 ('joao.cane@animaeducacao.com.br', true),
 ('cristina.brito@animaeducacao.com.br', true)
on conflict(email) do update set ativo = true;

create table if not exists nq_acessos_privado.perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  perfil text not null default 'revisor' check (perfil in ('especialista','revisor','admin'))
);
insert into nq_acessos_privado.perfis(user_id,perfil)
select u.id, case when exists (select 1 from nq_acessos_privado.gestores g
                               where g.email=lower(btrim(u.email)) and g.ativo) then 'admin'
  when u.raw_user_meta_data->>'perfil_solicitado'='especialista' then 'especialista'
  else 'revisor' end
from auth.users u
where lower(coalesce(u.email,'')) ~ '^[^@[:space:]]+@(animaeducacao[.]com[.]br|ulife[.]com[.]br)$'
on conflict(user_id) do nothing;

-- A escolha pública nunca pode conceder Admin. O perfil fica em tabela privada.
create or replace function nq_acessos_privado.perfil_inicial()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_perfil text;
begin
  if tg_op='UPDATE' then
    if new.email is not distinct from old.email then return new; end if;
  end if;
  v_perfil := case when exists (select 1 from nq_acessos_privado.gestores g
    where g.email=lower(btrim(new.email)) and g.ativo) then 'admin'
    when tg_op='INSERT' and new.raw_user_meta_data->>'perfil_solicitado'='especialista'
      then 'especialista' else 'revisor' end;
  insert into nq_acessos_privado.perfis(user_id,perfil) values(new.id,v_perfil)
  on conflict(user_id) do update set perfil=excluded.perfil;
  return new;
end;
$$;
revoke all on function nq_acessos_privado.perfil_inicial() from public, anon, authenticated;
drop trigger if exists nq_perfil_inicial on auth.users;
create trigger nq_perfil_inicial after insert or update of email on auth.users
for each row execute function nq_acessos_privado.perfil_inicial();

-- Não grava senhas ou hashes: somente a atribuição e a troca real no Auth.
create table if not exists nq_acessos_privado.senhas_temporarias (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pedido_id uuid not null,
  transacao_atribuicao bigint not null,
  atribuida_por uuid not null,
  atribuida_em timestamptz not null default now(),
  alterada_em timestamptz
);
alter table nq_acessos_privado.gestores enable row level security;
alter table nq_acessos_privado.perfis enable row level security;
alter table nq_acessos_privado.senhas_temporarias enable row level security;
revoke all on all tables in schema nq_acessos_privado from public, anon, authenticated;

create or replace function public.nq_senha_temporaria_pendente()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is null or exists (
    select 1 from nq_acessos_privado.senhas_temporarias s
    where s.user_id = auth.uid() and s.alterada_em is null
  );
$$;
revoke all on function public.nq_senha_temporaria_pendente() from public, anon;
grant execute on function public.nq_senha_temporaria_pendente() to authenticated;

-- E-mail atual e confirmado no Auth, nunca nome/metadados/JWT antigo do cliente.
create or replace function nq_acessos_privado.gestor_autorizado(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_user is not null and exists (
    select 1 from auth.users u join nq_acessos_privado.perfis p on p.user_id=u.id and p.perfil='admin'
    join nq_acessos_privado.gestores g
      on g.email = lower(btrim(u.email)) and g.ativo
    where u.id = p_user and u.email_confirmed_at is not null
      and not exists (select 1 from nq_acessos_privado.senhas_temporarias s
                      where s.user_id = u.id and s.alterada_em is null)
  );
$$;
revoke all on function nq_acessos_privado.gestor_autorizado(uuid) from public, anon, authenticated;

create or replace function public.nq_acesso_gestor()
returns boolean language sql stable security definer set search_path = '' as $$
  select nq_acessos_privado.gestor_autorizado(auth.uid());
$$;
revoke all on function public.nq_acesso_gestor() from public, anon;
grant execute on function public.nq_acesso_gestor() to authenticated;

create or replace function public.nq_acesso_estado()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Sessão necessária.' using errcode = '42501';
  end if;
  return jsonb_build_object('versao', 1,
    'perfil', coalesce((select p.perfil from nq_acessos_privado.perfis p where p.user_id=auth.uid()),'revisor'),
    'senha_temporaria', public.nq_senha_temporaria_pendente(),
    'gestor', public.nq_acesso_gestor());
end;
$$;
revoke all on function public.nq_acesso_estado() from public, anon;
grant execute on function public.nq_acesso_estado() to authenticated;

-- Mantém os dois domínios existentes e soma a exigência de troca neste painel.
-- As views do painel e o RPC de comentários já usam esta função.
create or replace function public.nq_painel_acesso_institucional()
returns boolean language sql stable security invoker set search_path = '' as $$
  select auth.uid() is not null
    and lower(btrim(coalesce(auth.jwt()->>'email',''))) ~
      '^[^@[:space:]]+@(animaeducacao[.]com[.]br|ulife[.]com[.]br)$'
    and not public.nq_senha_temporaria_pendente();
$$;
revoke all on function public.nq_painel_acesso_institucional() from public, anon;
grant execute on function public.nq_painel_acesso_institucional() to authenticated;

create or replace function public.nq_acesso_listar_usuarios(
  p_busca text default '', p_offset integer default 0, p_limite integer default 101, p_perfil text default null
)
returns table(user_id uuid, email text, nome text, perfil text, senha_temporaria boolean, confirmado boolean)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.nq_acesso_gestor() then
    raise exception 'Gestão de acessos não autorizada.' using errcode = '42501';
  end if;
  if char_length(coalesce(p_busca,'')) > 200 or coalesce(p_offset,0) < 0 then
    raise exception 'Pesquisa inválida.' using errcode = '22023';
  end if;
  if p_perfil is not null and p_perfil not in ('especialista','revisor','admin') then
    raise exception 'Perfil inválido.' using errcode='22023';
  end if;
  return query select u.id, u.email::text,
    coalesce(nullif(btrim(u.raw_user_meta_data->>'nome'),''),
      nullif(btrim(u.raw_user_meta_data->>'full_name'),''),
      nullif(btrim(u.raw_user_meta_data->>'display_name'),''),''),
    coalesce(p.perfil,'revisor'),
    (s.user_id is not null and s.alterada_em is null), u.email_confirmed_at is not null
  from auth.users u left join nq_acessos_privado.senhas_temporarias s on s.user_id = u.id
  left join nq_acessos_privado.perfis p on p.user_id=u.id
  where lower(btrim(coalesce(u.email,''))) ~
    '^[^@[:space:]]+@(animaeducacao[.]com[.]br|ulife[.]com[.]br)$'
    and (p_perfil is null or coalesce(p.perfil,'revisor')=p_perfil)
    and position(lower(btrim(coalesce(p_busca,''))) in lower(
      coalesce(u.email,'') || ' ' || coalesce(u.raw_user_meta_data->>'nome','') || ' ' ||
      coalesce(u.raw_user_meta_data->>'full_name','') || ' ' ||
      coalesce(u.raw_user_meta_data->>'display_name',''))) > 0
  order by lower(u.email), u.id
  limit least(greatest(coalesce(p_limite,101),1),101) offset coalesce(p_offset,0);
end;
$$;
revoke all on function public.nq_acesso_listar_usuarios(text,integer,integer,text) from public, anon;
grant execute on function public.nq_acesso_listar_usuarios(text,integer,integer,text) to authenticated;

create or replace function public.nq_acesso_editar_nome(p_user_id uuid, p_nome text, p_nome_anterior text, p_perfil text default null)
returns table(user_id uuid, email text, nome text)
language plpgsql security definer set search_path = '' as $$
declare v_atual text; v_email text; v_nome text;
begin
  if not public.nq_acesso_gestor() then
    raise exception 'Gestão de acessos não autorizada.' using errcode = '42501';
  end if;
  v_nome := btrim(regexp_replace(coalesce(p_nome,''), '[[:space:]]+', ' ', 'g'));
  if char_length(v_nome) not between 1 and 150 or p_nome ~ '[[:cntrl:]]' then
    raise exception 'Informe um nome com até 150 caracteres.' using errcode = '22023';
  end if;
  select u.email, coalesce(nullif(btrim(u.raw_user_meta_data->>'nome'),''),
    nullif(btrim(u.raw_user_meta_data->>'full_name'),''),
    nullif(btrim(u.raw_user_meta_data->>'display_name'),''),'')
    into v_email, v_atual from auth.users u where u.id = p_user_id for update;
  if not found or lower(coalesce(v_email,'')) !~
    '^[^@[:space:]]+@(animaeducacao[.]com[.]br|ulife[.]com[.]br)$' then
    raise exception 'Conta institucional não encontrada.' using errcode = 'P0002';
  end if;
  if v_atual is distinct from p_nome_anterior then
    raise exception 'O nome foi alterado. Atualize a lista.' using errcode = '40001';
  end if;
  if p_perfil is not null then
    if p_perfil not in ('especialista','revisor','admin') then
      raise exception 'Perfil inválido.' using errcode='22023';
    end if;
    if p_perfil='admin' and not exists (select 1 from nq_acessos_privado.gestores g
      where g.email=lower(v_email) and g.ativo) then
      raise exception 'Admin restrito aos e-mails autorizados.' using errcode='42501';
    end if;
    if p_user_id=auth.uid() and p_perfil<>'admin' then
      raise exception 'Outro Admin deve alterar seu perfil.' using errcode='22023';
    end if;
    insert into nq_acessos_privado.perfis(user_id,perfil) values(p_user_id,p_perfil)
    on conflict on constraint perfis_pkey do update set perfil=excluded.perfil;
  end if;
  return query update auth.users u set raw_user_meta_data = coalesce(u.raw_user_meta_data,'{}'::jsonb)
    || jsonb_build_object('nome',v_nome,'full_name',v_nome,'display_name',v_nome), updated_at = now()
    where u.id = p_user_id returning u.id, u.email::text, v_nome;
end;
$$;
revoke all on function public.nq_acesso_editar_nome(uuid,text,text,text) from public, anon;
grant execute on function public.nq_acesso_editar_nome(uuid,text,text,text) to authenticated;

-- O Auth pode gravar senha e app_metadata em comandos separados na mesma
-- transação. O trigger adiado considera o estado final sem guardar a senha.
create or replace function nq_acessos_privado.registrar_senha_temporaria()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_marker jsonb; v_email text; v_admin uuid; v_pedido uuid;
begin
  select u.raw_app_meta_data->'nq_acesso_temporario', u.email
    into v_marker,v_email from auth.users u where u.id = new.id;
  if not found then return new; end if;
  if v_marker->>'pedido' is not null and not exists (
    select 1 from nq_acessos_privado.senhas_temporarias s
    where s.user_id = new.id and s.pedido_id::text = v_marker->>'pedido'
  ) then
    v_admin := (v_marker->>'administrador')::uuid;
    v_pedido := (v_marker->>'pedido')::uuid;
    if v_admin = new.id or not nq_acessos_privado.gestor_autorizado(v_admin) then
      raise exception 'Gestor não autorizado.' using errcode = '42501';
    end if;
    if lower(coalesce(v_email,'')) <> lower(coalesce(v_marker->>'email',''))
       or lower(coalesce(v_email,'')) !~
         '^[^@[:space:]]+@(animaeducacao[.]com[.]br|ulife[.]com[.]br)$' then
      raise exception 'O e-mail mudou ou não é institucional.' using errcode = '40001';
    end if;
    if exists (select 1 from nq_acessos_privado.senhas_temporarias s
               where s.user_id = new.id and s.atribuida_em > now() - interval '60 seconds') then
      raise exception 'Aguarde um minuto antes de atribuir outra senha.' using errcode = 'P0001';
    end if;
    insert into nq_acessos_privado.senhas_temporarias
      (user_id,pedido_id,transacao_atribuicao,atribuida_por,atribuida_em,alterada_em)
    values(new.id,v_pedido,txid_current(),v_admin,now(),null)
    on conflict(user_id) do update set pedido_id=excluded.pedido_id,
      transacao_atribuicao=excluded.transacao_atribuicao,atribuida_por=excluded.atribuida_por,
      atribuida_em=excluded.atribuida_em,alterada_em=null;
  elsif tg_op = 'UPDATE' then
    if new.encrypted_password is distinct from old.encrypted_password
       and coalesce(new.encrypted_password,'') <> '' then
      update nq_acessos_privado.senhas_temporarias set alterada_em=now()
      where user_id=new.id and alterada_em is null and transacao_atribuicao <> txid_current();
    end if;
  end if;
  return new;
end;
$$;
revoke all on function nq_acessos_privado.registrar_senha_temporaria() from public, anon, authenticated;
drop trigger if exists nq_registrar_senha_temporaria on auth.users;
create constraint trigger nq_registrar_senha_temporaria
after insert or update on auth.users deferrable initially deferred
for each row execute function nq_acessos_privado.registrar_senha_temporaria();
commit;
select 'V6.6: gestão de acessos instalada. Publique também a função nq-gerenciar-usuarios.' as resultado;
