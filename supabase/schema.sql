-- CivAccount Civic Participation Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  council_slug text,
  reputation int default 0,
  role text default 'voter' check (role in ('reader', 'voter', 'admin')),
  created_at timestamptz default now()
);

-- Proposals
create table public.proposals (
  id uuid primary key default uuid_generate_v4(),
  council_slug text not null,
  budget_category text not null,
  title text not null check (char_length(title) <= 200),
  body text not null check (char_length(body) <= 2000),
  author_id uuid not null references public.users(id) on delete cascade,
  score int default 0,
  status text default 'open' check (status in ('open', 'acknowledged', 'in_progress', 'resolved', 'closed', 'flagged')),
  labels text[] default '{}',
  comment_count int default 0,
  created_at timestamptz default now()
);

-- Votes (one per user per proposal)
create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  direction text not null check (direction in ('up', 'down')),
  created_at timestamptz default now(),
  unique(proposal_id, user_id)
);

-- Comments (threaded, max 3 levels enforced in app)
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  status text default 'visible' check (status in ('visible', 'flagged', 'removed')),
  flag_count int default 0,
  created_at timestamptz default now()
);

-- Civic Diffs (auto-generated data change summaries)
create table public.civic_diffs (
  id uuid primary key default uuid_generate_v4(),
  council_slug text not null,
  budget_category text not null,
  year_from int not null,
  year_to int not null,
  amount_from decimal not null,
  amount_to decimal not null,
  pct_change decimal not null,
  summary text not null,
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_proposals_council on public.proposals(council_slug, created_at desc);
create index idx_proposals_score on public.proposals(council_slug, score desc);
create index idx_proposals_category on public.proposals(council_slug, budget_category);
create index idx_votes_proposal on public.votes(proposal_id);
create index idx_votes_user on public.votes(user_id);
create index idx_comments_proposal on public.comments(proposal_id, created_at);
create index idx_comments_parent on public.comments(parent_id);
create index idx_civic_diffs_council on public.civic_diffs(council_slug, created_at desc);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.users enable row level security;
alter table public.proposals enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.civic_diffs enable row level security;

-- Users: public read, self write
create policy "Users are viewable by everyone" on public.users for select using (true);
create policy "Users can insert their own record" on public.users for insert with check (auth.uid() = id);
create policy "Users can update their own record" on public.users for update using (auth.uid() = id);

-- Proposals: public read, authenticated insert
create policy "Proposals are viewable by everyone" on public.proposals for select using (true);
create policy "Authenticated users can create proposals" on public.proposals for insert with check (auth.uid() = author_id);
create policy "Authors can update their own proposals" on public.proposals for update using (auth.uid() = author_id);

-- Votes: public read, authenticated insert/update/delete
create policy "Votes are viewable by everyone" on public.votes for select using (true);
create policy "Authenticated users can vote" on public.votes for insert with check (auth.uid() = user_id);
create policy "Users can change their vote" on public.votes for update using (auth.uid() = user_id);
create policy "Users can remove their vote" on public.votes for delete using (auth.uid() = user_id);

-- Comments: public read (visible only), authenticated insert
create policy "Visible comments are viewable by everyone" on public.comments for select using (status = 'visible');
create policy "Authenticated users can comment" on public.comments for insert with check (auth.uid() = author_id);

-- Civic Diffs: public read
create policy "Civic diffs are viewable by everyone" on public.civic_diffs for select using (true);

-- ============================================
-- FUNCTIONS (score computation, comment count)
-- ============================================

-- Function to recompute proposal score from votes
create or replace function public.update_proposal_score()
returns trigger as $$
begin
  update public.proposals
  set score = (
    select coalesce(sum(case when direction = 'up' then 1 else -1 end), 0)
    from public.votes
    where proposal_id = coalesce(new.proposal_id, old.proposal_id)
  )
  where id = coalesce(new.proposal_id, old.proposal_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Trigger: update score on vote insert/update/delete
create trigger on_vote_change
  after insert or update or delete on public.votes
  for each row execute function public.update_proposal_score();

-- Function to update comment count
create or replace function public.update_comment_count()
returns trigger as $$
begin
  update public.proposals
  set comment_count = (
    select count(*)
    from public.comments
    where proposal_id = coalesce(new.proposal_id, old.proposal_id)
      and status = 'visible'
  )
  where id = coalesce(new.proposal_id, old.proposal_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Trigger: update comment count on comment insert/update/delete
create trigger on_comment_change
  after insert or update or delete on public.comments
  for each row execute function public.update_comment_count();
