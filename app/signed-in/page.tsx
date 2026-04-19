export default function SignedInPage() {
  return (
    <div className="container">
      <div className="success-icon">
        <svg viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h1>Successfully Authorized!</h1>
      <p>
        You have successfully signed in and authorized the application.
      </p>
      <p>
        You can now return to your device or application. The access token
        has been delivered to the requesting device.
      </p>
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
        This page will automatically close, or you can close it manually.
      </p>
    </div>
  );
}
