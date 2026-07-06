import { Link } from 'react-router-dom';

export default function LandingPage() {

  // 🟢 Custom Smooth Scroll Function to jump to the Footer
  const scrollToAbout = (e) => {
    e.preventDefault();
    const footerSection = document.getElementById('about-footer');
    if (footerSection) {
      footerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* 🛑 ADVANCED CSS: Global Scroll Fix, Animations & Responsive */}
      <style>
        {`
          /* 🟢 BULLETPROOF SCROLL FIX */
          html, body {
            margin: 0;
            padding: 0;
            scroll-behavior: smooth;
            background-color: #020617; /* Deep Slate */
            overflow-x: hidden;
            width: 100%;
          }

          /* 🟢 PREMIUM GRID BACKGROUND (Changed to fixed so it doesn't break scroll height) */
          .saas-grid {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background-size: 50px 50px;
            background-image: 
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, black 20%, transparent 90%);
            z-index: 0;
            pointer-events: none;
          }

          /* Hover Effects */
          .glass-card {
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }
          .glass-card:hover { 
            transform: translateY(-8px) scale(1.02); 
            box-shadow: 0 30px 60px rgba(16, 185, 129, 0.12);
            border-color: rgba(52, 211, 153, 0.4);
            background: rgba(30, 41, 59, 0.8);
          }

          /* Animations */
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(40px); filter: blur(5px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-20px) scale(1.05); }
          }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          @keyframes shine {
            to { background-position: 200% center; }
          }

          .animate-fade-1 { animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; opacity: 0; }
          .animate-fade-2 { animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; }
          .animate-fade-3 { animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards; opacity: 0; }
          .animate-fade-4 { animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards; opacity: 0; }
          
          .glow-1 { animation: floatSlow 10s ease-in-out infinite; }
          .glow-2 { animation: floatSlow 14s ease-in-out infinite reverse; }
          
          /* Premium Button */
          .btn-primary { 
            animation: pulseGlow 3s infinite; 
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .btn-primary::after {
            content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
            transform: skewX(-20deg); transition: all 0.5s ease;
          }
          .btn-primary:hover::after { left: 150%; }
          .btn-primary:hover { transform: translateY(-2px); animation: none; box-shadow: 0 10px 20px rgba(16,185,129,0.3); }
          
          .btn-secondary:hover { background: rgba(255,255,255,0.1) !important; transform: translateY(-2px); border-color: rgba(255,255,255,0.3) !important; }

          /* 🌟 PREMIUM FOOTER CSS (Desktop layout) */
          .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
            text-align: left;
          }
          .footer-link {
            color: #94a3b8;
            text-decoration: none;
            transition: all 0.2s ease;
            display: block;
            margin-bottom: 12px;
            font-size: 14px;
            position: relative;
            width: fit-content;
            cursor: pointer;
          }
          .footer-link:hover {
            color: #10b981;
            transform: translateX(5px);
          }

          /* 📱 MOBILE RESPONSIVENESS */
          @media (max-width: 768px) {
            .nav-links { display: none !important; } 
            .hero-title { font-size: 46px !important; line-height: 1.1 !important; }
            .hero-subtitle { font-size: 16px !important; padding: 0 10px; }
            .hero-name { font-size: 14px !important; margin-bottom: 20px !important; }
            .button-group { flex-direction: column !important; align-items: stretch !important; gap: 15px !important; padding: 0 20px; }
            .section-title { font-size: 36px !important; }
            .stat-container { grid-template-columns: 1fr !important; gap: 15px !important; }
            .features-grid { grid-template-columns: 1fr !important; }
            .app-mockup { height: 250px !important; }
            
            /* Mobile Footer Fixes */
            .footer-grid { grid-template-columns: 1fr !important; text-align: center !important; gap: 30px !important; }
            .footer-link { margin: 0 auto 12px auto !important; }
            .footer-link:hover { transform: translateY(-2px); }
          }
        `}
      </style>

      {/* Decorative SaaS Background */}
      <div className="saas-grid"></div>
      <div className="glow-1" style={styles.bgGlow1}></div>
      <div className="glow-2" style={styles.bgGlow2}></div>

      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⚡</div> 
          Subhams Secure Agent
        </div>
        <div className="nav-links" style={styles.navLinks}>
          {/* 🟢 Click triggers scroll directly to the footer */}
          <a href="#about-footer" onClick={scrollToAbout} style={styles.navLink}>About</a>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#security" style={styles.navLink}>Security</a>
          <a href="#enterprise" style={styles.navLink}>Enterprise</a>
        </div>
        <div className="nav-links">
          <Link to="/portal" style={styles.navBtn}>Go to Portal</Link>
        </div>
      </nav>

      <main style={styles.container}>
        
        {/* HERO SECTION */}
        <section style={styles.hero}>
          <div className="animate-fade-1" style={styles.badge}>
            <span style={styles.badgeDot}></span>
            Cloud Print Agent v2.0 Live
          </div>
          
          <h1 className="hero-title animate-fade-1" style={styles.title}>
            Next-Gen Secure <br/>
            <span style={styles.gradientText}>Cloud Printing.</span>
          </h1>
          
          <h2 className="hero-name animate-fade-2" style={styles.name}>
            Engineered by Venkata Pavan Kumar
          </h2>
          
          <p className="hero-subtitle animate-fade-2" style={styles.subtitle}>
            The professional, encrypted workflow designed for modern institutions. 
            Upload securely from anywhere, print instantly, and leave zero digital footprint.
          </p>
          
          <div className="button-group animate-fade-3" style={styles.buttonGroup}>
            <Link to="/portal" className="btn-primary" style={styles.ctaButton}>
              Open Print Portal ↗
            </Link>
            <a href="#features" className="btn-secondary" style={styles.secondaryButton}>
              See How It Works
            </a>
          </div>

          {/* 💻 UI MOCKUP */}
          <div className="animate-fade-4" style={styles.mockupWrapper}>
             <div className="app-mockup" style={styles.mockupContainer}>
                <div style={styles.mockupHeader}>
                  <div style={{display: 'flex', gap: '6px'}}>
                    <div style={{...styles.macDot, background: '#ef4444'}}></div>
                    <div style={{...styles.macDot, background: '#f59e0b'}}></div>
                    <div style={{...styles.macDot, background: '#10b981'}}></div>
                  </div>
                  <div style={styles.mockupUrl}>https://agent.subhamsnetworks.in/</div>
                </div>
                <div style={styles.mockupBody}>
                  <div style={styles.mockupUiBox}>
                    <span style={{fontSize: '30px'}}>🛡️</span>
                    <h3 style={{margin: '10px 0 5px 0', fontSize: '16px'}}>Secure Connection Established</h3>
                    <p style={{margin: 0, fontSize: '12px', color: '#64748b'}}>Ready to receive encrypted documents.</p>
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section id="security" className="stat-container animate-fade-3" style={styles.statsSection}>
          <div className="glass-card" style={styles.statCard}>
            <h2 style={styles.statNumber}>100<span style={{color: '#64748b', fontSize: '24px'}}>%</span></h2>
            <p style={styles.statText}>Auto-Wipe Privacy</p>
          </div>
          <div className="glass-card" style={styles.statCard}>
            <h2 style={styles.statNumber}>256<span style={{color: '#64748b', fontSize: '24px'}}>-bit</span></h2>
            <p style={styles.statText}>Military-Grade Encryption</p>
          </div>
          <div className="glass-card" style={styles.statCard}>
            <h2 style={styles.statNumber}>&lt;1<span style={{color: '#64748b', fontSize: '24px'}}>s</span></h2>
            <p style={styles.statText}>Real-time Sync Latency</p>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" style={{paddingBottom: '80px'}}>
          <div style={{textAlign: 'center', marginBottom: '50px'}}>
            <h2 className="section-title animate-fade-2" style={styles.sectionTitle}>Everything you need to print securely.</h2>
            <p style={{color: '#94a3b8', fontSize: '16px'}}>Built from the ground up for speed, privacy, and reliability.</p>
          </div>

          <div className="features-grid animate-fade-3" style={styles.featuresGrid}>
            <div className="glass-card" style={styles.card}>
              <div style={styles.icon}>⚡</div>
              <h3 style={styles.cardTitle}>Instant Web Sockets</h3>
              <p style={styles.cardText}>No refreshing required. Documents sent from your mobile appear on the shop terminal instantly using live Socket.io infrastructure.</p>
            </div>
            <div className="glass-card" style={styles.card}>
              <div style={styles.icon}>🕵️</div>
              <h3 style={styles.cardTitle}>Blind Preview Tech</h3>
              <p style={styles.cardText}>Protect sensitive data like Aadhaar or PAN. Shopkeepers can adjust alignment using a blurred silhouette without seeing your actual data.</p>
            </div>
            <div className="glass-card" style={styles.card}>
              <div style={styles.icon}>RAM</div>
              <h3 style={styles.cardTitle}>Zero Disk Retention</h3>
              <p style={styles.cardText}>Documents are processed directly in the server's volatile RAM. Once printed or revoked, the data ceases to exist permanently.</p>
            </div>
          </div>
        </section>

        {/* ENTERPRISE SECTION */}
        <section id="enterprise" className="glass-card animate-fade-4" style={styles.enterprise}>
          <div style={styles.enterpriseContent}>
            <h2 className="section-title" style={{...styles.sectionTitle, marginBottom: '15px'}}>Enterprise Grade Infrastructure</h2>
            <p style={styles.sectionText}>
              Subhams Secure Agent isn't just a print queue. It is a sovereign digital environment designed for educational institutions, government offices, and modern enterprises to handle document verification safely.
            </p>
            <Link to="/portal" style={{...styles.ctaButton, display: 'inline-block', marginTop: '30px'}}>
              Experience it now
            </Link>
          </div>
        </section>
      </main>

      {/* 🌟 PREMIUM FOOTER (Assigned id="about-footer" for the Nav Link to jump here) */}
      <footer id="about-footer" style={styles.footerWrapper}>
        <div style={styles.footerContainer}>
          <div className="footer-grid">
            
            {/* Column 1: Brand & About Details */}
            <div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
                <div style={styles.logoIconSm}>⚡</div> 
                <span style={{fontWeight: '800', color: '#f8fafc', fontSize: '18px', letterSpacing: '-0.5px'}}>Subhams Agent</span>
              </div>
              <p style={{color: '#64748b', fontSize: '14px', lineHeight: '1.6', maxWidth: '300px', margin: '0 0 15px 0'}}>
                Enterprise-grade cloud printing architecture. Engineered for zero-latency queue management and strict hardware security.
              </p>
              <span className="footer-link" style={{color: '#10b981', fontWeight: '600', cursor: 'default'}}>
                → Read Architecture Details
              </span>
            </div>

            {/* Column 2: Developer Network */}
            <div>
              <h4 style={{color: '#f8fafc', fontSize: '15px', fontWeight: '600', margin: '0 0 20px 0'}}>Developer Network</h4>
              <a href="https://github.com/Vpk-star-space" target="_blank" rel="noopener noreferrer" className="footer-link">🐙 GitHub Profile</a>
              <a href="https://www.linkedin.com/in/venkata-pavan-kumar-server" target="_blank" rel="noopener noreferrer" className="footer-link">💼 LinkedIn Connect</a>
              <a href="https://bhavyams.subhamsnetworks.in/" target="_blank" rel="noopener noreferrer" className="footer-link">🏪 Bhavyams VendorHub</a>
              <a href="https://pmms.subhamsnetworks.in/" target="_blank" rel="noopener noreferrer" className="footer-link">📈 Subhams PMMS</a>
            </div>

            {/* Column 3: System Architecture */}
            <div>
              <h4 style={{color: '#f8fafc', fontSize: '15px', fontWeight: '600', margin: '0 0 20px 0'}}>System Architecture</h4>
              <span className="footer-link" style={{cursor: 'default'}}>🟢 Node.js & Express API</span>
              <span className="footer-link" style={{cursor: 'default'}}>⚛️ React.js Frontend</span>
              <span className="footer-link" style={{cursor: 'default'}}>🍃 MongoDB Database</span>
              <span className="footer-link" style={{cursor: 'default'}}>⚡ WebSockets (Socket.io)</span>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div style={styles.footerBottom}>
            <p style={{margin: '0 0 8px 0'}}>© 2026 Subhams Secure Agent. All rights reserved.</p>
            <p style={{margin: 0}}>
              Engineered & Designed by <strong style={{color: '#10b981', fontWeight: '600'}}>Venkata Pavan Kumar Amarthaluri</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  pageWrapper: { 
    position: 'relative', 
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: '#f8fafc',
    width: '100%',
    overflowX: 'hidden'
  },
  
  bgGlow1: { position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(0,0,0,0) 60%)', top: '-10%', left: '-10%', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' },
  bgGlow2: { position: 'absolute', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(0,0,0,0) 60%)', bottom: '-20%', right: '-10%', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' },
  
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 10, width: '100%', boxSizing: 'border-box' },
  
  navbar: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', background: 'rgba(2, 6, 23, 0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  logo: { fontSize: '18px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', letterSpacing: '-0.5px' },
  logoIcon: { background: 'linear-gradient(135deg, #10b981, #059669)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', marginRight: '10px', fontSize: '14px' },
  logoIconSm: { background: 'linear-gradient(135deg, #10b981, #059669)', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '10px' },
  navLinks: { display: 'flex', gap: '30px', alignItems: 'center' },
  navLink: { color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s', cursor: 'pointer' },
  navBtn: { background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' },
  
  hero: { textAlign: 'center', paddingTop: '80px', paddingBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '13px', fontWeight: '600', marginBottom: '30px' },
  badgeDot: { width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' },
  
  title: { fontSize: '84px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-3px', lineHeight: '1.05', color: '#f8fafc' },
  gradientText: { background: 'linear-gradient(to right, #34d399, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto', animation: 'shine 4s linear infinite' },
  name: { fontSize: '16px', color: '#94a3b8', margin: '0 0 30px 0', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' },
  subtitle: { maxWidth: '700px', margin: '0 auto', color: '#cbd5e1', fontSize: '19px', lineHeight: '1.6', fontWeight: '400' },
  
  buttonGroup: { marginTop: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' },
  ctaButton: { background: '#10b981', color: '#022c22', padding: '16px 36px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '16px', border: '1px solid #34d399' },
  secondaryButton: { background: 'rgba(30,41,59,0.5)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 36px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', backdropFilter: 'blur(10px)' },
  
  mockupWrapper: { marginTop: '70px', width: '100%', maxWidth: '900px', padding: '10px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)', borderRadius: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  mockupContainer: { width: '100%', height: '400px', background: '#0f172a', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
  mockupHeader: { height: '40px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'space-between' },
  macDot: { width: '12px', height: '12px', borderRadius: '50%' },
  mockupUrl: { flex: 1, textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '500', fontFamily: 'monospace', position: 'absolute', left: 0, right: 0 },
  mockupBody: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(16,185,129,0.05) 0%, transparent 50%)' },
  mockupUiBox: { padding: '30px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', textAlign: 'center', backdropFilter: 'blur(10px)' },

  statsSection: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', margin: '0 auto 100px auto', maxWidth: '1000px' },
  statCard: { padding: '40px 20px', textAlign: 'center', borderRadius: '20px' },
  statNumber: { fontSize: '48px', fontWeight: '900', color: '#f8fafc', margin: '0 0 5px 0', letterSpacing: '-2px' },
  statText: { color: '#10b981', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' },
  
  sectionTitle: { fontSize: '42px', fontWeight: '800', margin: '0 0 15px 0', color: '#f8fafc', letterSpacing: '-1.5px' },
  
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  card: { padding: '40px', borderRadius: '24px', display: 'flex', flexDirection: 'column' },
  icon: { fontSize: '24px', marginBottom: '25px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))', width: '55px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' },
  cardTitle: { fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#f8fafc' },
  cardText: { color: '#94a3b8', lineHeight: '1.6', fontSize: '15px', margin: 0 },
  
  enterprise: { margin: '0 auto 80px auto', padding: '60px 40px', textAlign: 'center', borderRadius: '30px', background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(2,6,23,0.9))', position: 'relative', overflow: 'hidden' },
  enterpriseContent: { position: 'relative', zIndex: 2 },
  sectionText: { maxWidth: '800px', margin: '0 auto', color: '#cbd5e1', fontSize: '18px', lineHeight: '1.7' },
  
  footerWrapper: { background: '#020617', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '60px', paddingBottom: '30px', zIndex: 10, position: 'relative' },
  footerContainer: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', width: '100%', boxSizing: 'border-box' },
  footerBottom: { borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', textAlign: 'center', color: '#475569', fontSize: '13px' }
};