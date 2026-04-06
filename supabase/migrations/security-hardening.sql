-- CivAccount Security Hardening — Run in Supabase SQL Editor
-- Adds: vote rate limiting, display name constraints

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Vote rate limiting — max 30 votes per user per hour
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_vote_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.votes
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 hour';

  IF v_count >= 30 THEN
    RAISE EXCEPTION 'Rate limit: maximum 30 votes per hour';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_vote_rate_limit ON public.votes;

CREATE TRIGGER enforce_vote_rate_limit
  BEFORE INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_vote_rate_limit();

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Display name constraints
--    Min 2 chars, max 50 chars, no HTML tags
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_display_name_length;

ALTER TABLE public.users
  ADD CONSTRAINT users_display_name_length
  CHECK (
    display_name IS NULL
    OR (
      char_length(display_name) >= 2
      AND char_length(display_name) <= 50
      AND display_name !~ '<[^>]+>'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════
-- Done.
-- ═══════════════════════════════════════════════════════════════════════
