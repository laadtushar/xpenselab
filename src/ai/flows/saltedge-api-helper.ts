
'use server';

import crypto from 'crypto';

const SALTEDGE_API_URL = 'https://www.saltedge.com/api/v6';

/**
 * Generate Salt Edge API signature for authenticated requests
 */
export function generateSaltEdgeSignature(
  expiresAt: number,
  method: string,
  url: string,
  body: string = ''
): string {
  const appId = process.env.SALTEDGE_APP_ID;
  const secret = process.env.SALTEDGE_SECRET;
  const privateKey = process.env.SALTEDGE_PRIVATE_KEY;

  if (!appId || !secret) {
    throw new Error('Salt Edge App ID or Secret not configured.');
  }

  // For test/pending status, signature is optional
  // For live status, signature is required
  if (privateKey) {
    try {
      const stringToSign = `${expiresAt}|${method.toUpperCase()}|${url}|${body}`;
      const sign = crypto.createSign('SHA256');
      sign.update(stringToSign);
      sign.end();
      // Private key should be in PEM format
      const key = privateKey.includes('BEGIN') ? privateKey : `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`;
      return sign.sign(key, 'base64');
    } catch (error) {
      console.error('Error generating signature:', error);
      // Return empty signature if signing fails (for test mode)
      return '';
    }
  }

  return '';
}

/**
 * Make authenticated request to Salt Edge API
 */
export async function saltEdgeRequest(
  method: string,
  endpoint: string,
  body?: any
): Promise<any> {
  const appId = process.env.SALTEDGE_APP_ID;
  const secret = process.env.SALTEDGE_SECRET;

  if (!appId || !secret) {
    throw new Error('Salt Edge App ID or Secret not configured.');
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
  const url = `${SALTEDGE_API_URL}${endpoint}`;
  const bodyString = body ? JSON.stringify(body) : '';
  
  const signature = generateSaltEdgeSignature(expiresAt, method, url, bodyString);

  const headers: Record<string, string> = {
    'App-id': appId,
    'Secret': secret,
    'Content-Type': 'application/json',
  };

  if (signature) {
    headers['Expires-at'] = expiresAt.toString();
    headers['Signature'] = signature;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: bodyString || undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || 
      errorData.error?.class || 
      `Salt Edge API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

