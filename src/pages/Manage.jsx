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

  // 🚀 SYNCHRONOUS LOCK
  const isProcessing = useRef(false);

  // 🟢 NEW: VAULT SPECIFIC LOCKOUT STATE (15 Minutes)
  const [vaultLockedUntil, setVaultLockedUntil] = useState(() => {
    const saved = localStorage.getItem('vaultLockTime');
    return saved ? Math.max(0, Math.floor((parseInt(saved) - Date.now()) / 1000)) : 0;
  });

  // 🟢 AGENT KEY COOLDOWN STATE
  const [cooldown, setCooldown] = useState(() => {
    const saved = localStorage.getItem('keyCooldown');
    return saved ? Math.max(0, Math.floor((parseInt(saved) - Date.now()) / 1000)) : 0;
  });

  // ⏱️ VAULT LOCKOUT TIMER LOGIC
  useEffect(() => {
    if (vaultLockedUntil <= 0) {
      localStorage.removeItem('vaultLockTime');
      return;
    }
    const timer = setInterval(() => setVaultLockedUntil((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [vaultLockedUntil]);

  // ⏱️ KEY COOLDOWN TIMER LOGIC
  useEffect(() => {
    if (cooldown <= 0) {
      localStorage.removeItem('keyCooldown');
      return;
    }
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

// 🚀 UPDATED: Now reads the exact backend time and doesn't restart on click!
  const triggerVaultLockout = (backendMessage = "") => {
    let lockSeconds = 15 * 60; // Default to 15 minutes

    // 1. Extract the remaining minutes from the backend message (e.g., "... in 4 minutes")
    const match = backendMessage.match(/(\d+)/);
    if (match) {
      lockSeconds = parseInt(match[0], 10) * 60;
    }

    // 2. Check if a timer is already running in the browser memory
    const savedEndTime = localStorage.getItem('vaultLockTime');
    const timeRemaining = savedEndTime ? Math.floor((parseInt(savedEndTime) - Date.now()) / 1000) : 0;

    // 3. If a timer is already running locally, DO NOT reset the seconds! Keep counting down smoothly.
    if (timeRemaining > 0 && Math.abs(timeRemaining - lockSeconds) < 120) {
      lockSeconds = timeRemaining;
    }

    setVaultLockedUntil(lockSeconds);
    localStorage.setItem('vaultLockTime', Date.now() + (lockSeconds * 1000));
    setStep(1);
    setOtp('');
  };

  const requestKeyAccess = async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setLoading(true);
    
    try {
      await api.post('/auth/request-otp'); 
      setStep(2);
      setAttemptsLeft(5); 
    } catch (err) {
      console.error(err);
      if (err.response?.status === 429) {
        // 🚀 THE FIX: Pass the backend message into the lockout trigger!
        triggerVaultLockout(err.response.data.message);
      } else if (err.response?.status !== 401) {
        alert("Failed to send code.");
      }
    } finally {
      isProcessing.current = false;
      setLoading(false);
    }
  };

  const verifyAndReveal = async (e) => {
    e.preventDefault();
    
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
      
      if (remaining <= 0 || err.response?.status === 429) {
        // 🚀 THE FIX: Pass the backend message into the lockout trigger!
        triggerVaultLockout(err.response?.data?.message);
      } else {
        alert(err.response?.data?.message || `Invalid Code. ${remaining} attempts remaining.`);
      }
    } finally {
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
          @keyframes slideDownWarning {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {/* THIS BUTTON REMAINS ACCESSIBLE EVEN IF THE VAULT IS LOCKED */}
      <button onClick={() => navigate('/dashboard')} style={backBtnStyle}>
        ← Back to Dashboard
      </button>
    
      <h2 style={{ textAlign: 'center', color: '#0f172a', marginBottom: '5px' }}>Security Vault 🔐</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: 0, marginBottom: '25px' }}>
        Manage your Device connection key.<br/>
        <span style={{fontSize: '12px', color: '#94a3b8'}}>మీ కనెక్షన్ కీని ఇక్కడ నిర్వహించండి.</span>
      </p>

      {/* 🔴 INLINE VAULT LOCKOUT SCREEN */}
      {vaultLockedUntil > 0 ? (
        <div style={inlineLockoutStyle}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛡️</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#7f1d1d', fontSize: '20px', fontWeight: '900' }}>
            VAULT LOCKED
          </h3>
          <p style={{ margin: '0 0 15px 0', color: '#991b1b', fontSize: '14px', fontWeight: '500' }}>
            Too many failed attempts. To secure your account, vault access is temporarily paused.
          </p>
          <div style={inlineTimerBox}>
             <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 'bold' }}>
               Time Remaining
             </p>
             <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '2px', fontFamily: 'monospace' }}>
               {Math.floor(vaultLockedUntil / 60).toString().padStart(2, '0')}:{(vaultLockedUntil % 60).toString().padStart(2, '0')}
             </div>
          </div>
          <p style={{ marginTop: '15px', fontSize: '12px', color: '#b91c1c' }}>
            You can still use the rest of the app. Please click 'Back to Dashboard'.
          </p>
        </div>
      ) : (
        /* NORMAL VAULT CONTENT */
        <>
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
        </>
      )}
    </div>
  );
}

// --- Styles ---
const containerStyle = { maxWidth: '500px', margin: '60px auto', padding: '20px', fontFamily: "'Inter', sans-serif" };
const backBtnStyle = { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', marginBottom: '10px', fontSize: '15px', fontWeight: '700' };
const vaultBox = { background: '#fff', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', border: '1px solid #e2e8f0' };
const inputStyle = { width: '100%', padding: '15px', borderRadius: '8px', border: '2px solid #cbd5e1', marginBottom: '20px', textAlign: 'center', fontSize: '20px', letterSpacing: '6px', fontWeight: 'bold', boxSizing: 'border-box', outline: 'none' };
const btnStyle = { width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'background 0.2s' };
const keyBox = { background: '#1e293b', color: '#10b981', padding: '20px', borderRadius: '8px', wordBreak: 'break-all', fontFamily: 'monospace', margin: '20px 0', border: '1px solid #475569', fontSize: '16px' };
const copyBtn = { width: '100%', padding: '12px', background: '#facc15', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' };
const warningBox = { background: '#fef2f2', border: '1px solid #ef4444', padding: '20px', borderRadius: '8px', marginTop: '25px', textAlign: 'left' };
const premiumNoticeStyle = { background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', padding: '40px 30px', borderRadius: '16px', textAlign: 'center', border: '2px solid #34d399', boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.2)'};
const instructionBox = { background: 'white', padding: '20px', borderRadius: '12px', marginTop: '25px', textAlign: 'left', border: '1px solid #d1fae5', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'};

// NEW: Inline Lockout Styles
const inlineLockoutStyle = {
  background: '#fef2f2',
  border: '2px solid #f87171',
  borderRadius: '16px',
  padding: '40px 30px',
  textAlign: 'center',
  animation: 'slideDownWarning 0.4s ease-out',
  boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15)'
};

const inlineTimerBox = {
  background: '#7f1d1d',
  padding: '15px',
  borderRadius: '12px',
  display: 'inline-block',
  minWidth: '150px',
  boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.3)'
};