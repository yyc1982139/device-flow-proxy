import { NextRequest, NextResponse } from 'next/server';
import { Cache } from '@/lib/cache';
import { BASE_URL, TOKEN_ENDPOINT } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!state || !code) {
      return NextResponse.json(
        { error: 'Invalid Request', error_description: 'Request was missing parameters' },
        { status: 400 }
      );
    }

    const stateData = await Cache.get(`state:${state}`);
    if (!stateData) {
      return NextResponse.json(
        { error: 'Invalid State', error_description: 'The state parameter was invalid' },
        { status: 400 }
      );
    }

    const userCode = stateData.user_code;
    const cache = await Cache.get(userCode);

    if (!cache) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Session expired' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${BASE_URL}/api/auth/redirect`,
      client_id: cache.client_id,
      code_verifier: cache.pkce_verifier,
    });

    if (cache.client_secret) {
      params.set('client_secret', cache.client_secret);
    }

    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: params.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      await Cache.delete(userCode);
      await Cache.delete(cache.device_code);
      return NextResponse.json(
        { error: 'Error Logging In', error_description: `There was an error getting an access token: ${JSON.stringify(tokenData)}` },
        { status: 400 }
      );
    }

    await Cache.set(cache.device_code, {
      status: 'complete',
      token_response: tokenData,
    }, 120);
    await Cache.delete(userCode);
    await Cache.delete(`state:${state}`);

    return NextResponse.redirect(new URL('/signed-in', request.url));
  } catch (error) {
    console.error('Error in /api/auth/redirect:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
