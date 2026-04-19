export default function HomePage() {
  return (
    <div className="container">
      <h1>OAuth 2.0 Device Flow Proxy</h1>
      <p className="subtitle">Authenticate devices without browser access</p>

      <p>
        This server implements the OAuth 2.0 Device Authorization Grant flow
        (RFC 8628), allowing devices with limited input capabilities to authenticate
        via a separate browser.
      </p>

      <p>
        To use this service, your device or application should make a POST request
        to <code>/api/device/code</code> with your <code>client_id</code> to begin
        the authentication flow.
      </p>

      <div style={{ marginTop: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px', textAlign: 'left' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>Quick Start</h3>
        <pre style={{ fontSize: '12px', color: '#666', overflow: 'auto' }}>
{`# 1. Get device code
curl -X POST https://your-server.com/api/device/code \\
  -d "client_id=your_client_id"

# Response:
# {
#   "device_code": "...",
#   "user_code": "XXXX-XXXX",
#   "verification_uri": "https://your-server.com/device",
#   "expires_in": 300,
#   "interval": 5
# }

# 2. Visit verification_uri and enter user_code

# 3. Poll for token
curl -X POST https://your-server.com/api/device/token \\
  -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \\
  -d "client_id=your_client_id" \\
  -d "device_code=..."`}
        </pre>
      </div>
    </div>
  );
}
