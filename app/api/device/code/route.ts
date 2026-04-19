import { NextRequest, NextResponse } from 'next/server';
import { Cache, generateDeviceCode, generateUserCode, generatePkceVerifier } from '@/lib/cache';
import { BASE_URL, LIMIT_REQUESTS_PER_MINUTE } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const clientId = body.get('client_id') as string;
    const clientSecret = body.get('client_secret') as string | null;
    const scope = body.get('scope') as string | null;

    if (!clientId) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing client_id' },
        { status: 400 }
      );
    }

    const deviceCode = generateDeviceCode();
    const pkceVerifier = generatePkceVerifier();
    const userCode = generateUserCode();

    const cacheData = {
      client_id: clientId,
      client_secret: clientSecret || undefined,
      scope: scope || undefined,
      device_code: deviceCode,
      pkce_verifier: pkceVerifier,
    };

    const userCodeKey = userCode.replace(/-/g, '').toUpperCase();
    await Cache.set(userCodeKey, cacheData, 300);
    await Cache.set(deviceCode, { timestamp: Date.now(), status: 'pending' }, 300);

    const interval = Math.round(60 / LIMIT_REQUESTS_PER_MINUTE);

    return NextResponse.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: `${BASE_URL}/device`,
      expires_in: 300,
      interval,
    });
  } catch (error) {
    console.error('Error in /api/device/code:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
