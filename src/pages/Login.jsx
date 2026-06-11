import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/api';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'; 
import { jwtDecode } from 'jwt-decode';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isBusiness = queryParams.get('role') === 'business';
  const roleValue = isBusiness ? 'business' : 'individual';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  
  // Track failed attempts locally for the warning message
  const [failedAttempts, setFailedAttempts] = useState(() => {
    return parseInt(localStorage.getItem('localFailedAttempts') || '0', 10);
  });

  // Lazy initialize state directly from localStorage
  const [lockoutTimer, setLockoutTimer] = useState(() => {
    const lockedUntil = localStorage.getItem('lockoutUntil');
    if (lockedUntil) {
      const remainingSeconds = Math.floor((parseInt(lockedUntil, 10) - Date.now()) / 1000);
      if (remainingSeconds > 0) return remainingSeconds;
      localStorage.removeItem('lockoutUntil');
    }
    return 0;
  });

  // COUNTDOWN LOGIC
  useEffect(() => {
    let interval;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('lockoutUntil'); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  useEffect(() => {
api.get('/auth/google-client-id')
      .then(res => {
          if (res.data.success) {
              setClientId(res.data.clientId);
          }
      })
      .catch(err => console.error("Failed to fetch Google Client ID:", err));
  }, []);

  const triggerLockout = () => {
    const lockoutDuration = 900; 
    setLockoutTimer(lockoutDuration);
    localStorage.setItem('lockoutUntil', Date.now() + (lockoutDuration * 1000));
    
    // Reset attempts once locked so it starts fresh after 15 minutes
    setFailedAttempts(0);
    localStorage.removeItem('localFailedAttempts');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return; 
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        setFailedAttempts(0);
        localStorage.removeItem('localFailedAttempts');
        
        const { accessToken, refreshToken, role, shopId, ownerName } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        if (role === 'business') {
          localStorage.setItem('shopId', shopId);
          localStorage.setItem('ownerName', ownerName || shopId); 
          navigate('/dashboard');
        } else {
          navigate('/u'); 
        }
      }
    } catch (err) {
      if (err.response && (err.response.status === 400 || err.response.status === 444)) {
        const newAttempts = failedAttempts + 1;
        
        if (newAttempts >= 5) {
          triggerLockout(); 
        } else {
          setFailedAttempts(newAttempts);
          localStorage.setItem('localFailedAttempts', newAttempts.toString());
          
          const attemptsLeft = 5 - newAttempts;
          const baseMessage = err.response?.data?.message || 'Invalid credentials.';
          setError(`${baseMessage} ⚠️ ${attemptsLeft} attempt(s) left. Please reset your password to avoid being locked out!`);
        }
      } else if (!err.response || err.response.status === 429) {
        // Handles automated server rate limits or database blocks during active attacks
        triggerLockout(); 
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (lockoutTimer > 0) return; 

    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const response = await api.post('/auth/google-login', {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
        role: roleValue
      });
      
      if (response.data.success) {
        setFailedAttempts(0);
        localStorage.removeItem('localFailedAttempts');
        
        const { accessToken, refreshToken, role, shopId, isNewUser, ownerName } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        if (role === 'business') {
          localStorage.setItem('shopId', shopId);
          localStorage.setItem('ownerName', ownerName || shopId);
          if (isNewUser) {
            navigate('/register?role=business', { state: { shopData: response.data, step: 3 } });
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate(`/u/${shopId}`);
        }
      }
    } catch (err) {
      if (!err.response || err.response.status === 429) {
        triggerLockout();
      } else {
        setError("Google Login failed.");
      }
    }
  };

  return (
    <>
      {/* 🔴 LOCKOUT SCREEN OVERLAY */}
      {lockoutTimer > 0 && (
        <div style={lockoutOverlayStyle}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🛡️</div>
          <h1 style={{ color: '#f87171', margin: '0 0 10px 0' }}>Access Secured</h1>
          <p style={{ color: '#cbd5e1', marginBottom: '20px', maxWidth: '340px', lineHeight: '1.5', fontSize: '15px' }}>
            This account has been temporarily locked due to multiple failed login attempts or an active external network attack.
          </p>
          
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff', padding: '15px 35px', background: 'rgba(248, 113, 113, 0.1)', border: '2px solid #f87171', borderRadius: '12px', marginBottom: '30px' }}>
             {Math.floor(lockoutTimer / 60)}m {lockoutTimer % 60}s
          </div>

          {/* 🟢 THE ESCAPE HATCH: Allows real owners to break out of the local lockdown immediately using email verification */}
          <div style={{ borderTop: '1px solid #334155', paddingTop: '25px', width: '100%', maxWidth: '320px' }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '15px' }}>Are you the legitimate account owner?</p>
            <button 
              onClick={() => {
                localStorage.removeItem('lockoutUntil'); // Clean local browser lock state
                navigate('/forgot-password'); // Route out securely
              }} 
              style={{ ...btnStyle, background: '#2563eb', width: '100%', padding: '12px' }}
            >
              🔓 Unlock Instant via OTP
            </button>
          </div>
        </div>
      )}

      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', color: '#0f172a', margin: '0' }}>Subhams Xerox</h2>
        </div>

        {isBusiness ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required disabled={lockoutTimer > 0} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required disabled={lockoutTimer > 0} />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-5px' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
                Forgot Password?
              </Link>
            </div>
            
            {error && <p style={errorStyle}>{error}</p>}
            
            <button type="submit" disabled={loading || lockoutTimer > 0} style={{ ...btnStyle, background: lockoutTimer > 0 ? '#94a3b8' : '#0f172a' }}>
               {lockoutTimer > 0 ? "Locked" : "Sign In"}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '25px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '18px' }}>Customer Print Portal</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                  No sign-up, no login, and no passwords required. Just upload your files, pay securely, and print instantly!
              </p>
              <button onClick={() => navigate('/u')} style={{ ...btnStyle, background: '#10b981', width: '100%' }}>
                  🚀 Enter Upload Portal
              </button>
          </div>
        )}

        {isBusiness && (
          <>
              <div style={dividerStyle}><span>OR</span></div>
              <div style={{ display: 'flex', justifyContent: 'center', minHeight: '40px' }}>
                  {clientId ? (
                      <GoogleOAuthProvider clientId={clientId}>
                          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed")} theme="outline" shape="pill" />
                      </GoogleOAuthProvider>
                  ) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Loading...</span>
                  )}
              </div>
              <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '14px' }}>
                  New to Subhams? <Link to={`/register?role=business`} style={{ color: '#2563eb', fontWeight: 'bold' }}>Register Here</Link>
              </p>
          </>
        )}
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

const containerStyle = { maxWidth: '420px', margin: '80px auto', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' };
const btnStyle = { padding: '14px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: '600' };
const dividerStyle = { display: 'flex', alignItems: 'center', margin: '25px 0', color: '#cbd5e1', borderBottom: '1px solid #e2e8f0', lineHeight: '0.1em' };
const errorStyle = { color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: 0, fontWeight: 'bold' };