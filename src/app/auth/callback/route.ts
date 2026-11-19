import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';
import { safeLocalPath } from '@/lib/security';

/** The starting name for a new resident: their email prefix, if it fits the display name rules. */
function defaultDisplayName(email: string): string | null {
  const prefix = email.split('@')[0];
  return prefix.length >= 2 && prefix.length <= 50 ? prefix : null;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeLocalPath(searchParams.get('next'));

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // The first sign-in creates the record. Later sign-ins leave it alone,
        // so a name the resident chose stays theirs.
        const { error: profileError } = await supabase.from('users').upsert({
          id: user.id,
          email: user.email!,
          display_name: defaultDisplayName(user.email!),
        }, { onConflict: 'id', ignoreDuplicates: true });

        // Without this record, posts, votes and comments all fail later.
        if (profileError) {
          console.error('[auth/callback] could not create user record:', profileError.code);
          return NextResponse.redirect(`${origin}/auth/login?error=auth`);
        }
      }
      return response;
    }

    console.log('[auth/callback] error:', error.message);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`);
}
