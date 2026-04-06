import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Countries allowed to participate (vote, propose, comment)
const ALLOWED_COUNTRIES = new Set(['GB']);

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth session so it doesn't expire
  await supabase.auth.getUser();

  // Geo check — Vercel provides x-vercel-ip-country on every request
  // In development, default to GB (localhost has no geo header)
  const country = request.headers.get('x-vercel-ip-country') || (process.env.NODE_ENV === 'development' ? 'GB' : 'XX');
  const isUK = ALLOWED_COUNTRIES.has(country);

  // Set geo cookie so client components can check without an API call
  supabaseResponse.cookies.set('geo', country, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600, // Refresh every hour
    path: '/',
  });

  // Block non-UK users from auth and participation endpoints
  if (!isUK) {
    const path = request.nextUrl.pathname;

    // Block signup/login for non-UK users
    if (path.startsWith('/auth/login') || path.startsWith('/auth/callback')) {
      return NextResponse.redirect(new URL('/uk-only', request.url));
    }

    // Block proposal creation
    if (path.endsWith('/proposals/new')) {
      return NextResponse.redirect(new URL('/uk-only', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
