This server implements the OAuth 2.0 Device Authorization Grant flow (RFC 8628), allowing devices with limited input capabilities to authenticate via a separate browser.

To use this service, your device or application should make a POST request to /api/device/code with your client_id to begin the authentication flow.


## Quick Start
```
# 1. Get device code
curl -X POST https://your-server.com/api/device/code \
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
curl -X POST https://your-server.com/api/device/token \
  -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
  -d "client_id=your_client_id" \
  -d "device_code=..."
```
