import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api'; 

export default function Manage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [otp, setOtp] = useState('');
  const [agentKey, setAgentKey] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestKeyAccess = async () => {
    setLoading(true);
    try {
      await api.post('/auth/request-otp'); 
      setStep(2);
    } catch (err) {
      console.error(err);
    // If error is 401, let the app handle the redirect, otherwise alert
      if (err.response?.status !== 401) alert("Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndReveal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { otp });
      if (res.data.success) {
        setAgentKey(res.data.agentKey); // Shows CURRENT key
      }
    } catch (err) {
      console.error(err);
      alert("Invalid Code. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

const handleGenerateNewKey = async () => {
    const confirmChange = window.confirm("⚠️ WARNING: Generating a new key will instantly disconnect your current setup. Are you sure?");
    if (!confirmChange) return;

    setLoading(true);
    try {
    const shopId = localStorage.getItem('shopId'); 
console.log("DEBUG: Sending ShopID to server:", shopId); // 🟢 CHECK THIS IN F12 CONSOLE

if (!shopId) {
    alert("CRITICAL: No Shop ID found in browser storage!");
    return;
}

const res = await api.post('/shop/regenerate-key', { shopId });
      
      if (res.data.success) {
        setAgentKey(res.data.agentKey);
        alert("✨ New Key Generated! Desktop Agent will now disconnect.");
      }
    } catch (err) {
      console.error("Full Error Object:", err); // 🟢 This logs the FULL error in F12 console
      
      // 🟢 THIS IS THE FIX: This extracts the specific message from the server
      const serverMessage = err.response?.data?.message || err.message;
      
      if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
      } else {
          // This will now show "Shop not found" or "Error rotating key" instead of "Server error"
          alert(`Error: ${serverMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
   <div style={containerStyle}>
      {/* 🟢 FIXED: Back button is now inside the container so it aligns perfectly */}
      <button onClick={() => navigate('/dashboard')} style={backBtnStyle}>
        ← Back to Dashboard
      </button>
    
      <h2 style={{ textAlign: 'center', color: '#0f172a', marginBottom: '5px' }}>Security Vault 🔐</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: 0 }}>
        Manage your Device connection key.<br/>
        <span style={{fontSize: '12px', color: '#94a3b8'}}>మీ కనెక్షన్ కీని ఇక్కడ నిర్వహించండి.</span>
      </p>

      {!agentKey && step === 1 && (
        <div style={vaultBox}>
          <p style={{ fontWeight: 'bold', color: '#334155' }}>The Agent Key is encrypted for your safety.</p>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>మీ భద్రత కోసం ఏజెంట్ కీ ఎన్‌క్రిప్ట్ చేయబడింది.</p>
          
          <button onClick={requestKeyAccess} disabled={loading} style={btnStyle}>
            {loading ? 'Sending... / పంపుతోంది...' : 'Request Reveal Code / కోడ్ పొందండి'}
          </button>
        </div>
      )}

      {!agentKey && step === 2 && (
        <form onSubmit={verifyAndReveal} style={vaultBox}>
          <p style={{ fontWeight: 'bold', color: '#334155', margin: '0 0 5px 0' }}>Check your email for the verification code.</p>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', marginTop: 0 }}>దయచేసి మీ ఇమెయిల్‌కి వచ్చిన కోడ్‌ను తనిఖీ చేయండి.</p>
          
          <input 
            type="text" 
            placeholder="Enter 6-Digit OTP" 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)} 
            style={inputStyle} 
            required
          />
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Verifying... / నిర్ధారిస్తోంది...' : 'Unlock Vault / అన్‌లాక్ చేయండి'}
          </button>
        </form>
      )}

      {agentKey && (
        <div style={{ ...vaultBox, background: '#0f172a', color: '#fff', border: '2px solid #334155' }}>
          <h3 style={{ color: '#facc15', margin: '0 0 5px 0' }}>Your Current Agent Key 🔑</h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 15px 0' }}>
            Paste this in your Subhams Desktop Agent.<br/>
            దీన్ని మీ సుభమ్స్ డెస్క్‌టాప్ ఏజెంట్‌లో పేస్ట్ చేయండి.
          </p>
          
          <div style={keyBox}>{agentKey}</div>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(agentKey);
              alert("Copied! / కాపీ చేయబడింది!");
            }} 
            style={copyBtn}
          >
            📋 Copy to Clipboard / కాపీ చేయండి
          </button>

          <hr style={{ borderColor: '#475569', margin: '20px 0' }} />

          {/* 🌟 THE NEW GENERATE BUTTON */}
          <div style={{ textAlign: 'center' }}>
             <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '10px' }}>Think your key was stolen? Generate a new one.</p>
             <button 
               onClick={handleGenerateNewKey} 
               disabled={loading}
               style={{ ...btnStyle, background: '#ef4444', padding: '10px' }}
             >
               {loading ? 'Generating...' : '⚠️ Generate New Key / కొత్త కీ సృష్టించండి'}
             </button>
          </div>

          <div style={warningBox}>
            <h4 style={{ color: '#b91c1c', margin: '0 0 8px 0', fontSize: '15px' }}>⚠️ CRITICAL SECURITY WARNING</h4>
            <p style={{ color: '#7f1d1d', fontSize: '13px', margin: '0 0 10px 0', lineHeight: '1.5' }}>
              Your <b>Agent Key</b> gives full control over your shop's printing queue. 
              <b> NEVER share this key with anyone.</b>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const containerStyle = { maxWidth: '500px', margin: '60px auto', padding: '20px', fontFamily: "'Inter', sans-serif" };
const backBtnStyle = { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '10px', fontSize: '14px', fontWeight: '500' };
const vaultBox = { background: '#fff', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', border: '1px solid #e2e8f0' };
const inputStyle = { width: '100%', padding: '15px', borderRadius: '8px', border: '2px solid #cbd5e1', marginBottom: '20px', textAlign: 'center', fontSize: '20px', letterSpacing: '6px', fontWeight: 'bold', boxSizing: 'border-box', outline: 'none' };
const btnStyle = { width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'background 0.2s' };
const keyBox = { background: '#1e293b', color: '#10b981', padding: '20px', borderRadius: '8px', wordBreak: 'break-all', fontFamily: 'monospace', margin: '20px 0', border: '1px solid #475569', fontSize: '16px' };
const copyBtn = { width: '100%', padding: '12px', background: '#facc15', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' };
const warningBox = { background: '#fef2f2', border: '1px solid #ef4444', padding: '20px', borderRadius: '8px', marginTop: '25px', textAlign: 'left' };