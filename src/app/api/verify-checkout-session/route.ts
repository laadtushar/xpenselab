import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, idToken } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    if (!idToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      const auth = getAdminAuth();
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify the session belongs to this user
    if (session.metadata?.userId !== userId) {
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { 
          error: 'Payment not completed',
          paymentStatus: session.payment_status 
        },
        { status: 400 }
      );
    }

    // Check if user is already premium (webhook may have already processed)
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData?.tier === 'premium') {
        return NextResponse.json({ 
          success: true,
          alreadyPremium: true,
          message: 'User is already premium'
        });
      }
    }

    // Upgrade user to premium (fallback if webhook hasn't processed yet)
    await userRef.set({
      tier: 'premium',
      premiumActivatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ 
      success: true,
      message: 'User upgraded to premium'
    });
  } catch (error: any) {
    console.error('Error verifying checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify checkout session' },
      { status: 500 }
    );
  }
}
