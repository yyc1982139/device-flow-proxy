'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DeviceContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.replace(/-/g, '').length < 8) {
      setError('Please enter a valid code');
      return;
    }

    window.location.href = `/api/verify?code=${code}`;
  };

  return (
    <div className="container">
      <h1>Device Authorization</h1>
      <p className="subtitle">Enter the code displayed on your device</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="code-input-group">
          <label htmlFor="code">Your Code</label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            maxLength={9}
            autoFocus
          />
        </div>
        <button type="submit">Continue</button>
      </form>
    </div>
  );
}

export default function DevicePage() {
  return (
    <Suspense fallback={
      <div className="container">
        <h1>Device Authorization</h1>
        <p className="subtitle">Loading...</p>
      </div>
    }>
      <DeviceContent />
    </Suspense>
  );
}
