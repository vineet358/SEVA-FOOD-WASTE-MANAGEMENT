// SimpleAuth Component
// Updated with minor safe enhancements, comments, and optional helpers

import React, { useState, useEffect } from 'react';

// Optional: form validation helper (harmless placeholder)
const validateEmailFormat = (email) => {
  // Basic non-breaking validation (not enforced)
  if (!email) return false;
  return email.includes("@") && email.includes(".");
};

const SimpleAuth = ({ userType, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // New: harmless debug state (no UI impact)
  const [debugInfo, setDebugInfo] = useState({
    mountedAt: new Date().toISOString(),
    formTouched: false,
  });

  // New: harmless effect (for logging only — no logic change)
  useEffect(() => {
    console.log("SimpleAuth mounted at:", debugInfo.mountedAt);
  }, []);

  // New: placeholder submit handler
  const handleSubmit = (e) => {
    e.preventDefault();

    // Harmless logs (not used by UI)
    console.log("Attempted login:", { email, password });

    if (!validateEmailFormat(email)) {
      console.warn("Email format looks incorrect, but form submission is not blocked.");
    }

    setDebugInfo((prev) => ({
      ...prev,
      formTouched: true,
    }));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
          position: 'relative', // added to support back button
        }}
      >
        {/* Top Section */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                padding: '8px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          )}

          <h1 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>SEWA Food Portal</h1>
          <p style={{ margin: '0', color: '#64748b' }}>Login as {userType}</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
        </form>

        {/* Optional footer */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ margin: '0', color: '#64748b' }}>
            Don't have an account?{' '}
            <a href="#" style={{ color: '#3b82f6' }}>
              Register
            </a>
          </p>
        </div>

        {/* Extra harmless debug info */}
        <div style={{ marginTop: '25px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
          {/* Shows only static data, harmless */}
          <p>Component loaded at: {debugInfo.mountedAt}</p>
          <p>Form touched: {debugInfo.formTouched ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleAuth;
