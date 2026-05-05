import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('https://subhams-vpk.onrender.com/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { accessToken, refreshToken, role, shopId } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        if (role === 'business') {
          localStorage.setItem('shopId', shopId);
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
        googleId: decoded.sub,
        role: roleValue
      });
      
      if (response.data.success) {
        // 🌟 GET THE isNewUser FLAG FROM BACKEND
        const { accessToken, refreshToken, role, shopId, isNewUser } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        if (role === 'business') {
          localStorage.setItem('shopId', shopId);
          
          // 🛑 THE LOGIC CHECK
          if (isNewUser) {
            // Brand new user! Teleport them to the Register page's Step 3 setup screen.
            navigate('/register?role=business', { state: { shopData: response.data, step: 3 } });
          } else {
            // Existing user! Send them straight to the dashboard.
            navigate('/dashboard');
          }
        } else {
          // Individual flow
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

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
        {error && <p style={errorStyle}>{error}</p>}
        <button type="submit" disabled={loading} style={{ ...btnStyle, background: isBusiness ? '#0f172a' : '#10b981' }}>
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>

      <div style={dividerStyle}><span>OR</span></div>
      
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed")} theme="outline" shape="pill" />
      </div>

      <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '14px' }}>
        New to Subhams? <Link to={`/register?role=${roleValue}`} style={{ color: '#2563eb', fontWeight: 'bold' }}>Register Here</Link>
      </p>
    </div>
  );
}

// Styles
const containerStyle = { maxWidth: '420px', margin: '80px auto', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' };
const btnStyle = { padding: '14px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: '600' };
const dividerStyle = { display: 'flex', alignItems: 'center', margin: '25px 0', color: '#cbd5e1', borderBottom: '1px solid #e2e8f0', lineHeight: '0.1em' };
const errorStyle = { color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: 0 };