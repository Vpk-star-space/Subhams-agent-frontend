import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const PrintPass = forwardRef(({ passData, shopId, uploadLink }, ref) => {
 

    // 🟢 Fix: Default to true (English) if lang is missing
    const isEnglish = passData.lang === 'en'; 

    // Style Constants
    const colors = {
        primary: '#2563eb', // Blue
        success: '#16a34a', // Green
        text: '#000',       // Black
        muted: '#475569'    // Dark Grey
    };

    return (
        <div ref={ref} style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            padding: '10mm', 
            fontFamily: 'Arial, sans-serif', 
            color: colors.text, 
            background: '#fff',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden'
        }}>
            {/* 1. Branding Header */}
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '32px', color: colors.primary, fontWeight: '900', textTransform: 'uppercase' }}>
                    SUBHAMS SECURE NETWORKS
                </h1>
                <p style={{ margin: '5px 0', fontSize: '14px', color: colors.muted }}>Subhams Secure Agent | Subhams VPK</p>
            </div>
             
             <div style={{ textAlign: 'center' }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold' }}>
                    WELCOME
                    </h2>
             </div>
            {/* 2. Customer Personalization */}
            <div style={{ textAlign: 'center', margin: '40px 0' }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '40px', fontWeight: '800' }}>
                    🙏 {passData.name || "Valued Customer"} 🙏
                </h2>
                <div style={{ width: '150px', height: '4px', background: colors.success, margin: '10px auto' }}></div>
                <p style={{ margin: '15px 0', fontSize: '18px' }}>📍{passData.address}</p>
                
                {passData.paymentNumber && (
                    <p style={{ margin: '10px 0', fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>
                       💳 {isEnglish ? "UPI Payment:" : "చెల్లింపు (UPI):"} {passData.paymentNumber}
                    </p>
                )}
            </div>
            
            {/* 3. QR Code Section */}
            <div style={{ textAlign: 'center', margin: '40px 0' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 20px 0', color: colors.text }}>
                    📷{isEnglish ? "SCAN TO UPLOAD DOCUMENTS" : "డాక్యుమెంట్లను అప్‌లోడ్ చేయడానికి స్కాన్ చేయండి"}
                </h2>
                <div style={{ padding: '20px', background: '#fff', border: '3px solid #000', display: 'inline-block' }}>
                    <QRCodeSVG value={uploadLink} size={300} level="H" />
                </div>
            </div>
           
                {/* 🟢 Added Shop ID here */}
                <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold', color: colors.text }}>
                    🖨️{isEnglish ? "Shop ID:" : "షాప్ ID:"} {shopId}
                </p>

            {/* 4. Footer & Branding */}
            <div style={{ fontSize: '14px', textAlign: 'center', lineHeight: '1.8', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: colors.success }}>
                    🔍{isEnglish ? "Search Google for: Subhams VPK | Subhams Secure Agent" : "గూగుల్‌లో సెర్చ్ చేయండి: Subhams VPK | Subhams Secure Agent"}
                </p>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: colors.muted }}>
                    🌐Link: subhams-vpk.vercel.app
                </p>
                <p style={{ margin: 0, fontWeight: 'bold' }}>
                    {isEnglish ? "Our Security Promise:" : "మా భద్రతా వాగ్దానం:"}
                </p>
                <p style={{ margin: 0, fontSize: '10px' }}>
                    🛡️{isEnglish 
                        ? "Your document is secure. It is permanently wiped from our system after printing. We respect your privacy." 
                        : "మీ డాక్యుమెంట్ సురక్షితం. ప్రింట్ అయిన తర్వాత మీ ఫైల్ సిస్టమ్ నుండి శాశ్వతంగా డిలీట్ చేయబడుతుంది. మీ గోప్యత మా బాధ్యత."}
                </p>
            </div>
        </div>
    );
});

export default PrintPass;