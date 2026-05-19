import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={styles.page}>
      {/* 🛑 CSS for Hover Effects & Smooth Scroll */}
      <style>
        {`
          html { scroll-behavior: smooth; }
          .card:hover { transform: translateY(-5px); transition: 0.3s; }
        `}
      </style>

      {/* Background Glows */}
      <div style={styles.bgGlow1}></div>
      <div style={styles.bgGlow2}></div>

      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.logo}>⚡ Subhams Secure Agent</div>
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#security" style={styles.navLink}>Security</a>
          <a href="#about" style={styles.navLink}>About</a>
        </div>
      </nav>

      <main style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.badge}>Secure Cloud Printing Platform</div>
          <h1 style={styles.title}>Subhams Secure Agent</h1>
          <h2 style={styles.name}>Venkata Pavan Kumar Amarthaluri</h2>
          <p style={styles.subtitle}>
            Professional encrypted cloud printing platform designed for modern businesses, 
            secure document handling, and seamless printing workflows.
          </p>
          <div style={styles.buttonGroup}>
            <Link to="/portal" style={styles.ctaButton}>Open Print Portal</Link>
           <a href="#features" style={{...styles.secondaryButton, textDecoration: 'none', display: 'inline-block'}}>
  Learn More
</a>
          </div>
        </section>

        {/* Stats Section */}
        <section style={styles.statsSection}>
          <div style={styles.statCard}>
            <h2 style={styles.statNumber}>99.9%</h2>
            <p style={styles.statText}>Secure Transfer Success</p>
          </div>
          <div style={styles.statCard}>
            <h2 style={styles.statNumber}>256-bit</h2>
            <p style={styles.statText}>Encrypted Document Security</p>
          </div>
          <div style={styles.statCard}>
            <h2 style={styles.statNumber}>24/7</h2>
            <p style={styles.statText}>Cloud Print Availability</p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={styles.grid}>
          <div style={{...styles.card, className: 'card'}}>
            <div style={styles.icon}>🔐</div>
            <h3 style={styles.cardTitle}>Secure Printing</h3>
            <p style={styles.cardText}>End-to-end encrypted document transfer with enterprise-grade protection for sensitive files.</p>
          </div>
          <div style={{...styles.card, className: 'card'}}>
            <div style={styles.icon}>☁️</div>
            <h3 style={styles.cardTitle}>Cloud Management</h3>
            <p style={styles.cardText}>Fast, reliable cloud-based printing workflows accessible from anywhere, anytime.</p>
          </div>
          <div style={{...styles.card, className: 'card'}}>
            <div style={styles.icon}>🗑️</div>
            <h3 style={styles.cardTitle}>Auto Data Wipe</h3>
            <p style={styles.cardText}>Privacy first: our system automatically removes sensitive files after successful print completion.</p>
          </div>
        </section>

        {/* Enterprise Section */}
        <section id="about" style={styles.enterprise}>
          <h2 style={styles.sectionTitle}>Enterprise Grade Infrastructure</h2>
          <p style={styles.sectionText}>
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
  page: { minHeight: '100vh', background: '#02140f', color: 'white', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' },
  bgGlow1: { position: 'absolute', width: '400px', height: '400px', background: 'rgba(34,197,94,0.15)', filter: 'blur(120px)', top: '-100px', left: '-100px', borderRadius: '50%' },
  bgGlow2: { position: 'absolute', width: '300px', height: '300px', background: 'rgba(16,185,129,0.12)', filter: 'blur(100px)', bottom: '-50px', right: '-50px', borderRadius: '50%' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 2 },
  
  navbar: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', background: 'rgba(2,20,15,0.7)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  logo: { fontSize: '22px', fontWeight: '800', color: '#4ade80' },
  navLinks: { display: 'flex', gap: '25px' },
  navLink: { color: '#cbd5e1', textDecoration: 'none', fontSize: '15px' },
  
  hero: { textAlign: 'center', paddingTop: '80px', marginBottom: '80px' },
  badge: { display: 'inline-block', padding: '10px 18px', borderRadius: '999px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', fontSize: '14px', marginBottom: '24px' },
  title: { fontSize: '64px', fontWeight: '900', marginBottom: '10px', letterSpacing: '-2px', color: '#f8fafc' },
  name: { fontSize: '20px', color: '#86efac', marginBottom: '30px', fontWeight: '500' },
  subtitle: { maxWidth: '700px', margin: '0 auto', color: '#cbd5e1', fontSize: '20px', lineHeight: '1.8' },
  
  buttonGroup: { marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '20px' },
  ctaButton: { background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white', padding: '16px 36px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', fontSize: '17px', boxShadow: '0 10px 30px rgba(34,197,94,0.35)' },
  secondaryButton: { background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.12)', padding: '16px 30px', borderRadius: '14px', fontSize: '16px', cursor: 'pointer', backdropFilter: 'blur(12px)' },
  
  statsSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '70px', marginBottom: '80px' },
  statCard: { background: 'rgba(255,255,255,0.04)', padding: '30px', borderRadius: '22px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(14px)' },
  statNumber: { fontSize: '32px', color: '#4ade80', marginBottom: '5px' },
  statText: { color: '#cbd5e1', fontSize: '14px' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '100px' },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '35px', backdropFilter: 'blur(14px)', transition: '0.3s' },
  icon: { fontSize: '32px', marginBottom: '20px' },
  cardTitle: { fontSize: '22px', marginBottom: '14px', color: '#4ade80' },
  cardText: { color: '#cbd5e1', lineHeight: '1.7', fontSize: '15px' },
  
  enterprise: { marginTop: '100px', textAlign: 'center', paddingBottom: '100px' },
  sectionTitle: { fontSize: '42px', marginBottom: '20px', color: '#4ade80' },
  sectionText: { maxWidth: '800px', margin: '0 auto', color: '#cbd5e1', fontSize: '18px', lineHeight: '1.8' },
  
  footer: { padding: '40px 0', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }
};