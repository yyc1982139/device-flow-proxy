if (!process.argv[2]) {
  console.log('Usage: npx ts-node client.ts <client_id> [base_url]');
  console.log('Example: npx ts-node client.ts your_github_client_id http://localhost:3000');
  process.exit(1);
}

const clientId = process.argv[2];
const baseUrl = process.argv[3] || 'http://localhost:3000';

async function main() {
  console.log('Starting Device Flow authentication...\n');

  const codeResponse = await fetch(`${baseUrl}/api/device/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(clientId)}`,
  });

  const codeData = await codeResponse.json();

  if (!codeData.device_code) {
    console.error('Error: Could not get device code');
    console.error('Response:', codeData);
    process.exit(1);
  }

  console.log('Please visit this URL in your browser:');
  console.log(`${codeData.verification_uri}?code=${codeData.user_code}`);
  console.log(`\nYour code: ${codeData.user_code}\n`);
  console.log('Waiting for authorization...\n');

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, codeData.interval * 1000));

    const tokenResponse = await fetch(`${baseUrl}/api/device/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: clientId,
        device_code: codeData.device_code,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.access_token) {
      console.log('✓ Successfully authenticated!');
      console.log('\nAccess Token:', tokenData.access_token);
      if (tokenData.token_type) {
        console.log('Token Type:', tokenData.token_type);
      }
      if (tokenData.expires_in) {
        console.log('Expires in:', tokenData.expires_in, 'seconds');
      }
      process.exit(0);
    }

    if (tokenData.error && tokenData.error !== 'authorization_pending') {
      console.error('✗ Authentication failed:', tokenData.error_description || tokenData.error);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
