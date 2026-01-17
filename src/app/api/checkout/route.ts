import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe inside the handler to avoid build-time errors
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const { amount } = await request.json();

    // Validate amount (minimum £1, maximum £500)
    const amountInPence = Math.round(amount * 100);
    if (amountInPence < 100 || amountInPence > 50000) {
      return NextResponse.json(
        { error: 'Amount must be between £1 and £500' },
        { status: 400 }
      );
    }

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
      success_url: `${request.headers.get('origin')}/donate/thank-you`,
      cancel_url: `${request.headers.get('origin')}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
