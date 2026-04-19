import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { checkOrigin } from '@/lib/security';

// Rate limit: 5 checkout attempts per minute per IP
const RATE_LIMIT = { limit: 5, windowSeconds: 60 };

// Canonical production origin.  Stripe success/cancel URLs must be on our
// controlled domain — not the request's Origin header, which an attacker
// could craft to redirect a user to a phishing look-alike after payment.
const PRODUCTION_ORIGIN = 'https://www.civaccount.co.uk';

export async function POST(request: NextRequest) {
  try {
    // CSRF defence: reject cross-site POSTs before we touch Stripe.
    const originCheck = checkOrigin(request);
    if (!originCheck.ok) {
      return NextResponse.json(
        { error: 'Cross-site request rejected' },
        { status: 403 }
      );
    }

    // Check rate limit
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(`checkout:${clientIP}`, RATE_LIMIT);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${rateLimitResult.resetIn} seconds.` },
        { status: 429 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const body = (await request.json()) as unknown;
    if (typeof body !== 'object' || body === null || !('amount' in body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const amountRaw = (body as { amount: unknown }).amount;
    const amount = typeof amountRaw === 'number' ? amountRaw : NaN;

    // Validate amount (minimum £1, maximum £500).  `Number.isFinite` rejects
    // NaN, Infinity, and anything that wasn't actually a number in the JSON.
    if (!Number.isFinite(amount)) {
      return NextResponse.json({ error: 'Amount must be a number' }, { status: 400 });
    }
    const amountInPence = Math.round(amount * 100);
    if (amountInPence < 100 || amountInPence > 50000) {
      return NextResponse.json(
        { error: 'Amount must be between £1 and £500' },
        { status: 400 }
      );
    }

    // In production, the success/cancel URLs MUST live on our domain.  In
    // local dev we fall back to the request's Origin because localhost
    // won't match PRODUCTION_ORIGIN.  The checkOrigin guard above already
    // verified the Origin is in our allow-list, so using it here is safe.
    const isProd = process.env.VERCEL_ENV === 'production';
    const origin = isProd
      ? PRODUCTION_ORIGIN
      : (request.headers.get('origin') ?? PRODUCTION_ORIGIN);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Support CivAccount',
              description: 'Thank you for supporting open council data',
            },
            unit_amount: amountInPence,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/donate/thank-you`,
      cancel_url: `${origin}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Log a compact, secret-free error line.  Stripe SDK errors can contain
    // request IDs that are fine to surface, but the full error object may
    // include the raw request body and should not be logged as-is.
    const summary = error instanceof Error ? error.message : 'unknown error';
    console.error('[checkout] stripe error:', summary);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
