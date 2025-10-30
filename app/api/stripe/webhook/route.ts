/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for subscription management
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('[Webhook] Signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log('[Webhook] Received event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;

  if (!userId) {
    console.error('[Webhook] No user ID in session metadata');
    return;
  }

  console.log('[Webhook] Checkout completed for user:', userId);

  // Update user to Pro
  const { error } = await supabase
    .from('profiles')
    .update({
      is_pro: true,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      subscription_status: 'active',
      subscription_start_date: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[Webhook] Failed to update profile:', error);
  } else {
    console.log('[Webhook] User upgraded to Pro:', userId);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    // Try to find user by customer ID
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();

    if (!data) {
      console.error('[Webhook] Could not find user for subscription');
      return;
    }
  }

  console.log('[Webhook] Subscription updated:', subscription.id);

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  const { error } = await supabase
    .from('profiles')
    .update({
      is_pro: isActive,
      subscription_status: subscription.status,
      subscription_end_date: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[Webhook] Failed to update subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Webhook] Subscription deleted:', subscription.id);

  const { error } = await supabase
    .from('profiles')
    .update({
      is_pro: false,
      subscription_status: 'canceled',
      subscription_end_date: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[Webhook] Failed to cancel subscription:', error);
  } else {
    console.log('[Webhook] User downgraded from Pro');
  }
}
