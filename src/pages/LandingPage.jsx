import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={styles.page}>
      {/* 🛑 ADVANCED CSS: Animations & Mobile Responsiveness */}
      <style>
        {`
          html { scroll-behavior: smooth; }
          
          /* Hover Effects */
          .glass-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
          .glass-card:hover { 
            transform: translateY(-8px); 
            box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
            border-color: rgba(52, 211, 153, 0.3);
          }

          /* Animations */
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-30px) scale(1.05); }
          }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }

          .animate-fade { animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .glow-1 { animation: floatSlow 8s ease-in-out infinite; }
          .glow-2 { animation: floatSlow 12s ease-in-out infinite reverse; }
          
          .btn-primary { animation: pulseGlow 3s infinite; }
          .btn-primary:hover { transform: scale(1.05); animation: none; }
          .btn-secondary:hover { background: rgba(255,255,255,0.1) !important; transform: scale(1.05); }

          /* 📱 MOBILE RESPONSIVENESS */
          @media (max-width: 768px) {
            .nav-links { display: none !important; } /* Hide links on small mobile to save space */
            .hero-title { font-size: 42px !important; line-height: 1.1 !important; }
            .hero-subtitle { font-size: 16px !important; padding: 0 10px; }
            .hero-name { font-size: 16px !important; }
            .button-group { flex-direction: column !important; align-items: stretch !important; gap: 15px !important; padding: 0 20px; }
            .section-title { font-size: 32px !important; }
            .stat-container { grid-template-columns: 1fr !important; }
          }
        `}
      </style>

      {/* Animated Background Glows */}
      <div className="glow-1" style={styles.bgGlow1}></div>
      <div className="glow-2" style={styles.bgGlow2}></div>

      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.logo}>
          <span style={{ fontSize: '24px', marginRight: '8px' }}>⚡</span> 
          Subhams Secure Agent
        </div>
        <div className="nav-links" style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#security" style={styles.navLink}>Security</a>
          <a href="#about" style={styles.navLink}>About</a>
        </div>
      </nav>

      <main style={styles.container}>
        {/* Hero Section */}
        <section className="animate-fade" style={styles.hero}>
          <div style={styles.badge}>✨ Secure Cloud Printing Platform</div>
          <h1 className="hero-title" style={styles.title}>Subhams Secure Agent</h1>
          <h2 className="hero-name" style={styles.name}>Venkata Pavan Kumar Amarthaluri</h2>
          <p className="hero-subtitle" style={styles.subtitle}>
            Professional encrypted cloud printing platform designed for modern businesses. 
            Experience secure document handling and seamless, zero-retention printing workflows.
          </p>
          <div className="button-group" style={styles.buttonGroup}>
            <Link to="/portal" className="btn-primary" style={styles.ctaButton}>
              Open Print Portal
            </Link>
            <a href="#features" className="btn-secondary" style={styles.secondaryButton}>
              Explore Features
            </a>
          </div>
        </section>

        {/* Stats Section */}
        <section id="security" className="stat-container animate-fade" style={{...styles.grid, ...styles.statsSection, animationDelay: '0.2s', opacity: 0}}>
          <div className="glass-card" style={styles.statCard}>
            <h2 style={styles.statNumber}>99.9%</h2>
            <p style={styles.statText}>Secure Transfer Success</p>
          </div>
          <div className="glass-card" style={styles.statCard}>
            <h2 style={styles.statNumber}>256-bit</h2>
            <p style={styles.statText}>Encrypted Document Security</p>
          </div>
          <div className="glass-card" style={styles.statCard}>
            <h2 style={styles.statNumber}>24/7</h2>
            <p style={styles.statText}>Cloud Print Availability</p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="animate-fade" style={{...styles.grid, animationDelay: '0.4s', opacity: 0}}>
          <div className="glass-card" style={styles.card}>
            <div style={styles.icon}>🔐</div>
            <h3 style={styles.cardTitle}>Secure Printing</h3>
            <p style={styles.cardText}>End-to-end encrypted document transfer with enterprise-grade protection for sensitive files.</p>
          </div>
          <div className="glass-card" style={styles.card}>
            <div style={styles.icon}>☁️</div>
            <h3 style={styles.cardTitle}>Cloud Management</h3>
            <p style={styles.cardText}>Fast, reliable cloud-based printing workflows accessible from anywhere, anytime.</p>
          </div>
          <div className="glass-card" style={styles.card}>
            <div style={styles.icon}>🗑️</div>
            <h3 style={styles.cardTitle}>Auto Data Wipe</h3>
            <p style={styles.cardText}>Privacy first: our system automatically removes sensitive files immediately after print completion.</p>
          </div>
        </section>

        {/* Enterprise Section */}
        <section id="about" className="animate-fade" style={{...styles.enterprise, animationDelay: '0.6s', opacity: 0}}>
          <h2 className="section-title" style={styles.sectionTitle}>Enterprise Grade Infrastructure</h2>
          <p className="hero-subtitle" style={styles.sectionText}>
            Subhams Secure Agent provides professional cloud-based secure printing infrastructure designed for 
            educational institutions, offices, enterprises, and modern organizations. We ensure 
            sovereign digital environments for document verification.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 Subhams Secure Agent</p>
        <p style={{marginTop: '10px', fontSize: '14px', color: '#64748b'}}>
          Developed by Venkata Pavan Kumar Amarthaluri
        </p>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#02140f', color: 'white', fontFamily: "'Inter', sans-serif", overflowX: 'hidden', position: 'relative' },
  bgGlow1: { position: 'absolute', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)', top: '-150px', left: '-150px', borderRadius: '50%', zIndex: 1 },
  bgGlow2: { position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(52,211,153,0.1) 0%, rgba(0,0,0,0) 70%)', bottom: '-200px', right: '-200px', borderRadius: '50%', zIndex: 1 },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 2 },
  
  navbar: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5%', background: 'rgba(2,20,15,0.7)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  logo: { fontSize: '20px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', gap: '30px' },
  navLink: { color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.3s' },
  
  hero: { textAlign: 'center', paddingTop: '100px', paddingBottom: '60px' },
  badge: { display: 'inline-block', padding: '8px 20px', borderRadius: '999px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '13px', fontWeight: '600', marginBottom: '30px', backdropFilter: 'blur(10px)' },
  title: { fontSize: '72px', fontWeight: '900', marginBottom: '15px', letterSpacing: '-2.5px', background: 'linear-gradient(to right, #ffffff, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  name: { fontSize: '20px', color: '#34d399', marginBottom: '30px', fontWeight: '500', letterSpacing: '1px' },
  subtitle: { maxWidth: '750px', margin: '0 auto', color: '#94a3b8', fontSize: '20px', lineHeight: '1.7' },
  
  buttonGroup: { marginTop: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' },
  ctaButton: { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', padding: '18px 40px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', fontSize: '16px', transition: 'all 0.3s', border: '1px solid rgba(16, 185, 129, 0.5)' },
  secondaryButton: { background: 'rgba(255,255,255,0.03)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', padding: '18px 40px', borderRadius: '14px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', transition: 'all 0.3s', backdropFilter: 'blur(10px)' },
  
  statsSection: { marginTop: '40px', marginBottom: '100px' },
  statCard: { background: 'rgba(255,255,255,0.02)', padding: '35px 20px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' },
  statNumber: { fontSize: '40px', fontWeight: '800', color: '#34d399', marginBottom: '10px', letterSpacing: '-1px' },
  statText: { color: '#94a3b8', fontSize: '15px', fontWeight: '500' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '100px' },
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px', backdropFilter: 'blur(20px)' },
  icon: { fontSize: '38px', marginBottom: '25px', background: 'rgba(16,185,129,0.1)', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px' },
  cardTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '15px', color: '#f8fafc' },
  cardText: { color: '#94a3b8', lineHeight: '1.7', fontSize: '16px' },
  
  enterprise: { textAlign: 'center', paddingBottom: '120px' },
  sectionTitle: { fontSize: '48px', fontWeight: '800', marginBottom: '25px', color: '#f8fafc', letterSpacing: '-1px' },
  sectionText: { maxWidth: '800px', margin: '0 auto', color: '#94a3b8', fontSize: '18px', lineHeight: '1.8' },
  
  footer: { padding: '40px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }
};