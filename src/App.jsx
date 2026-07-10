import { BASE_URL } from './api/api';
import { io } from 'socket.io-client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react'; // 🟢 Added useRef here
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Manage from './pages/Manage';
import CustomerUpload from './pages/CustomerUpload';
import LandingPage from './pages/LandingPage';
// 🟢 Add this line at the top of the file with your other page imports:
import ForgotPassword from './pages/ForgotPassword'; // Adjust the path if your file is in a different folder!
// 🤖 IMPORT THE NEW CHATBOT HERE
import XeroxChatbot from './components/XeroxChatbot'; 
import AIDocWriter from './components/AIDocWriter'; // Import the new AI Document Writer component

// 🛑 THE MASTER SWITCH: Change to 'true' to lock down the app for updates!
const IS_MAINTENANCE_MODE = false; 
 const TARGET_LAUNCH_TEXT = "Updating..."; // You can customize this text to show an estimated time or a fun message!

// 🛡️ THE PROFESSIONAL BOUNCER (Only protects Shop Owners)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken'); 
  if (!token) {
    return <Navigate to="/login" replace />; 
  }
  return children; 
};

// =====================================================================
// 🚧 THE MAINTENANCE MODE SCREEN
// =====================================================================
const MaintenanceScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.bootContainer}>
      <div style={styles.shieldContainer}>
        <div style={{...styles.spinnerOuter, borderColor: 'rgba(245, 158, 11, 0.2)', borderTopColor: '#f59e0b', animationDuration: '3s'}}></div>
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
        <div style={{ flex: 1, background: '#450a0a', padding: '15px', borderRadius: '12px', border: '1px solid #991b1b', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#fca5a5', fontWeight: 'bold', letterSpacing: '1px' }}>
            MAINTENANCE / నిర్వహణ సమయం
          </p>
          <div style={{ fontSize: '20px', color: '#ef4444', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        <div style={{ flex: 1, background: '#022c22', padding: '15px', borderRadius: '12px', border: '1px solid #065f46', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#6ee7b7', fontWeight: 'bold', letterSpacing: '1px' }}>
            ESTIMATED LAUNCH / ప్రారంభ సమయం
          </p>
     
<div
  style={{
    fontSize: '15px',
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: '2px'
  }}
>
  {TARGET_LAUNCH_TEXT}
</div>


        </div>
      </div>

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

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Explore Our Network</p>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="https://pmms.subhamsnetworks.in/" target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
            <span style={{ fontSize: '16px', marginRight: '5px' }}>🚀</span> Subhams App
          </a>
          <a href="https://bhavyams.subhamsnetworks.in/" target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
            <span style={{ fontSize: '16px', marginRight: '5px' }}>🏬</span> Bhavyams Vendor Hub
          </a>
        </div>
      </div>
    </div>
  );
};


// =====================================================================
// 🚀 THE WAKE-UP BOOTLOADER UI (Now a CSS Overlay for SEO!)
// =====================================================================
const ServerBootloader = () => {
  const [loadingText, setLoadingText] = useState("Initializing Subhams Security Protocol...");

  useEffect(() => {
    const texts = [
      "Initializing Subhams Security Protocol...",
      "Waking up cloud infrastructure (This may take a few sec)...",
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
// 🌐 2. MAIN APP COMPONENT
// =====================================================================
export default function App() {
  const [isServerAwake, setIsServerAwake] = useState(false);
  
  
  useEffect(() => {
    // 🟢 1. Connect Socket using the MAGIC BASE_URL!
    const socket = io(BASE_URL);

    // 🟢 2. Listen for Vercel Update Command
    socket.on('CRITICAL_UPDATE_REFRESH', () => {
        console.log("🚨 New system Update Detected! Force Refreshing...");
        // 3 second delay gives Vercel time to finish deploying before browsers reload
        setTimeout(() => {
            window.location.reload(true);
        }, 3000);
    });
    
    const pingServer = async () => {
      if (IS_MAINTENANCE_MODE) return; 

      try {
        // 🟢 Increase wait time for Render cold-starts
        const res = await fetch(`${BASE_URL}/api/health`);
        if (res.ok) {
          console.log("🟢 Server is Awake!");
          setIsServerAwake(true);
        } else {
          throw new Error("Not ready");
        }
      } catch  {
        console.log("🟡 Server is sleeping. Retrying in 8 seconds...");
        // 🟢 Changed from 3000ms to 8000ms to give the server breathing room
        setTimeout(pingServer, 8000); 
      }
    };

    pingServer();

    // Cleanup socket on unmount
    return () => socket.disconnect();
  }, []);

  if (IS_MAINTENANCE_MODE) {
    return <MaintenanceScreen />;
  }

  return (
    <>
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/portal" element={<Home />} />
          
          {/* 🟢 Customer Portal: Always rendered, Bootloader is just an overlay */}
          <Route path="/u/:shopId" element={<>{!isServerAwake && <ServerBootloader />}<CustomerUpload /></>} />
          <Route path="/u" element={<>{!isServerAwake && <ServerBootloader />}<CustomerUpload /></>} />

          {/* 🟢 Auth Routes */}
          <Route path="/login" element={<>{!isServerAwake && <ServerBootloader />}<Login /></>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<>{!isServerAwake && <ServerBootloader />}<Register /></>} />
          
          {/* 🟢 Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute>{!isServerAwake && <ServerBootloader />}<Dashboard /></ProtectedRoute>} />
          <Route path="/manage" element={<ProtectedRoute>{!isServerAwake && <ServerBootloader />}<Manage /></ProtectedRoute>} />
          <Route path="/writer" element={<ProtectedRoute>{!isServerAwake && <ServerBootloader />}<AIDocWriter /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <XeroxChatbot />
        <GlobalAppInstallWidget />
      </BrowserRouter>
    </>
  );
}
// =====================================================================
// 🌟 GLOBAL WIDGET: Always-on Share & Center Install Popup
// =====================================================================

// 🎛️ MASTER TOGGLE: Set to 'false' to completely disable the install popup
const ENABLE_INSTALL_POPUP = false; 

const GlobalAppInstallWidget = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPopup, setShowPopup] = useState(false); 

  const isInstalled = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

  // 1. Capture the Install Event (NOW STORED GLOBALLY)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredInstallPrompt = e; 
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // 2. RECURRING TIMING LOGIC (Wait 30s -> Show 10s -> Loop)
  useEffect(() => {
    if (!ENABLE_INSTALL_POPUP || isInstalled) return;

    let timeoutId;

    const startLoop = () => {
      timeoutId = setTimeout(() => {
        setShowPopup(true); 

        setTimeout(() => {
          setShowPopup(false); 
          
          if (!isInstalled && ENABLE_INSTALL_POPUP) {
            startLoop();
          }
        }, 16000); 

      }, 10000);
    };

    startLoop();

    return () => clearTimeout(timeoutId);
  }, [isInstalled]);

  // 3. THE BUTTON CLICK
  const handleInstallClick = async () => {
    const promptEvent = window.deferredInstallPrompt; 
    
    if (!promptEvent) {
      alert("Browser Security: To install securely, tap your browser menu (three dots) and select 'Add to Home screen' or 'Install App'.");
      return;
    }
    
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setShowPopup(false); 
    }
    window.deferredInstallPrompt = null; 
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Subhams Secure',
          text: 'The most secure way to print your documents.',
          url: window.location.origin, 
        });
      } catch (err) { console.log('Share failed', err); }
    } else {
      alert("Copy this link to share: " + window.location.origin);
    }
  };

  return (
    <>
      {/* 🟢 PREMIUM INJECTED CSS ANIMATIONS */}
      <style>
        {`
          /* Share Button Liquid Glow */
          @keyframes liquidGlow {
            0% { box-shadow: 0 0 0 0 rgba(30, 41, 59, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(30, 41, 59, 0); }
            100% { box-shadow: 0 0 0 0 rgba(30, 41, 59, 0); }
          }
          /* Share Icon Gentle Bounce */
          @keyframes iconFloat {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-3px) scale(1.1); }
          }
          /* Premium Modal Pop-In */
          @keyframes premiumPopIn {
            0% { opacity: 0; transform: translate(-50%, -40%) scale(0.92); filter: blur(4px); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0px); }
          }
          /* Security Shield Radar Scan */
          @keyframes radarScan {
            0% { top: -10%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 110%; opacity: 0; }
          }
          /* Install Button Shimmer */
          @keyframes shimmerBtn {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}
      </style>
{/* ↗️ 1. LIQUID GLASS SHARE BUTTON (Pill-shaped to fit text) */}
      <div style={{ 
        position: 'fixed', 
        bottom: '95px', 
        right: '25px',  
        zIndex: 9997 
      }}>
        <button 
          onClick={handleShare} 
          title="Share Subhams Secure"
          style={{
            /* Removed fixed width/height. Added padding for a pill shape */
            padding: '12px 20px', 
            borderRadius: '30px', 
            background: 'rgba(255, 255, 255, 0.4)', // Premium glass effect
            backdropFilter: 'blur(12px)', 
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px', // Adds space between the text and the icon
            cursor: 'pointer',
            color: '#0f172a', // Dark text for readability
            fontWeight: '700',
            fontSize: '14px',
            animation: 'liquidGlow 2.5s infinite', 
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Static text */}
        
          
          {/* Animated icon */}
          <span style={{ 
            fontSize: '18px', 
            animation: 'iconFloat 2s infinite ease-in-out',
            display: 'inline-block' // Required for CSS transforms to work on spans
          }}>
            ↗️
          </span>
        </button>
      </div>

      {/* ⚡ 2. THE PREMIUM SECURE INSTALL POPUP */}
      {showPopup && !isInstalled && ENABLE_INSTALL_POPUP && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 9999, background: '#ffffff', borderRadius: '24px', 
          boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25), 0 0 0 100vw rgba(15, 23, 42, 0.85)', 
          border: '1px solid rgba(16, 185, 129, 0.3)', padding: '40px 30px', width: '90%', maxWidth: '420px', 
          textAlign: 'center', 
          animation: 'premiumPopIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)' 
        }}>
          
          {/* Animated Shield Container */}
          <div style={{ 
            position: 'relative',
            overflow: 'hidden',
            background: '#ecfdf5',
            width: '85px',
            height: '85px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            margin: '0 auto 20px auto',
            boxShadow: 'inset 0 2px 10px rgba(16, 185, 129, 0.2), 0 4px 15px rgba(16, 185, 129, 0.1)'
          }}>
            <span style={{ fontSize: '42px', zIndex: 2 }}>🛡️</span>
            {/* The Radar Scan Line */}
            <div style={{ 
              position: 'absolute', 
              width: '100%', 
              height: '3px', 
              background: '#10b981', 
              boxShadow: '0 0 12px #10b981', 
              left: 0, 
              zIndex: 3,
              animation: 'radarScan 2.5s infinite linear' 
            }} />
          </div>
          
          <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Secure Agent Connection
          </h4>
          
          <p style={{ margin: '0 0 25px 0', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
            Add Subhams to your Home Screen.<br/>
            <strong>Zero URL typing. Maximum Security.</strong><br/>
            
            <span style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '20px', 
              padding: '12px', 
              background: 'linear-gradient(90deg, #f0fdf4, #ecfdf5)', // Soft gradient
              color: '#065f46', 
              borderRadius: '12px', 
              fontWeight: '700',
              fontSize: '13.5px',
              borderLeft: '4px solid #10b981' // Solid system-badge look
            }}>
              ✅ Install to hide this message forever!
            </span>
          </p>
          
          <button 
            onClick={handleInstallClick}
            style={{ 
              ...widgetBtnStyle, 
              // Shimmer Gradient Background
              background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%)', 
              backgroundSize: '200% auto',
              width: '100%', 
              padding: '16px', 
              fontSize: '16px', 
              opacity: isInstallable ? 1 : 0.9,
              boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)',
              animation: 'shimmerBtn 3s infinite linear' // Triggers the shine effect
            }}
          >
            {isInstallable ? '📱 Install Secure App' : '📱 View Install Steps'}
          </button>
        </div>
      )}
    </>
  );
};

const widgetBtnStyle = {
  borderRadius: '12px', border: 'none', color: '#fff', 
  fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', 
  justifyContent: 'center', transition: 'all 0.3s ease', 
};


// =====================================================================
// 🎨 BEAUTIFUL STYLES FOR THE BOOTLOADER & MAINTENANCE
// =====================================================================
const styles = {
  bootContainer: {
    // 🟢 SEO FIX: Added 'position: fixed' and 'zIndex' to turn this into an overlay!
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
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