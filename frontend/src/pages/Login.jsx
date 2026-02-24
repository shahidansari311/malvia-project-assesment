import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login } from '../services/apiService';

/* ── OTP Input boxes ── */
function OtpInput({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = digits.map((d, idx) => (idx === i ? '' : d)).join('').slice(0, 6);
        onChange(next);
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        const next = digits.map((d, idx) => (idx === i - 1 ? '' : d)).join('').slice(0, 6);
        onChange(next);
      }
    } else if (/^\d$/.test(e.key)) {
      const next = digits.map((d, idx) => (idx === i ? e.key : d)).join('').slice(0, 6);
      onChange(next);
      if (i < 5) refs.current[i + 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste) { onChange(paste); refs.current[Math.min(paste.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '8px 0 24px' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={() => {}}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          style={{
            width: '46px',
            height: '56px',
            textAlign: 'center',
            fontSize: '22px',
            fontWeight: 800,
            border: `2px solid ${d ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '14px',
            background: d ? 'rgba(99,102,241,0.12)' : 'rgba(20,20,40,0.8)',
            color: 'var(--text)',
            padding: 0,
            transition: 'all 0.2s',
            boxShadow: d ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
            outline: 'none',
          }}
        />
      ))}
    </div>
  );
}

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const mobileRef = useRef(null);

  useEffect(() => {
    mobileRef.current?.focus();
    // Redirect if already logged in
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const u = JSON.parse(user);
        navigate(u.is_admin ? '/admin' : '/', { replace: true });
      } catch (_err) {
        // malformed storage, ignore
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendOTP = () => {
    if (mobile.length !== 10) return toast.error('Enter a valid 10-digit mobile number');
    toast.success('OTP sent to +91 ' + mobile);
    setStep(2);
    setResendTimer(30);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return toast.error('Enter the complete 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await login(mobile, otp);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success(`Welcome back! 🎯`);
      navigate(data.is_admin ? '/admin' : '/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid OTP. Please try again.';
      toast.error(msg);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell" style={{ minHeight: '100dvh', justifyContent: 'center', padding: '0 20px' }}>
      
      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(124,58,237,0.08) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '-20%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black, transparent)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '430px', margin: '0 auto' }}>

        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }} className="anim-fadeUp">
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '80px', height: '80px', borderRadius: '26px',
            background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 60%, #a855f7 100%)',
            boxShadow: '0 12px 40px rgba(99,102,241,0.5), 0 1px 0 rgba(255,255,255,0.2) inset',
            marginBottom: '20px', fontSize: '40px',
          }}>🎯</div>
          <h1 style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, background: 'linear-gradient(135deg, #f0f0fa 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Malvia
          </h1>
          <p style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '13px', fontWeight: 500, letterSpacing: '0.02em' }}>
            India's Premium Satta Platform
          </p>
        </div>

        {/* Card */}
        <div className="card card-glow anim-fadeUp" style={{ padding: '32px 28px', animationDelay: '0.1s', borderColor: 'rgba(99,102,241,0.15)' }}>

          {step === 1 ? (
            <div className="anim-fadeIn">
              <p style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>Sign In</p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '28px' }}>
                Enter your mobile number to continue
              </p>

              <label className="label">Mobile Number</label>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text2)', fontSize: '15px', fontWeight: 700, pointerEvents: 'none',
                  borderRight: '1.5px solid var(--border3)', paddingRight: '11px',
                }}>+91</div>
                <input
                  ref={mobileRef}
                  type="tel"
                  placeholder="98765 43210"
                  value={mobile}
                  maxLength={10}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  style={{ paddingLeft: '68px', fontSize: '18px', fontWeight: 700, letterSpacing: '0.06em' }}
                />
                {mobile.length === 10 && (
                  <div style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--green)', fontSize: '18px',
                  }}>✓</div>
                )}
              </div>

              <button className="btn-primary" onClick={handleSendOTP} style={{ marginBottom: '16px' }}>
                Get OTP →
              </button>

              {/* Dev hint */}
              <div style={{
                padding: '12px 14px',
                background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)',
                borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <span style={{ fontSize: '18px' }}>🔑</span>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Demo Mode</p>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Use OTP <strong style={{ color: 'var(--text)', letterSpacing: '0.1em' }}>123456</strong> for any number
                  </p>
                </div>
              </div>
            </div>

          ) : (
            <div className="anim-fadeIn">
              <button
                onClick={() => { setStep(1); setOtp(''); }}
                style={{ background: 'none', color: 'var(--indigo)', fontSize: '13px', fontWeight: 700, marginBottom: '20px', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                ← Change number
              </button>
              <p style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>Verify OTP</p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '4px' }}>
                Sent to <strong style={{ color: 'var(--text)' }}>+91 {mobile}</strong>
              </p>

              {/* Quick-fill hint */}
              <div
                onClick={() => setOtp('123456')}
                style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)',
                  borderRadius: '12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>💬</span>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Test OTP</p>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginTop: '1px', letterSpacing: '0.25em' }}>1 2 3 4 5 6</p>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>Tap →</span>
              </div>

              <OtpInput value={otp} onChange={setOtp} />

              <button
                className="btn-primary"
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Verifying…
                  </span>
                ) : 'Verify & Sign In'}
              </button>

              {resendTimer > 0 ? (
                <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px', color: 'var(--muted)' }}>
                  Resend in <strong style={{ color: 'var(--text)' }}>{resendTimer}s</strong>
                </p>
              ) : (
                <button
                  onClick={handleSendOTP}
                  style={{ width: '100%', marginTop: '14px', background: 'none', color: 'var(--indigo)', fontSize: '13px', fontWeight: 700 }}
                >
                  Resend OTP
                </button>
              )}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: 'var(--muted2)', fontWeight: 500, lineHeight: 1.8 }}>
          🔒 256-bit encrypted  ·  18+ only  ·  Play responsibly
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Login;
