import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const PrintPass = forwardRef(({ passData, shopId, uploadLink }, ref) => {
    // 🟢 Strict language check
    const isEnglish = passData.lang === 'en';

    // Style Constants
    const colors = {
        primary: '#2563eb', // Blue
        success: '#16a34a', // Green
        text: '#0f172a',    // Deep Black/Slate for better readability
        muted: '#475569',   // Dark Grey
        googleBlue: '#4285F4' // Google Brand Blue
    };

    return (
        <div ref={ref} style={{ 
            width: '210mm', 
            height: '285mm', 
            padding: '5mm 12mm', 
            fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
            color: colors.text, 
            background: '#fff',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden'
        }}>
            {/* 1. Branding Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '30px', color: colors.primary, fontWeight: '900', letterSpacing: '1px' }}>
                    SUBHAMS SECURE NETWORKS
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.muted, letterSpacing: '0.5px' }}>
                    🛡️ Subhams Secure Agent | Subhams VPK
                </p>
                <h2 style={{ margin: '8px 0 0 0', fontSize: '22px', fontWeight: '700', color: colors.text }}>
                    WELCOME
                </h2>
            </div>
             
            {/* 2. Customer Personalization */}
            <div style={{ textAlign: 'center', margin: '15px 0', padding: '15px 0', background: '#f8fafc', borderRadius: '12px' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '34px', fontWeight: '800', color: colors.primary }}>
                    🙏 {passData.name || "Valued Customer"} 🙏
                </h2>
                <div style={{ width: '80px', height: '4px', background: colors.success, margin: '8px auto', borderRadius: '2px' }}></div>
                <p style={{ margin: '10px 0', fontSize: '18px', fontWeight: '500' }}>📍 {passData.address}</p>
                
                {passData.paymentNumber && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: colors.text }}>
                        <span style={{color: colors.success}}>💳 {isEnglish ? "UPI Payment:" : "చెల్లింపు (UPI):"}</span> {passData.paymentNumber}
                    </p>
                )}
            </div>
            
            {/* 3. QR Code Section */}
            <div style={{ textAlign: 'center', margin: '5px 0' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 15px 0', color: colors.text }}>
                    📷 {isEnglish ? "SCAN TO SECURELY PRINT DOCUMENTS" : "డాక్యుమెంట్లను సురక్షితంగా ప్రింట్ చేయడానికి స్కాన్ చేయండి"}
                </h2>
                <div style={{ padding: '12px', background: '#fff', border: '3px solid #cbd5e1', borderRadius: '16px', display: 'inline-block', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <QRCodeSVG value={uploadLink} size={200} level="H" />
                </div>
            </div>
            
            {/* Shop ID */}
            <div style={{ textAlign: 'center', margin: '15px 0' }}>
                <div style={{ display: 'inline-block', border: `2px dashed ${colors.primary}`, padding: '6px 16px', borderRadius: '8px', background: '#eff6ff' }}>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>
                        🖨️ {isEnglish ? "Shop ID:" : "షాప్ ID:"} <span style={{ color: colors.text }}>{shopId}</span>
                    </p>
                </div>
            </div>

            {/* 4. Footer & Branding */}
            <div style={{ fontSize: '12px', textAlign: 'center', lineHeight: '1.5', borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}>
                
                {/* 🟢 Custom Google-style Search Line */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <p style={{ margin: 0, fontWeight: '800', color: colors.googleBlue, fontSize: '14px' }}>
                        {isEnglish ? "Search: Subhams VPK | Subhams Secure Agent" : "సెర్చ్ చేయండి: Subhams VPK | Subhams Secure Agent"}
                    </p>
                </div>

                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: colors.muted, fontWeight: '600' }}>
                    🌐 Link: https://agent.subhamsnetworks.in/
                </p>
                <p style={{ margin: 0, fontWeight: '800', color: colors.success }}>
                    🛡️ {isEnglish ? "Our Security Promise:" : "మా భద్రతా వాగ్దానం:"}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: '500' }}>
                    {isEnglish 
                        ? "Your document is secure. It is permanently wiped from our system after printing. We respect your privacy." 
                        : "మీ డాక్యుమెంట్ సురక్షితం. ప్రింట్ అయిన తర్వాత మీ ఫైల్ సిస్టమ్ నుండి శాశ్వతంగా డిలీట్ చేయబడుతుంది. మీ గోప్యత మా బాధ్యత."}
                </p>
            </div>
        </div>
    );
});

export default PrintPass;