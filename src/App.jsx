import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Manage from './pages/Manage';
import CustomerUpload from './pages/CustomerUpload';

// 🤖 1. IMPORT THE NEW CHATBOT HERE
import XeroxChatbot from './components/XeroxChatbot'; 

// 🛑 THE MASTER SWITCH: Change to 'true' to lock down the app for updates!
const IS_MAINTENANCE_MODE = false; 
const TARGET_LAUNCH_DATE = new Date("2026-05-06T18:00:00"); // Set your target launch time here

// 🛡️ THE PROFESSIONAL BOUNCER
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken'); 
  if (!token) {
    return <Navigate to="/login" replace />; 
  }
  return children; 
};



// 🚧 THE MAINTENANCE MODE SCREEN
// =====================================================================
const MaintenanceScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Make the clock tick live every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.bootContainer}>
      <div style={styles.shieldContainer}>
        <div style={styles.spinnerOuter} style={{...styles.spinnerOuter, borderColor: 'rgba(245, 158, 11, 0.2)', borderTopColor: '#f59e0b', animationDuration: '3s'}}></div>
        <div style={styles.shieldIcon}>🛠️</div>
      </div>
      
      <h1 style={{...styles.brandTitle, color: '#fcd34d', marginBottom: '10px'}}>
        SYSTEM MAINTENANCE<br/>
        <span style={{fontSize: '18px', color: '#fbbf24', display: 'block', marginTop: '5px'}}>సిస్టమ్ నిర్వహణ</span>
      </h1>
      
      <p style={{...styles.subText, fontSize: '14px', maxWidth: '500px', marginBottom: '30px', color: '#cbd5e1'}}>
        We are currently deploying the latest Subhams Security Updates to improve your printing experience. The portal is temporarily locked. <br/><br/>
        <span style={{color: '#94a3b8', fontSize: '13px'}}>మీ ప్రింటింగ్ అనుభవాన్ని మెరుగుపరచడానికి సిస్టమ్ అప్‌డేట్ చేయబడుతోంది. పోర్టల్ తాత్కాలికంగా లాక్ చేయబడింది. దయచేసి వేచి ఉండండి.</span>
      </p>

      <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '500px', marginBottom: '25px' }}>
        {/* Live Current Time Box (RED THEME) */}
        <div style={{ flex: 1, background: '#450a0a', padding: '15px', borderRadius: '12px', border: '1px solid #991b1b', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#fca5a5', fontWeight: 'bold', letterSpacing: '1px' }}>
            MAINTENANCE / నిర్వహణ సమయం
          </p>
          <div style={{ fontSize: '20px', color: '#ef4444', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Target Launch Box (GREEN THEME) */}
        <div style={{ flex: 1, background: '#022c22', padding: '15px', borderRadius: '12px', border: '1px solid #065f46', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#6ee7b7', fontWeight: 'bold', letterSpacing: '1px' }}>
            ESTIMATED LAUNCH / ప్రారంభ సమయం
          </p>
          <div style={{ fontSize: '15px', color: '#10b981', fontWeight: 'bold', marginBottom: '2px' }}>
            {TARGET_LAUNCH_DATE.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '12px', color: '#34d399' }}>
            {TARGET_LAUNCH_DATE.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* 🌟 Personal Thank You Section */}
      <div style={{ textAlign: 'center', marginBottom: '30px', background: 'rgba(30, 41, 59, 0.5)', padding: '15px 30px', borderRadius: '12px', border: '1px dashed #475569' }}>
        <p style={{ color: '#e2e8f0', fontSize: '14px', margin: '0 0 5px 0', fontWeight: '500' }}>
          Thank you for your patience!
        </p>
        <p style={{ color: '#e2e8f0', fontSize: '14px', margin: '0 0 10px 0', fontWeight: '500' }}>
          మీ సహనానికి ధన్యవాదాలు!
        </p>
        <p style={{ color: '#facc15', fontSize: '13px', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>
          —   Venkata Pavan Kumar
        </p>
      </div>

      {/* 🔗 App Network Links */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Explore Our Network</p>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="https://subhams-vpk.vercel.app/" target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
            <span style={{ fontSize: '16px', marginRight: '5px' }}>🚀</span> Subhams App
          </a>
          <a href="https://bhavyams-vendor-hub-vpk.vercel.app/" target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
            <span style={{ fontSize: '16px', marginRight: '5px' }}>🏬</span> Bhavyams Vendor Hub
          </a>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// 🚀 THE WAKE-UP BOOTLOADER UI
// =====================================================================
const ServerBootloader = () => {
  const [loadingText, setLoadingText] = useState("Initializing Subhams Security Protocol...");

  useEffect(() => {
    const texts = [
      "Initializing Subhams Security Protocol...",
      "Waking up cloud infrastructure (This may take few sec)...",
      "Establishing encrypted connection...",
      "Verifying secure hardware tokens...",
      "Booting up print queue engines...",
      "Waiting for Render cloud server to respond..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setLoadingText(texts[i]);
    }, 4000); 
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.bootContainer}>
      <style>
        {`
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={styles.shieldContainer}>
        <div style={styles.spinnerOuter}></div>
        <div style={styles.shieldIcon}>🔐</div>
      </div>
      
      <h1 style={styles.brandTitle}>SUBHAMS SECURE AGENT</h1>
      
      <div style={styles.loadingBarContainer}>
        <div style={styles.loadingBarInner}></div>
      </div>
      
      <p style={styles.statusText}>{loadingText}</p>
      <p style={styles.subText}>If this is the first visit in 15 minutes, the server is waking up from sleep.</p>
    </div>
  );
};

// =====================================================================
// 🌐 MAIN APP COMPONENT
// =====================================================================
export default function App() {
  const [isServerAwake, setIsServerAwake] = useState(false);

  useEffect(() => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://subhams-vpk.onrender.com';
    
    const pingServer = async () => {
      // If maintenance mode is ON, don't bother pinging the server!
      if (IS_MAINTENANCE_MODE) return; 

      try {
        const res = await fetch(`${BACKEND_URL}/api/health`);
        if (res.ok) {
          console.log("🟢 Server is Awake!");
          setIsServerAwake(true);
        } else {
          throw new Error("Not ready");
        }
      } catch  {
        console.log("🟡 Server is sleeping. Retrying in 3 seconds...");
        setTimeout(pingServer, 3000); 
      }
    };

    pingServer();
  }, []);

  // 🛑 1. Check Maintenance Mode FIRST
  if (IS_MAINTENANCE_MODE) {
    return <MaintenanceScreen />;
  }

  // 🚀 2. Check Server Bootloader SECOND
  if (!isServerAwake) {
    return <ServerBootloader />;
  }

  // 🌐 3. Render Application FINALLY
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* 👤 OPEN UPLOAD ROUTE */}
        <Route path="/u/:shopId" element={<CustomerUpload />} />
        <Route path="/u" element={<CustomerUpload />} />

        {/* 🔐 AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 🟢 SECURE BUSINESS PAGES */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/manage" 
          element={
            <ProtectedRoute>
              <Manage />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* 🤖 2. ADD THE CHATBOT HERE (Floats over all routes!) */}
      <XeroxChatbot />

    </BrowserRouter>
  );
}

// =====================================================================
// 🎨 BEAUTIFUL STYLES FOR THE BOOTLOADER & MAINTENANCE
// =====================================================================
const styles = {
  bootContainer: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Inter', sans-serif",
    color: 'white',
    overflow: 'hidden',
    padding: '20px',
    boxSizing: 'border-box'
  },
  shieldContainer: {
    position: 'relative',
    width: '120px',
    height: '120px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '30px',
    borderRadius: '50%',
    animation: 'pulseGlow 2s infinite'
  },
  spinnerOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: '4px solid rgba(16, 185, 129, 0.2)',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 1.5s linear infinite'
  },
  shieldIcon: {
    fontSize: '50px',
    zIndex: 10
  },
  brandTitle: {
    margin: '0 0 20px 0',
    fontSize: '24px',
    letterSpacing: '4px',
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center'
  },
  loadingBarContainer: {
    width: '300px',
    height: '4px',
    backgroundColor: '#1e293b',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '20px',
    position: 'relative'
  },
  loadingBarInner: {
    width: '50%',
    height: '100%',
    backgroundColor: '#10b981',
    animation: 'slide 2s infinite ease-in-out',
    transformOrigin: 'left'
  },
  statusText: {
    color: '#10b981',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    textAlign: 'center',
    minHeight: '20px'
  },
  subText: {
    color: '#64748b',
    fontSize: '12px',
    textAlign: 'center',
    maxWidth: '400px',
    lineHeight: '1.5'
  },
  linkBtn: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 'bold',
    border: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }
};