import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'; 
import { jwtDecode } from 'jwt-decode';            

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isBusiness = queryParams.get('role') === 'business';
  const roleValue = isBusiness ? 'business' : 'individual';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // 🌟 Initialize state directly from the teleport location data
  const [step, setStep] = useState(location.state?.step === 3 ? 3 : 1); 
  const [shopData, setShopData] = useState(location.state?.step === 3 ? location.state.shopData : null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAgentConnected, setIsAgentConnected] = useState(false); // 🟢 NEW: Tracks the checkbox
  
  // 🟢 State to hold the Google Client ID
  const [clientId, setClientId] = useState('');

  // 🟢 Fetch the Google Client ID securely on load
  useEffect(() => {
    axios.get('https://subhams-vpk.onrender.com/api/auth/google-client-id')
      .then(res => {
          if (res.data.success) {
              setClientId(res.data.clientId);
          }
      })
      .catch(err => console.error("Failed to fetch Google Client ID:", err));
  }, []);

  // --- MANUAL REGISTRATION LOGIC ---
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('https://subhams-vpk.onrender.com/api/auth/request-register-otp', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('https://subhams-vpk.onrender.com/api/auth/verify-register', { 
        email, 
        otp, 
        password,
        role: roleValue,
         name
      });
      
      if (response.data.success) {
        if (isBusiness) {
          setShopData(response.data);
          setStep(3); // Show Business Assets and Download
        } else {
          alert("Account created successfully!");
          navigate('/login?role=individual');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- 🌟 GOOGLE REGISTRATION LOGIC 🌟 ---
  const handleGoogleRegister = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const response = await axios.post('https://subhams-vpk.onrender.com/api/auth/google-login', {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
        role: roleValue
      });
      
      if (response.data.success) {
        if (isBusiness) {
          setShopData(response.data); 
          setStep(3); 
        } else {
          alert("Account created successfully!");
          navigate('/login?role=individual');
        }
      }
    } catch (err) {
      console.error("Google Registration Error:", err);
      setError("Google Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- UI RENDER: STEP 1 ---
  if (step === 1) {
    return (
      <div style={containerStyle}>
        <h2 style={titleStyle}>{isBusiness ? 'Register Shop' : 'Create Account'}</h2>
        <p style={subTitleStyle}>Step 1: Email Verification</p>
        
        <form onSubmit={handleRequestOTP} style={formStyle}>
          <input type="text" placeholder="Your Name " value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required />
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
          {error && <p style={errorStyle}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btnStyle, background: isBusiness ? '#2563eb' : '#10b981' }}>
            {loading ? 'Sending...' : 'Get Verification Code'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '25px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          <span style={{ margin: '0 15px', color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', minHeight: '40px' }}>
          {clientId ? (
              <GoogleOAuthProvider clientId={clientId}>
                  <GoogleLogin onSuccess={handleGoogleRegister} onError={() => setError("Google Registration Failed")} theme="outline" shape="pill" />
              </GoogleOAuthProvider>
          ) : (
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Loading Secure Login...</span>
          )}
        </div>

        <p style={{textAlign: 'center', marginTop: '20px', fontSize: '14px'}}>
          Already have an account? <Link to={`/login?role=${roleValue}`} style={{color: '#2563eb', fontWeight: 'bold'}}>Login</Link>
        </p>
      </div>
    );
  }

  // --- UI RENDER: STEP 2 ---
  if (step === 2) {
    return (
      <div style={containerStyle}>
        <h2 style={titleStyle}>Verify & Secure</h2>
        <p style={subTitleStyle}>Code sent to: {email}</p>
        <form onSubmit={handleFinalizeRegister} style={formStyle}>
          <input type="text" placeholder="6-Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
          {error && <p style={errorStyle}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btnStyle, background: isBusiness ? '#2563eb' : '#10b981' }}>
            {loading ? 'Finalizing...' : 'Complete Registration'}
          </button>
          <button type="button" onClick={() => setStep(1)} style={backBtnStyle}>Back to Email</button>
        </form>
      </div>
    );
  }
// --- UI RENDER: STEP 3 (SETUP & DOWNLOAD) ---
  return (
    <div style={revealContainerStyle}>
      <h1 style={{ color: '#10b981', textAlign: 'center' }}>Registration Complete! 🎉</h1>
      
      <div style={gridStyle}>
        <div style={cardStyle}>
          <h3>Customer QR Code</h3>
          <QRCodeSVG value={`${window.location.origin}/u/${shopData?.shopId}`} size={150} />
          <p style={{fontWeight: 'bold', marginTop: '10px'}}>ID: {shopData?.shopId}</p>
          <button 
            onClick={() => { navigator.clipboard.writeText(shopData?.shopId); alert("Shop ID Copied!"); }} 
            style={{ ...copyBtnStyle, marginTop: '10px', backgroundColor: '#3b82f6', color: 'white' }}
          >
            📋 Copy Shop ID
          </button>
        </div>

        <div style={{ ...cardStyle, background: '#0f172a', color: '#fff' }}>
          <h3 style={{ color: '#facc15' }}>Agent Key 🔑</h3>
          <div style={keyBoxStyle}>{shopData?.agentKey}</div>
          <button 
            onClick={() => { navigator.clipboard.writeText(shopData?.agentKey); alert("Agent Key Copied!"); }} 
            style={copyBtnStyle}
          >
            📋 Copy Key
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center', padding: '25px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
        <h3 style={{ color: '#0f172a', marginBottom: '10px', marginTop: 0 }}>Next Step: Connect Your Printer</h3>
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.95rem' }}>
          Download the Windows Agent, install it on your shop's computer, and paste your Agent Key to connect your printer to the cloud.
        </p>

        {/* 🟢 NEW: FILE SIZE & TIME WARNING */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', maxWidth: '500px', margin: '0 auto 15px auto', textAlign: 'left' }}>
            <p style={{ fontSize: '13px', color: '#b45309', margin: '0 0 5px 0', fontWeight: 'bold' }}>
                ⏳ Note: Download may take a few minutes (High secure File)
            </p>
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: '1.4' }}>
                Depending on your internet connection speed, this secure file will take some time to download. Please be patient and do not close the window.<br/>
                <span style={{ fontSize: '11px', fontWeight: 'normal' }}>మీ ఇంటర్నెట్ వేగాన్ని బట్టి ఈ ఫైల్ డౌన్‌లోడ్ అవ్వడానికి కొద్ది సమయం పట్టవచ్చు. దయచేసి వేచి ఉండండి, విండోను క్లోజ్ చేయవద్దు.</span>
            </p>
        </div>
        
        {/* 🟢 GITHUB RELEASES DOWNLOAD LINK */}
        <a 
          href="https://github.com/Vpk-star-space/Subhams-agent-frontend/releases/download/v2.0.0/Install-SubhamsAgent.exe" 
          style={{
            backgroundColor: '#2563eb', color: 'white', padding: '14px 28px', 
            borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold',
            display: 'inline-block', fontSize: '1.1rem',
            boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)', transition: 'transform 0.2s',
            marginBottom: '25px'
          }}
        >
          ⬇️ Install Subhams Agent (.exe)
        </a>

        {/* 🟢 NEW: ENHANCED 100% SECURITY TRUST MANUAL */}
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '20px', textAlign: 'left', maxWidth: '500px', margin: '0 auto', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                <span style={{ fontSize: '20px' }}>🛡️</span> 100% Secure & Verified Software
            </h4>
            <p style={{ fontSize: '13px', color: '#15803d', margin: '0 0 12px 0', lineHeight: '1.5', fontWeight: '500' }}>
                Subhams Agent is an enterprise-grade, highly secure business tool. Because it is private business software, your browser or Windows Defender may flag it as "unrecognized". <strong>Please completely ignore these warnings.</strong><br/><br/>
                <span style={{ fontSize: '12px', fontWeight: 'normal' }}>ఇది 100% సురక్షితమైన బిజినెస్ సాఫ్ట్‌వేర్. బ్రౌజర్ లేదా Windows Defender ఏవైనా వార్నింగ్స్ చూపిస్తే, దయచేసి వాటిని విస్మరించండి (పట్టించుకోకండి).</span>
            </p>
            
            <div style={{ background: '#dcfce3', padding: '15px', borderRadius: '8px', border: '1px dashed #4ade80' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#14532d', fontSize: '14px' }}>Installation Guide / ఇన్‌స్టాల్ చేసే విధానం:</h5>
                <ol style={{ fontSize: '13px', color: '#166534', margin: 0, paddingLeft: '20px', fontWeight: 'bold', lineHeight: '1.6' }}>
                    <li>If Chrome blocks the download: Click <u><strong>"Keep"</strong></u> (ఉంచండి).</li>
                    <li>Open the downloaded `.exe` file.</li>
                    <li>When the blue Windows warning appears, click <u><strong>"More info"</strong></u> (మరింత సమాచారం).</li>
                    <li>Click the <u><strong>"Run anyway"</strong></u> (అలాగే రన్ చేయండి) button.</li>
                </ol>
            </div>
        </div>

        {/* 🟢 BILINGUAL VERIFICATION CHECKBOX AREA */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px', textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a', fontSize: '16px' }}>Final Verification / చివరి నిర్ధారణ</h4>
            
            <p style={{ fontSize: '13.5px', color: '#1e40af', margin: '0 0 8px 0', lineHeight: '1.4', fontWeight: '500' }}>
                Did you install the Agent and paste your Key? It should display <strong style={{color: '#16a34a'}}>Online</strong> on your shop's computer.
            </p>
            <p style={{ fontSize: '12.5px', color: '#3b82f6', margin: '0 0 15px 0', lineHeight: '1.5' }}>
                మీరు ఏజెంట్‌ను ఇన్‌స్టాల్ చేసి, మీ కీని పేస్ట్ చేశారా? మీ షాప్ కంప్యూటర్‌లో అది <strong style={{color: '#16a34a'}}>'Online'</strong> అని చూపించాలి.
            </p>

            <div style={{ background: '#dbeafe', padding: '10px', borderRadius: '6px', marginBottom: '15px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#1e3a8a', fontWeight: 'bold' }}>Not connecting? (కనెక్ట్ అవ్వడం లేదా?)</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6' }}>If it does not show online, please click the <strong>"Ask Subhams"</strong> icon on your screen for support. <br/> ఆన్‌లైన్ చూపించకపోతే, సహాయం కోసం మీ స్క్రీన్‌పై ఉన్న <strong>"Ask Subhams"</strong> ఐకాన్‌ని క్లిక్ చేయండి.</p>
                </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: isAgentConnected ? '#dcfce3' : '#fff', padding: '12px', borderRadius: '8px', border: isAgentConnected ? '1px solid #86efac' : '1px solid #94a3b8', transition: 'all 0.2s' }}>
                <input 
                    type="checkbox" 
                    checked={isAgentConnected} 
                    onChange={(e) => setIsAgentConnected(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: isAgentConnected ? '#166534' : '#334155', fontWeight: 'bold' }}>
                    I confirm the Desktop Agent is showing Online.<br/>
                    <span style={{ fontSize: '12px', fontWeight: 'normal' }}>డెస్క్‌టాప్ ఏజెంట్ ఆన్‌లైన్‌లో ఉందని నేను నిర్ధారిస్తున్నాను.</span>
                </span>
            </label>
        </div>
      </div>

      {/* 🟢 BUTTON IS DISABLED UNTIL CHECKBOX IS TICKED */}
      <button 
        onClick={() => navigate('/login?role=business')} 
        disabled={!isAgentConnected}
        style={{
            ...finishBtnStyle, 
            marginTop: '30px',
            background: isAgentConnected ? '#10b981' : '#cbd5e1', 
            color: isAgentConnected ? 'white' : '#64748b',
            cursor: isAgentConnected ? 'pointer' : 'not-allowed',
            boxShadow: isAgentConnected ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'none'
        }}
      >
        {isAgentConnected ? 'Go to Login Dashboard 🚀' : 'Please confirm connection to continue 🔒'}
      </button>
    </div>
  );
}

// Styles
const containerStyle = { maxWidth: '420px', margin: '80px auto', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' };
const titleStyle = { fontSize: '28px', color: '#0f172a', textAlign: 'center', marginBottom: '5px' };
const subTitleStyle = { color: '#64748b', fontSize: '14px', textAlign: 'center', marginBottom: '20px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' };
const btnStyle = { padding: '14px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' };
const errorStyle = { color: '#ef4444', fontSize: '13px', margin: '0', fontWeight: '500' };
const backBtnStyle = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', marginTop: '10px' };
const revealContainerStyle = { maxWidth: '800px', margin: '40px auto', padding: '40px', background: '#fff', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' };
const cardStyle = { padding: '25px', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center' };
const keyBoxStyle = { background: '#1e293b', color: '#10b981', padding: '10px', borderRadius: '8px', wordBreak: 'break-all', margin: '15px 0', fontFamily: 'monospace' };
const copyBtnStyle = { width: '100%', padding: '10px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const finishBtnStyle = { width: '100%', padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', marginTop: '30px', fontWeight: 'bold', cursor: 'pointer' };