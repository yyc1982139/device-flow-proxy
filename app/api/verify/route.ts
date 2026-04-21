import { NextRequest, NextResponse } from 'next/server';
import { Cache } from '@/lib/cache';
import { BASE_URL, AUTHORIZATION_ENDPOINT, DEVICE_PASSWORD } from '@/lib/config';
import { generateState, generatePkceChallenge } from '@/lib/cache';
import { DeviceCacheEntry, StateCacheEntry } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const password = searchParams.get('password');

    if (!code) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'No code was entered' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'No password was entered' },
        { status: 400 }
      );
    }

    if (DEVICE_PASSWORD && password !== DEVICE_PASSWORD) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Incorrect password' },
        { status: 400 }
      );
    }

    const userCode = searchParams.get('code')!.replace(/-/g, '').toUpperCase();
    const cache = await Cache.get(userCode) as DeviceCacheEntry | null;

    if (!cache) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Code not found' },
        { status: 400 }
      );
    }

    const state = generateState();
    await Cache.set(`state:${state}`, { user_code: userCode, timestamp: Date.now() } as StateCacheEntry, 300);

    const pkceChallenge = await generatePkceChallenge(cache.pkce_verifier);

    const queryParams = new URLSearchParams({
      response_type: 'code',
      client_id: cache.client_id,
      redirect_uri: `${BASE_URL}/api/auth/redirect`,
      state,
      code_challenge: pkceChallenge,
      code_challenge_method: 'S256',
    });

    if (cache.scope) {
      queryParams.set('scope', cache.scope);
    }

    const redirectUrl = `${AUTHORIZATION_ENDPOINT}?${queryParams.toString()}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in /api/verify:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
