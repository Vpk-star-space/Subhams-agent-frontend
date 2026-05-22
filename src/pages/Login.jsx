import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
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

  useEffect(() => {
    axios.get('https://subhams-vpk.onrender.com/api/auth/google-client-id')
      .then(res => {
          if (res.data.success) {
              setClientId(res.data.clientId);
          }
      })
      .catch(err => console.error("Failed to fetch Google Client ID:", err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('https://subhams-vpk.onrender.com/api/auth/login', { email, password });
      
      if (response.data.success) {
        // 🛑 THE FIX: Extract ownerName (if it exists) alongside the rest
        const { accessToken, refreshToken, role, shopId, ownerName } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        if (role === 'business') {
          localStorage.setItem('shopId', shopId);
          // Save the name if the backend sends it, otherwise save the shopId as a backup identity
          localStorage.setItem('ownerName', ownerName || shopId); 
          navigate('/dashboard');
        } else {
          navigate('/u'); 
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const response = await axios.post('https://subhams-vpk.onrender.com/api/auth/google-login', {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
        role: roleValue
      });
      
      if (response.data.success) {
        // 🛑 THE FIX: Extract ownerName here too
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
      console.error("Google Login Error:", err);
      setError("Google Login failed.");
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', color: '#0f172a', margin: '0' }}>Subhams Xerox</h2>
        <p style={{ color: isBusiness ? '#2563eb' : '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
          {isBusiness ? 'Business Dashboard' : 'User Print Portal'}
        </p>
      </div>

      {/* 🟢 ONLY SHOW LOGIN FORM IF BUSINESS, ELSE SHOW "ENTER AS GUEST" */}
      {isBusiness ? (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
          {error && <p style={errorStyle}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btnStyle, background: '#0f172a' }}>Sign In</button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <p style={{ color: '#065f46', marginBottom: '20px' }}>Welcome! You can upload your documents instantly without an account.</p>
            <button onClick={() => navigate('/u')} style={{ ...btnStyle, background: '#10b981', width: '100%' }}>
                🚀 Enter Upload Portal
            </button>
        </div>
      )}

      {/* Only show OR and Google login for Business users to keep it clean */}
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
  );
}

// Styles
const containerStyle = { maxWidth: '420px', margin: '80px auto', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' };
const btnStyle = { padding: '14px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: '600' };
const dividerStyle = { display: 'flex', alignItems: 'center', margin: '25px 0', color: '#cbd5e1', borderBottom: '1px solid #e2e8f0', lineHeight: '0.1em' };
const errorStyle = { color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: 0 };