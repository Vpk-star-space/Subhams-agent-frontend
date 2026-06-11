import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); 
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 🟢 Track failed attempts locally for the Forgot Password screen
  const [failedAttempts, setFailedAttempts] = useState(() => {
    return parseInt(localStorage.getItem('localForgotAttempts') || '0', 10);
  });

  const [lockoutTimer, setLockoutTimer] = useState(() => {
    const lockedUntil = localStorage.getItem('forgotLockoutUntil');
    if (lockedUntil) {
      const remainingSeconds = Math.floor((parseInt(lockedUntil, 10) - Date.now()) / 1000);
      if (remainingSeconds > 0) return remainingSeconds;
      localStorage.removeItem('forgotLockoutUntil');
    }
    return 0;
  });

  useEffect(() => {
    let interval;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('forgotLockoutUntil'); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const triggerLockout = () => {
    const lockoutDuration = 900; // 15 mins
    setLockoutTimer(lockoutDuration);
    localStorage.setItem('forgotLockoutUntil', Date.now() + (lockoutDuration * 1000));
    setFailedAttempts(0);
    localStorage.removeItem('localForgotAttempts');
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setLoading(true);
    setError('');
    setMessage('');
    
    try {
   const res = await api.post('/auth/forgot-password/request-otp', { email });
      if (res.data.success) {
        setFailedAttempts(0);
        localStorage.removeItem('localForgotAttempts');
        setMessage(res.data.message);
        setStep(2); 
      }
    } catch (err) {
      if (err.response && err.response.status === 429) {
        triggerLockout(); // Hacker hit the rate limit, lock their screen!
      } else {
        const newAttempts = failedAttempts + 1;
        if (newAttempts >= 5) {
          triggerLockout();
        } else {
          setFailedAttempts(newAttempts);
          localStorage.setItem('localForgotAttempts', newAttempts.toString());
          const attemptsLeft = 5 - newAttempts;
          setError(`${err.response?.data?.message || 'Failed to send OTP.'} ⚠️ ${attemptsLeft} attempt(s) left.`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password/reset', {
        email,
        otp,
        newPassword,
      });
      if (res.data.success) {
        localStorage.removeItem('forgotLockoutUntil');
        localStorage.removeItem('localForgotAttempts');
        
        // 🟢 Crucial: Also wipe the main Login locks so they can sign in cleanly!
        localStorage.removeItem('lockoutUntil');
        localStorage.removeItem('localFailedAttempts');

        alert("Password reset successful! Your account is unlocked. Redirecting to login...");
        navigate('/login?role=business'); 
      }
    } catch (err) {
      if (err.response && err.response.status === 429) {
        triggerLockout();
      } else {
        const newAttempts = failedAttempts + 1;
        if (newAttempts >= 5) {
          triggerLockout();
        } else {
          setFailedAttempts(newAttempts);
          localStorage.setItem('localForgotAttempts', newAttempts.toString());
          const attemptsLeft = 5 - newAttempts;
          setError(`Invalid OTP. ⚠️ ${attemptsLeft} attempt(s) left.`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🔴 LOCKOUT SCREEN OVERLAY */}
      {lockoutTimer > 0 && (
        <div style={lockoutOverlayStyle}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🛡️</div>
          <h1 style={{ color: '#f87171', margin: '0 0 10px 0' }}>Action Blocked</h1>
          <p style={{ color: '#cbd5e1', marginBottom: '20px', maxWidth: '340px', lineHeight: '1.5', fontSize: '15px' }}>
            We have temporarily blocked password reset attempts from this device due to suspicious activity.
          </p>
          
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff', padding: '15px 35px', background: 'rgba(248, 113, 113, 0.1)', border: '2px solid #f87171', borderRadius: '12px', marginBottom: '30px' }}>
             {Math.floor(lockoutTimer / 60)}m {lockoutTimer % 60}s
          </div>

          <div style={{ borderTop: '1px solid #334155', paddingTop: '25px', width: '100%', maxWidth: '320px' }}>
            <button 
              onClick={() => navigate('/login?role=business')} 
              style={{ ...btnStyle, background: '#334155', width: '100%', padding: '12px', color: '#fff' }}
            >
              Return to Login
            </button>
          </div>
        </div>
      )}

      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{ fontSize: '26px', color: '#0f172a', margin: '0 0 10px 0' }}>Reset Password</h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {step === 1 ? "Enter your email to receive a secure recovery code." : "Enter the 6-digit OTP sent to your email."}
          </p>
        </div>

        {error && <p style={errorStyle}>{error}</p>}
        {message && <p style={successStyle}>{message}</p>}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="Registered Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required disabled={lockoutTimer > 0} />
            <button type="submit" disabled={loading || lockoutTimer > 0} style={{ ...btnStyle, background: lockoutTimer > 0 ? '#94a3b8' : '#0f172a' }}>
              {loading ? "Sending..." : "Send Reset OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="6-Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} style={inputStyle} required maxLength={6} disabled={lockoutTimer > 0} />
            <input type="password" placeholder="Enter New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} required disabled={lockoutTimer > 0} />
            <button type="submit" disabled={loading || lockoutTimer > 0} style={{ ...btnStyle, background: lockoutTimer > 0 ? '#94a3b8' : '#0f172a' }}>
              {loading ? "Resetting..." : "Update Password & Unlock"}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px' }}>
          Remember your password? <Link to="/login?role=business" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'none' }}>Sign In Here</Link>
        </p>
      </div>
    </>
  );
}

const lockoutOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(10px)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, color: '#fff', textAlign: 'center', padding: '20px'
};
const containerStyle = { maxWidth: '420px', margin: '80px auto', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', fontFamily: 'Inter, sans-serif' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' };
const btnStyle = { padding: '14px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: '600' };
const errorStyle = { color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: '0 0 15px 0', fontWeight: 'bold' };
const successStyle = { color: '#16a34a', fontSize: '13px', textAlign: 'center', margin: '0 0 15px 0', fontWeight: 'bold' };