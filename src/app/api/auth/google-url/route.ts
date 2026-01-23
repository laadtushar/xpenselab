import { NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';

/**
 * API route to generate Google OAuth URL for external browser
 * This is needed because Firebase's signInWithRedirect doesn't give us the URL directly
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirectUrl') || 'https://xpenselab.com/auth/callback';
    
    const projectId = firebaseConfig.projectId;
    const apiKey = firebaseConfig.apiKey;
    
    // Build Firebase Auth handler URL
    // This will redirect to Google OAuth, then back to our callback
    const authHandlerUrl = `https://${projectId}.firebaseapp.com/__/auth/handler?apiKey=${apiKey}&authType=signInViaRedirect&providerId=google.com&redirectUrl=${encodeURIComponent(redirectUrl)}`;
    
    return NextResponse.json({ url: authHandlerUrl });
  } catch (error: any) {
    console.error('Error generating OAuth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}
