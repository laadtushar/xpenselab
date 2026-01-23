import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAdminFirestore } from '@/firebase/admin';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is missing from environment variables');
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    const db = getAdminFirestore();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId || session.subscription?.metadata?.userId;

        if (!userId) {
          console.error('No userId in session metadata');
          return NextResponse.json(
            { error: 'Missing userId in session metadata' },
            { status: 400 }
          );
        }

        // Update user to premium tier
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          tier: 'premium',
          premiumActivatedAt: new Date().toISOString(),
        });

        console.log(`User ${userId} upgraded to premium`);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;

        if (userId) {
          // Check subscription status
          const status = subscription.status || subscription.cancel_at_period_end ? 'canceled' : 'active';
          
          if (status === 'canceled' || event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
            // Downgrade user to basic tier
            const userRef = db.collection('users').doc(userId);
            await userRef.update({
              tier: 'basic',
            });

            console.log(`User ${userId} downgraded to basic`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
