import { useState, useEffect } from 'react';

export default function FounderNote() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [flowerData, setFlowerData] = useState([]);

  // 1. Appears exactly 6 seconds after opening the app
  useEffect(() => {
    const hasSeenNote = localStorage.getItem('hasSeenFounderNote');
    if (!hasSeenNote) {
      const timer = setTimeout(() => setIsVisible(true), 6000);
      return () => clearTimeout(timer);
    }
  }, []);

  // 2. The Button Click & Massive Full-Screen Flower Boom!
  const handleOkClick = () => {
    // Generates 50 flowers that explode outward to cover the whole screen
    const generatedFlowers = [...Array(50)].map(() => ({
      tx: `${(Math.random() - 0.5) * 150}vw`, 
      ty: `${(Math.random() - 0.5) * 150}vh`, 
      delay: `${Math.random() * 0.2}s`,
      scale: 1 + Math.random() * 1.5,
      emoji: ['🌸', '🌺', '🌼', '✨', '🎉'][Math.floor(Math.random() * 5)]
    }));

    setFlowerData(generatedFlowers); 
    setIsExploding(true); 
    
    // Waits exactly 3 SECONDS for the animation to finish, then closes forever
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('hasSeenFounderNote', 'true');
    }, 3000);
  };

  if (!isVisible) return null;

  return (
    <div style={overlayStyle}>
      {/* INJECTED CSS ANIMATIONS */}
      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          /* Colorful Animated Words */
          @keyframes colorWave {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .colorful-text {
            background: linear-gradient(270deg, #ff007f, #7928ca, #ff007f);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: colorWave 3s ease infinite;
            font-weight: 900;
          }

          /* Full-Screen 360-Degree Explosion Animation (3 Seconds) */
          @keyframes explodeFull {
            0% { opacity: 1; transform: translate(0, 0) scale(0) rotate(0deg); }
            15% { opacity: 1; transform: translate(calc(var(--tx) * 0.2), calc(var(--ty) * 0.2)) scale(var(--scale)) rotate(90deg); }
            100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(var(--scale)) rotate(720deg); }
          }
          .flower {
            position: absolute;
            top: 50%; 
            left: 50%;
            font-size: 30px;
            pointer-events: none;
            z-index: 100000;
            animation: explodeFull 3s forwards cubic-bezier(0.1, 0.8, 0.3, 1);
          }
        `}
      </style>

      {/* 🌸 THE FULL-SCREEN BOOM EFFECT 🌸 */}
      {isExploding && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 99999 }}>
          {flowerData.map((flower, i) => (
            <div key={i} className="flower" style={{
              '--tx': flower.tx,
              '--ty': flower.ty,
              '--scale': flower.scale,
              animationDelay: flower.delay
            }}>
              {flower.emoji}
            </div>
          ))}
        </div>
      )}

      {/* ✉️ THE LETTER UI */}
      <div style={letterStyle}>
        
        {/* 🏢 1. SUBHAMS BRAND LOGO HEADER */}
        <div style={logoHeaderStyle}>
          {/* Replace src with your actual logo path, e.g., "/logo.png" */}
          <img 
            src="/subhams-logo.png" 
            alt="Subhams Logo" 
            style={{ height: '35px', objectFit: 'contain', display: 'none' }} 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '900', letterSpacing: '1px' }}>
            <span className="colorful-text">SUBHAMS </span>
          </h2>
          <hr style={{ border: 'none', borderBottom: '2px solid #e2e8f0', margin: '10px 0 15px 0' }} />
        </div>

        <p style={{ margin: '0 0 8px 0', fontSize: '14.5px', color: '#334155', lineHeight: '1.6' }}>
          <strong>నమస్కారం,</strong><br/>
          మీ డాక్యుమెంట్స్ ఎవరూ దుర్వినియోగం చేయకూడదనే ఈ సిస్టమ్ డిజైన్ చేశాను. మీరు పంపిన ఫైల్స్ ప్రింట్ అయిన  <span className="colorful-text">వెంటనే ఆటోమేటిక్ గా డిలీట్ అవుతాయి! </span>
        </p>
        
        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569', fontStyle: 'italic', lineHeight: '1.5' }}>
          Your files <span className="colorful-text">auto-delete</span> immediately after printing to protect your privacy.
        </p>

     
        <div style={highlightBox}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '14.5px', color: '#9a3412', fontWeight: '800' }}>
              <span className="colorful-text">MY REQUEST:</span>
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#78350f', lineHeight: '1.4' }}>
            దయచేసి మీ తల్లిదండ్రులకు, మీకు కావాల్సిన వారికి దీన్ని ఎలా వాడాలో నేర్పించండి.<br/>
            <span style={{ fontSize: '11.5px', fontStyle: 'italic' }}>Please teach your loved ones how to use this safely.</span>
          </p>
        </div>

        {/* The Signature */}
        <div style={signatureBox}>
          <p style={{ margin: '0 0 2px 0', color: '#64748b', fontSize: '12px' }}>— Yours truly,</p>
          <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
           Venkata Pavan Kumar
          </h4>
          <p style={{ margin: 0, color: '#10b981', fontSize: '11px', fontWeight: 'bold' }}>Founder & Developer</p>
        </div>
{/* ✨ 2. SYMMETRICAL POINTER TO THE 'ASK SUBHAMS' BOT */}
        <div style={premiumBotPointerBox}>
          
          <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600', letterSpacing: '0.2px' }}>
           <span className="colorful-text"> మరింత సమాచారం కోసం </span> <strong className="colorful-text"> ✨ </strong> ఐకాన్‌పై క్లిక్ చేయండి 
          </span>

     
        
          
          <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600', letterSpacing: '0.2px' }}>
     
          </span>

    
        </div>

        {/* ONLY ONE BUTTON */}
        <button 
          onClick={handleOkClick} 
          disabled={isExploding} 
          style={btnStyle}
        >
          {isExploding ? '🌸 🌺 🌼' : 'OK / సరే'}
        </button>

      </div>
    </div>
  );
}

// ================= STYLES =================
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(5px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9998, padding: '15px'
};

const letterStyle = {
  background: '#fdfbf7', // Warm paper color
  width: '100%', maxWidth: '360px', borderRadius: '16px',
  padding: '20px', display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)', 
  border: '1px solid #e2e8f0',
  animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  position: 'relative'
};

const logoHeaderStyle = {
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
};



const highlightBox = {
  background: '#fffbeb', borderLeft: '3px solid #f59e0b',
  padding: '10px', marginBottom: '15px', borderRadius: '0 8px 8px 0'
};

const signatureBox = {
  textAlign: 'right', marginBottom: '20px', paddingRight: '5px'
};

const btnStyle = {
  background: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px',
  fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%',
  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', transition: 'transform 0.1s'
};
const premiumBotPointerBox = {
  display: 'flex', 
  flexDirection: 'column', // Stacks them vertically
  alignItems: 'center',    // Centers everything perfectly
  textAlign: 'center',
  gap: '10px',             // Perfect spacing between Text -> Icon -> Text
  padding: '16px', 
  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
  borderRadius: '16px',
  marginBottom: '18px', 
  border: '1px solid rgba(226, 232, 240, 0.8)',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.04)'
};

