import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 650);

  // 🛡️ AUTH CHECK
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const shopId = localStorage.getItem('shopId');
    if (token && shopId) navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 650);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '40px 20px' }}>
      
      <h1 style={{ fontSize: '38px', color: '#0f172a', marginBottom: '8px', fontWeight: '800', textAlign: 'center' }}>Subhams Secure</h1>
      <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '15px', textAlign: 'center' }}>
        Select your portal / మీ పోర్టల్‌ను ఎంచుకోండి
      </p>
    {/*    ///login?role=individual/// */}

     {/* PORTAL CARDS */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', width: '100%', maxWidth: '850px', justifyContent: 'center', marginBottom: '50px' }}>
        
        {/* CUSTOMER CARD (Always Visible) */}
        <div onClick={() => navigate('/u')} style={{ ...cardStyle, borderTop: '5px solid #10b981', flex: 1 }}>
          <div style={{ ...iconCircle, background: '#d1fae5', color: '#10b981' }}>📱</div>
          <h3 style={h3Style}>Print Customer</h3>
          <p style={pStyle}>
            <strong style={{ color: '#334155' }}>I want to send files.</strong><br/>
            <span style={teluguStyle}>నేను ఫైల్స్ ప్రింట్ ఇవ్వాలి.</span>
          </p>
          <button style={{ ...btnStyle, background: '#10b981' }}>Send Files Now</button>
        </div>

        {/* SHOP OWNER CARD (Hidden on Mobile) */}
        {!isMobile && (
          <div onClick={() => navigate('/login?role=business')} style={{ ...cardStyle, borderTop: '5px solid #2563eb', flex: 1, position: 'relative' }}>
            <div style={pcBadgeStyle}>🖥️ PC / Laptop Only</div>
            <div style={{ ...iconCircle, background: '#dbeafe', color: '#2563eb', marginTop: '10px' }}>🏢</div>
            <h3 style={h3Style}>Xerox Shop Owner</h3>
            <p style={pStyle}>
              <strong style={{ color: '#334155' }}>Manage my printing.</strong><br/>
              <span style={teluguStyle}>నా షాపుకి వచ్చిన ఫైల్స్ ప్రింట్ తీయాలి.</span>
            </p>
            <p style={noteStyle}>* ఈ పోర్టల్ కంప్యూటర్లో మాత్రమే పనిచేస్తుంది.</p>
            <button style={{ ...btnStyle, background: '#2563eb' }}>Shop Login</button>
          </div>
        )}
        
      </div>
    </div>
  );
}

// STYLES
const cardStyle = { background: '#fff', padding: '35px 25px', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' };
const iconCircle = { width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '16px' };
const h3Style = { margin: '0 0 12px 0', color: '#1e293b', fontSize: '20px', fontWeight: '700' };
const pStyle = { fontSize: '14px', color: '#475569', minHeight: '50px', lineHeight: '1.7', margin: '0 0 15px 0' };
const teluguStyle = { color: '#64748b', fontSize: '13px' };
const btnStyle = { marginTop: 'auto', width: '100%', padding: '12px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' };
const pcBadgeStyle = { position: 'absolute', top: '-12px', background: '#1e293b', color: '#ffffff', padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' };
const noteStyle = { fontSize: '11px', color: '#ef4444', marginTop: '-5px', marginBottom: '15px', fontWeight: '600' };