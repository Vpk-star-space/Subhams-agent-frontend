import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
// 🛡️ Redirect if already logged in, but ONLY if they are a business
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const shopId = localStorage.getItem('shopId');
    
    if (token && shopId) {
      navigate('/dashboard');
    }
  }, [navigate]);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '42px', color: '#0f172a', marginBottom: '10px' }}>Subhams Xerox</h1>
      <p style={{ color: '#64748b', marginBottom: '40px' }}>Choose your portal / మీ పోర్టల్‌ను ఎంచుకోండి</p>

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 600 ? '1fr 1fr' : '1fr', gap: '20px', width: '90%', maxWidth: '800px' }}>
        
        {/* 👤 INDIVIDUAL SENDER */}
        {/* ✅ FIX: Added ?role=individual */}
        <div onClick={() => navigate('/login?role=individual')} style={cardStyle}>
          <div style={iconCircle}>👤</div>
          <h3>Individual Sender</h3>
          <p style={pStyle}>I want to upload and print files. <br/> నేను ఫైళ్ళను ప్రింట్ చేయాలి.</p>
          <button style={btnStyle}>Continue as User</button>
        </div>

        {/* 🏢 BUSINESS RECEIVER */}
        {/* ✅ FIX: Added ?role=business */}
        <div onClick={() => navigate('/login?role=business')} style={{ ...cardStyle, border: '2px solid #2563eb' }}>
          <div style={{ ...iconCircle, background: '#dbeafe', color: '#2563eb' }}>🏢</div>
          <h3>Business Receiver</h3>
          <p style={pStyle}>Manage my Xerox shop & printer. <br/> నా జిరాక్స్ షాపును నిర్వహించాలి.</p>
          <button style={{ ...btnStyle, background: '#2563eb' }}>Owner Login</button>
        </div>

      </div>
    </div>
  );
}

const cardStyle = { background: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', transition: '0.3s' };
const iconCircle = { width: '60px', height: '60px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 15px' };
const pStyle = { fontSize: '13px', color: '#64748b', minHeight: '40px' };
const btnStyle = { marginTop: '15px', width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 'bold' };