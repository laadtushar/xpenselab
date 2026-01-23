import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAdminFirestore } from '@/firebase/admin';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is missing from environment variables');
}

// Type assertion: webhookSecret is guaranteed to be string after the check above
const WEBHOOK_SECRET: string = webhookSecret;

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
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
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
        // For checkout.session.completed, userId is in session.metadata
        // session.subscription is just a string ID, not an object
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('No userId in session metadata', { sessionId: session.id });
          return NextResponse.json(
            { error: 'Missing userId in session metadata' },
            { status: 400 }
          );
        }

        // Verify the session payment status
        if (session.payment_status !== 'paid') {
          console.log(`Session ${session.id} not paid yet, skipping upgrade`);
          return NextResponse.json({ received: true });
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

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.log(`Subscription ${subscription.id} has no userId in metadata`);
          return NextResponse.json({ received: true });
        }

        // Check if subscription is active
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const willCancel = subscription.cancel_at_period_end === true;

        const userRef = db.collection('users').doc(userId);
        
        if (isActive && !willCancel) {
          // Ensure user is premium if subscription is active
          await userRef.update({
            tier: 'premium',
          });
          console.log(`User ${userId} subscription active, ensured premium tier`);
        } else {
          // Downgrade if subscription is not active or will cancel
          await userRef.update({
            tier: 'basic',
          });
          console.log(`User ${userId} subscription inactive, downgraded to basic`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const userRef = db.collection('users').doc(userId);
          await userRef.update({
            tier: 'basic',
          });
          console.log(`User ${userId} subscription deleted, downgraded to basic`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          // Fetch subscription to get userId
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
            const userId = subscription.metadata?.userId;

            if (userId) {
              const userRef = db.collection('users').doc(userId);
              await userRef.update({
                tier: 'basic',
              });
              console.log(`User ${userId} payment failed, downgraded to basic`);
            }
          } catch (err) {
            console.error('Error fetching subscription for invoice.payment_failed:', err);
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
