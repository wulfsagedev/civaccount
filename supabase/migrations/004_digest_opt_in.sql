-- The weekly digest goes only to people who asked for it (LEGAL-AUDIT-2026-09.md CA-11; 29 October 2026).
-- Following a council is not asking for email, so the digest waits for each person's own yes, and every
-- email it sends needs a way to stop it. Nobody is opted in until a sign-up or account setting asks them.
alter table public.users add column if not exists digest_opt_in boolean not null default false;
