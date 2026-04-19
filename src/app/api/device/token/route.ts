import { NextRequest, NextResponse } from 'next/server';
import { Cache } from '@/lib/cache';
import { LIMIT_REQUESTS_PER_MINUTE } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const deviceCode = body.get('device_code') as string;
    const clientId = body.get('client_id') as string;
    const grantType = body.get('grant_type') as string;

    if (!deviceCode || !clientId || !grantType) {
      return NextResponse.json(
        { error: 'invalid_request' },
        { status: 400 }
      );
    }

    if (grantType !== 'urn:ietf:params:oauth:grant-type:device_code') {
      return NextResponse.json(
        { error: 'unsupported_grant_type', error_description: "Only 'urn:ietf:params:oauth:grant-type:device_code' is supported." },
        { status: 400 }
      );
    }

    const bucket = `ratelimit-${Math.floor(Date.now() / 60000)}-${deviceCode}`;
    const requestCount = await Cache.incr(bucket);
    await Cache.expire(bucket, 60);

    if (requestCount > LIMIT_REQUESTS_PER_MINUTE) {
      return NextResponse.json(
        { error: 'slow_down' },
        { status: 400 }
      );
    }

    const data = await Cache.get(deviceCode);

    if (!data) {
      return NextResponse.json(
        { error: 'invalid_grant' },
        { status: 400 }
      );
    }

    if (data.status === 'pending') {
      return NextResponse.json(
        { error: 'authorization_pending' },
        { status: 400 }
      );
    }

    if (data.status === 'complete') {
      await Cache.delete(deviceCode);
      return NextResponse.json(data.token_response);
    }

    return NextResponse.json(
      { error: 'invalid_grant' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in /api/device/token:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
