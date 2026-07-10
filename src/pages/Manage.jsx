import  { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api'; 

export default function Manage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [otp, setOtp] = useState('');
  const [agentKey, setAgentKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  // 🚀 SYNCHRONOUS LOCK: Prevents the double-fire race condition
  const isProcessing = useRef(false);

  // 🟢 COOLDOWN STATE
  const [cooldown, setCooldown] = useState(() => {
    const saved = localStorage.getItem('keyCooldown');
    return saved ? Math.max(0, Math.floor((parseInt(saved) - Date.now()) / 1000)) : 0;
  });

  // ⏱️ TIMER LOGIC
  useEffect(() => {
    if (cooldown <= 0) {
      localStorage.removeItem('keyCooldown');
      return;
    }
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const requestKeyAccess = async () => {
    // 🚀 Check the steel door
    if (isProcessing.current) return;
    isProcessing.current = true;
    setLoading(true);
    
    try {
      await api.post('/auth/request-otp'); 
      setStep(2);
      setAttemptsLeft(5); 
    } catch (err) {
      console.error(err);
      if (err.response?.status !== 401) alert("Failed to send code.");
    } finally {
      // 🚀 Open the steel door
      isProcessing.current = false;
      setLoading(false);
    }
  };

  const verifyAndReveal = async (e) => {
    e.preventDefault();
    
    // 🚀 Check the steel door (Stops the 5 -> 3 jump)
    if (isProcessing.current) return; 
    isProcessing.current = true;
    setLoading(true);
    
    try {
    const res = await api.post('/auth/verify-otp', { otp: otp.trim() });
      if (res.data.success) {
        setAgentKey(res.data.agentKey); 
      }
    } catch (err) {
      console.error(err);
      
      const backendAttempts = err.response?.data?.attemptsLeft;
      const remaining = backendAttempts !== undefined ? backendAttempts : attemptsLeft - 1;
      
      setAttemptsLeft(remaining);
      
      if (remaining <= 0) {
        alert("Maximum attempts reached. Please request a new OTP.");
        setStep(1); 
        setOtp('');
      } else {
        alert(`Invalid Code. ${remaining} attempts remaining.`);
      }
    } finally {
      // 🚀 Open the steel door
      isProcessing.current = false;
      setLoading(false);
    }
  };

  const handleGenerateNewKey = async () => {
    if (isProcessing.current) return;
    
    const confirmChange = window.confirm("⚠️ WARNING: Generating a new key will instantly disconnect your current setup. Are you sure?");
    if (!confirmChange) return;

    isProcessing.current = true;
    setLoading(true);
    
    try {
      const shopId = localStorage.getItem('shopId'); 
      if (!shopId) {
        alert("CRITICAL: No Shop ID found in browser storage!");
        return;
      }

      const res = await api.post('/shop/regenerate-key', { shopId });
      
      if (res.data.success) {
        setAgentKey(res.data.agentKey);
        const expires = Date.now() + 300000; 
        localStorage.setItem('keyCooldown', expires);
        setCooldown(300);
      }
    } catch (err) {
      console.error("Full Error Object:", err); 
      const serverMessage = err.response?.data?.message || err.message;
      
      if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
      } else {
          alert(`Error: ${serverMessage}`);
      }
    } finally {
      isProcessing.current = false;
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
        `}
      </style>

      <button onClick={() => navigate('/dashboard')} style={backBtnStyle}>
        ← Back to Dashboard
      </button>
    
      <h2 style={{ textAlign: 'center', color: '#0f172a', marginBottom: '5px' }}>Security Vault 🔐</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: 0, marginBottom: '25px' }}>
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
          
          <p style={{ fontSize: '12px', color: attemptsLeft <= 2 ? '#ef4444' : '#64748b', marginTop: '-10px', marginBottom: '15px', fontWeight: 'bold' }}>
            {attemptsLeft} attempts remaining
          </p>

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Verifying... / నిర్ధారిస్తోంది...' : 'Unlock Vault / అన్‌లాక్ చేయండి'}
          </button>
        </form>
      )}

      {agentKey && (
        <>
          {cooldown > 0 ? (
            <div style={premiumNoticeStyle}>
               <div style={{ fontSize: '45px', marginBottom: '10px', animation: 'bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>✅</div>
               <h3 style={{ color: '#065f46', margin: '0 0 10px 0', fontSize: '22px' }}>New Key Activated!</h3>
               <p style={{ color: '#047857', fontSize: '14px', marginBottom: '20px' }}>
                 Your old agent has been instantly disconnected.
               </p>
               
               <div style={{...keyBox, background: '#ffffff', color: '#059669', border: '2px dashed #10b981', animation: 'pulseGlow 2s infinite' }}>
                 {agentKey}
               </div>
               
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(agentKey);
                   alert("Copied successfully! / కాపీ చేయబడింది!");
                 }} 
                 style={{...copyBtn, background: '#10b981', color: 'white'}}
               >
                 📋 Copy New Key
               </button>

               <div style={instructionBox}>
                  <p style={{margin: '0 0 10px 0', fontWeight: '900', color: '#0f172a', fontSize: '15px'}}>How to reconnect:</p>
                  <ol style={{ margin: 0, paddingLeft: '22px', color: '#334155', lineHeight: '1.8', fontSize: '14px', fontWeight: '500' }}>
                    <li>Copy your new key above.</li>
                    <li>Open <b>Subhams Print Agent</b> on your shop PC.</li>
                    <li>Paste the key and click <b>Connect</b>.</li>
                  </ol>
               </div>
               
               <p style={{ marginTop: '20px', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                  Security lockdown ending in: {Math.floor(cooldown / 60)}m {(cooldown % 60).toString().padStart(2, '0')}s
               </p>
            </div>

          ) : (
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

              <div style={{ textAlign: 'center' }}>
                 <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '10px' }}>Think your key was stolen? Generate a new one.</p>
                 <button 
                   onClick={handleGenerateNewKey} 
                   disabled={loading}
                   style={{ ...btnStyle, background: '#ef4444', padding: '12px' }}
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
        </>
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
const premiumNoticeStyle = { background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', padding: '40px 30px', borderRadius: '16px', textAlign: 'center', border: '2px solid #34d399', boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.2)'};
const instructionBox = { background: 'white', padding: '20px', borderRadius: '12px', marginTop: '25px', textAlign: 'left', border: '1px solid #d1fae5', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'};