alter table merchants
  add column if not exists review_targets jsonb not null default '[]'::jsonb;

alter table events
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table feedback_samples
  add column if not exists generation_provider text,
  add column if not exists generation_style text,
  add column if not exists review_target text;

create unique index if not exists feedback_samples_session_unique_idx
  on feedback_samples (session_id);

alter table merchants enable row level security;
alter table dishes enable row level security;
alter table sessions enable row level security;
alter table events enable row level security;
alter table feedback_samples enable row level security;

create policy "public can read active merchants"
  on merchants for select
  to anon, authenticated
  using (status = 'active');

create policy "public can read active dishes"
  on dishes for select
  to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1 from merchants
      where merchants.merchant_id = dishes.merchant_id
        and merchants.status = 'active'
    )
  );

grant select on merchants, dishes to anon, authenticated;
revoke all on sessions, events, feedback_samples from anon, authenticated;

create or replace function purge_expired_research_samples()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from feedback_samples where expires_at <= now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function purge_expired_research_samples() from public;
