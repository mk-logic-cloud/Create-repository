-- LOCAL TEST ONLY — never run against Supabase.
-- Emulates the parts of Supabase's auth schema and roles the migration relies on,
-- so schema and RLS can be verified against a plain Postgres instance.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase grants table privileges in public to these roles by default.
alter default privileges in schema public grant all on tables to anon, authenticated;
