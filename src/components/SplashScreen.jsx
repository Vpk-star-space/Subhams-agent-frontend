import { useEffect, useState } from "react";

const STATUS_MESSAGES = [
 "Welocome"
];

const SplashScreen = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) =>
        prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 700);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFadingOut(true), 2500);
    const completeTimer = setTimeout(() => { if (onComplete) onComplete(); }, 3100);
    return () => { clearTimeout(fadeTimer); clearTimeout(completeTimer); };
  }, [onComplete]);

  return (
    <>
<style>{`
  .splash {
    position: fixed; inset: 0; display: flex; justify-content: center; align-items: center;
    overflow: hidden; 
    /* 8-Color Rainbow Gradient */
    background: linear-gradient(135deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #6366f1, #a855f7);
    z-index: 999999; transition: opacity .6s ease;
  }
  .fade { opacity: 0; }
  
  /* Static Aurora Blobs - Multi-color support */
  .aurora { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.4; }
  .a1 { width: 350px; height: 350px; background: #6366f1; top: -100px; left: -50px; }
  .a2 { width: 320px; height: 320px; background: #ef4444; bottom: -100px; right: -50px; }

  .content { position: relative; z-index: 5; display: flex; flex-direction: column; align-items: center; width: 90%; }

  /* Glassmorphism Logo Box */
  .logo-box {
    width: clamp(150px, 25vw, 250px); 
    height: clamp(150px, 25vw, 250px);
    border-radius: 30px; display: flex; justify-content: center; align-items: center;
    background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2);
    backdrop-filter: blur(20px); box-shadow: 0 10px 30px rgba(0,0,0,.3);
  }

  /* Logo */
  .logo {
    width: 80%;
    height: auto;
    filter: drop-shadow(0 0 10px rgba(0,0,0,0.3));
  }
  
  /* Title with strong shadow for maximum readability */
  .title { 
    margin-top: 30px; color: #ffffff; font-size: 28px; font-weight: 800; 
    letter-spacing: 2px; 
    text-shadow: 0 2px 8px rgba(0,0,0,0.5); 
    text-align: center;
  }
  
  /* Status Text with strong shadow */
  .status { 
    margin-top: 20px; color: #ffffff; font-size: 13px; letter-spacing: 4px; 
    text-transform: uppercase; font-weight: 700;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }
`}</style>

      <div className={`splash ${isFadingOut ? "fade" : ""}`}>
        <div className="aurora a1"></div>
        <div className="aurora a2"></div>

        <div className="content">
          <div className="logo-box">
            <img src="/icon-512.png" alt="Subhams Secure" className="logo" />
          </div>

          <div className="title">SUBHAMS</div>

          <div className="status">
            {STATUS_MESSAGES[statusIndex]}
          </div>
        </div>
      </div>
    </>
  );
};

export default SplashScreen;