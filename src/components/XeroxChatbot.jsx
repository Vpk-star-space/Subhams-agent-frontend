import { useState, useEffect } from 'react';
import { Send, X, CheckCircle, Globe, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../api/api';

const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
};

const getGreetingTime = (lang) => {
    const hour = new Date().getHours();
    if (lang === "EN") {
        if (hour < 3) return "Good Day 🌙";
        if (hour < 12) return "Good Morning 🌅";
        if (hour < 17) return "Good Afternoon ☀️";
        return "Good Evening 🌇";
    } else {
        if (hour < 3) return "శుభ దినం 🌙";
        if (hour < 12) return "శుభోదయం 🌅";
        if (hour < 17) return "శుభ మధ్యాహ్నం ☀️"; 
        return "శుభ సాయంత్రం 🌇";
    }
};

const getDictionary = (path, lang, name, teName) => {
    const timeGreeting = getGreetingTime(lang);
    const isRegisterPage = path.includes('/register') || path.includes('/login');
    
    if (path.includes('/dashboard') || path.includes('/manage')) {
        return {
            greeting: lang === "EN" 
                ? `${timeGreeting}, **${name}**! 👨‍💼 Welcome to your Subhams Command Center. How may I assist with your operations today?`
                : `${timeGreeting}, **${teName}**! 👨‍💼 మీ కమాండ్ సెంటర్‌కు స్వాగతం. ఈరోజు నేను ఎలా సహాయపడగలను?`,
            options: lang === "EN"
                ? ["📊 Queue & Analytics", "🛡️ Security Matrix","⚠️ WhatsApp/Email Dangers", "📲 QR & Onboarding", "🖥️ Windows Agent", "⚙️ Server Limits", "✨ What is Subhams?","❓ How Subhams Works", "🌐 Our Other Projects", "⏱️ Email & OTP Delays","👑 Architect Support"]
                : ["📊 క్యూ & అనలిటిక్స్", "🛡️ సెక్యూరిటీ మ్యాట్రిక్స్","⚠️ వాట్సాప్/ఈమెయిల్ ప్రమాదాలు", "📲 QR ద్వారా పొందండి", "🖥️ విండోస్ ఏజెంట్", "⚙️ సర్వర్ పరిమితులు","✨ సుభమ్స్ అంటే ఏమిటి?", "❓ ఎలా పనిచేస్తుంది", "🌐 మా ఇతర ప్రాజెక్ట్‌లు", "⏱️ OTP ఆలస్యం గురించి","👑 అడ్మిన్ సపోర్ట్"],
            menuLabel: lang === "EN" ? "🏠 Return to Main Menu" : "🏠 ప్రధాన మెనూకు వెళ్లండి",
            menuHeader: lang === "EN" ? "Please select a strategic category:" : "దయచేసి ఒక వర్గాన్ని ఎంచుకోండి:",
            placeholder: lang === "EN" ? "Query the system..." : "వ్యవస్థ గురించి అడగండి..."
        };
    }
    
    if (isRegisterPage) {
        return {
            greeting: lang === "EN" 
                ? `${timeGreeting}! 🏪 Welcome to the Subhams Business Portal. Do you require assistance with your setup?`
                : `${timeGreeting}! 🏪 సుభమ్స్ బిజినెస్ పోర్టల్‌కు స్వాగతం. సెటప్ చేయడంలో మీకు సహాయం కావాలా?`,
            options: lang === "EN"
                ? ["🖥️ Desktop Agent Setup", "🛡️ Windows SmartScreen Fix", "✨ What is Subhams?", "❓ How Subhams Works", "🌐 Our Other Projects", "⏱️ Email & OTP Delays","👑 Contact Architect"]
                : ["🖥️ డెస్క్‌టాప్ ఏజెంట్ సెటప్", "🛡️ విండోస్ స్మార్ట్‌స్క్రీన్ ఫిక్స్", "✨ సుభమ్స్ అంటే ఏమిటి?", "❓ ఎలా పనిచేస్తుంది", "🌐 మా ఇతర ప్రాజెక్ట్‌లు", "⏱️ OTP ఆలస్యం గురించి","👑 అడ్మిన్‌ను సంప్రదించండి"],
            menuLabel: lang === "EN" ? "🏠 Return to Main Menu" : "🏠 ప్రధాన మెనూకు వెళ్లండి",
            menuHeader: lang === "EN" ? "Setup & configuration options:" : "సెటప్ ఎంపికలు:",
            placeholder: lang === "EN" ? "Ask for onboarding help..." : "సెటప్ సహాయం కోసం అడగండి..."
        };
    }
    
    return {
        greeting: lang === "EN" 
            ? `${timeGreeting}, **${name}**! 🙏 I am Subhams Intelligence. How may I streamline your printing experience today?`
            : `${timeGreeting}, **${teName}**! 🙏 నేను సుభమ్స్ AI సిస్టమ్. నేను మీకు ఎలా సహాయపడగలను?`,
        options: lang === "EN"
            ? ["🛡️ Print Modes (Govt/Private)","🎛️ Copies & Color Setup", "🪪 Smart ID Merge","🔒 Sensitive Info Print Out", "🔍 Track Print Status", "📦 Upload Rules", "✨ What is Subhams?", "❓ How Subhams Works", "🌐 Our Other Projects", "⏱️ Email & OTP Delays","👑 Contact Support"]
            : ["🛡️ ప్రింట్ మోడ్‌లు (Govt/Private)","🎛️ కలర్ & కాపీల సెట్టింగ్స్", "🪪 స్మార్ట్ ID మెర్జ్","🔒 సున్నితమైన పత్రాల ప్రింటింగ్", "🔍 ప్రింట్ స్టేటస్ ట్రాక్", "📦 అప్‌లోడ్ రూల్స్","✨ సుభమ్స్ అంటే ఏమిటి?","❓ ఎలా పనిచేస్తుంది", "🌐 మా ఇతర ప్రాజెక్ట్‌లు", "⏱️ OTP ఆలస్యం గురించి", "👑 అడ్మిన్ సపోర్ట్"],
        menuLabel: lang === "EN" ? "🏠 Return to Main Menu" : "🏠 ప్రధాన మెనూకు వెళ్లండి",
        menuHeader: lang === "EN" ? "Select an inquiry category:" : "ఒక వర్గాన్ని ఎంచుకోండి:",
        placeholder: lang === "EN" ? "Submit your query..." : "మీ ప్రశ్నను టైప్ చేయండి..."
    };
};

const XeroxChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [language, setLanguage] = useState("EN");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]); 

    const location = useLocation();
    const currentPath = location.pathname;

    const isOwnerPage = currentPath.includes('/dashboard') || currentPath.includes('/manage');
    let ownerName = localStorage.getItem('ownerName'); 
    
    if (ownerName === "Admin" || ownerName === "admin") {
        ownerName = null; 
    }

    const shopId = localStorage.getItem('shopId'); 
    const localCustomerName = localStorage.getItem('subhams_customerName'); 
    
    const rawName = isOwnerPage ? (ownerName || shopId || "Shop Partner") : (localCustomerName || "Guest");
    const customerName = rawName.trim();
    const teluguName = (customerName === "Guest" || customerName === "Shop Partner") ? "మిత్రమా" : customerName;

    const handleOpenChat = () => {
        const freshDict = getDictionary(currentPath, language, customerName, teluguName);
        setMessages([
            { sender: 'bot', text: freshDict.greeting, options: freshDict.options, optionsDisabled: false, time: getCurrentTime() }
        ]);
        setIsOpen(true);
    };

    const toggleLanguage = () => {
        const newLang = language === "EN" ? "TE" : "EN";
        setLanguage(newLang);
        const freshDict = getDictionary(currentPath, newLang, customerName, teluguName);
        setMessages([
            { sender: 'bot', text: freshDict.greeting, options: freshDict.options, optionsDisabled: false, time: getCurrentTime() }
        ]);
    };

    // 🟢 INTELLIGENT SCROLL FIX (Solves the text cut-off issue!)
    useEffect(() => {
        const chatBody = document.getElementById('subhams-chat-body');
        if (!chatBody) return;

        if (messages.length === 1) {
            // Very first message: Stay exactly at the top
            chatBody.scrollTop = 0;
        } else {
            // New messages: Smooth scroll to the bottom of the container
            setTimeout(() => {
                chatBody.scrollTo({
                    top: chatBody.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [messages]);

    const handleSendMessage = async (text, isMenuAction = false) => {
        if (!text.trim() || loading) return;

        setMessages(prev => prev.map(m => ({ ...m, optionsDisabled: true })));
        setMessages(prev => [...prev, { sender: 'user', text: text.trim(), time: getCurrentTime() }]);
        setInput("");
        setLoading(true);

        const currentDict = getDictionary(currentPath, language, customerName, teluguName);
        
        const lowerInput = text.toLowerCase().trim();
        const isReturnTrigger = lowerInput.includes("return to main menu") || lowerInput.includes("ప్రధాన మెనూ") || lowerInput === "back";

        if (isMenuAction && isReturnTrigger) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: currentDict.menuHeader,
                    options: currentDict.options,
                    optionsDisabled: false,
                    time: getCurrentTime()
                }]);
                setLoading(false);
            }, 400);
            return; 
        }

        try {
            const token = localStorage.getItem('accessToken');
           

        const res = await api.post('/support/chat', 
                { 
                    message: text, 
                    lang: language, 
                    path: currentPath,
                    userName: customerName,
                    teName: teluguName,
                    localHour: new Date().getHours() 
                }, 
                { headers: { Authorization: token ? `Bearer ${token}` : '' } } 
            );

            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: res.data.reply,
                options: res.data.options || (res.data.isMainTrigger ? currentDict.options : [currentDict.menuLabel]),
                isMainMenuTrigger: res.data.isMainTrigger !== undefined ? res.data.isMainTrigger : true,
                optionsDisabled: false,
                time: getCurrentTime()
            }]);

        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: language === "EN" ? "⚠️ Communication array disconnected. Please try again." : "⚠️ నెట్‌వర్క్ కనెక్షన్ విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
                options: [currentDict.menuLabel],
                isMainMenuTrigger: true,
                optionsDisabled: false,
                time: getCurrentTime()
            }]);
        } finally {
            setLoading(false);
        }
    };

   return (
       <>
           <style>
               {`
                   @keyframes gradientShift {
                       0% { background-position: 0% 50%; }
                       50% { background-position: 100% 50%; }
                       100% { background-position: 0% 50%; }
                   }
                   
                   @keyframes ringPulse {
                       0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5), 0 10px 20px rgba(0,0,0,0.2); }
                       70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0), 0 10px 20px rgba(0,0,0,0.2); }
                       100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), 0 10px 20px rgba(0,0,0,0.2); }
                   }

                   .chat-force-font, .chat-force-font * {
                       font-family: 'Inter', system-ui, sans-serif !important;
                   }

                   .subhams-premium-btn {
                       position: fixed;
                       bottom: 30px;
                       right: 30px;
                       padding: 14px 28px;
                       border-radius: 999px;
                       background: linear-gradient(135deg, #059669 0%, #10b981 50%, #2563eb 100%);
                       background-size: 200% 200%;
                       animation: gradientShift 4s ease infinite, ringPulse 2.5s infinite;
                       color: #ffffff;
                       border: 1px solid rgba(255, 255, 255, 0.4);
                       cursor: pointer;
                       display: flex;
                       align-items: center;
                       gap: 10px;
                       z-index: 99999;
                       transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                       backdrop-filter: blur(10px);
                   }

                   .subhams-premium-btn:hover {
                       transform: translateY(-5px) scale(1.05);
                       border-color: #ffffff;
                       animation: gradientShift 4s ease infinite;
                       box-shadow: 0 15px 35px rgba(16, 185, 129, 0.6);
                   }

                   .btn-text-glow {
                       font-family: 'Inter', sans-serif;
                       font-weight: 800;
                       font-size: 15px;
                       letter-spacing: 0.5px;
                   }

                   /* 🟢 PERFECT NATIVE MOBILE UI (Fixes Screenshot 2 Issue) */
                   @media (max-width: 768px) {
                       .subhams-premium-btn {
                           padding: 16px;
                           border-radius: 50%;
                           bottom: 20px;
                           right: 20px;
                           gap: 0;
                       }
                       .btn-text-glow { 
                           display: none !important; 
                       }
                       .mobile-chat-window {
                           width: 100vw !important;
                           height: 85dvh !important; 
                           max-height: 85dvh !important;
                           bottom: 0 !important; /* Docks completely to the bottom */
                           right: 0 !important;
                           border-radius: 24px 24px 0 0 !important; /* Native bottom-sheet curve */
                           border: none !important;
                           box-shadow: 0 -10px 40px rgba(0,0,0,0.2) !important;
                       }
                   }
               `}
           </style>

           {!isOpen ? (
               <button onClick={handleOpenChat} className="subhams-premium-btn">
                   <Sparkles size={22} color="#ffffff" strokeWidth={2.5} /> 
                   <span className="btn-text-glow">
                       Ask Subhams
                   </span>
               </button>
           ) : (
               <div className="mobile-chat-window chat-force-font" style={styles.chatWindow}>
                   <div style={styles.header}>
                       <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                           <Sparkles size={20} color="#34d399" />
                           <div style={{fontWeight:'800', fontSize:'15px', letterSpacing: '0.3px'}}>Subhams Intelligence</div>
                       </div>
                       <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                           <button onClick={toggleLanguage} style={styles.langBtn}>
                               {language === "EN" ? <span style={{fontSize:'12px', fontWeight:'900'}}></span> : <Globe size={12} />}
                               {language === "EN" ? "తెలుగు" : "English"}
                           </button>
                           <X size={22} onClick={() => setIsOpen(false)} style={{cursor:'pointer', opacity: 0.7, transition: '0.2s'}} onMouseEnter={(e)=>e.currentTarget.style.opacity=1} onMouseLeave={(e)=>e.currentTarget.style.opacity=0.7}/>
                       </div>
                   </div>
                   
                   {/* 🟢 ADDED ID HERE FOR INTELLIGENT SCROLLING */}
                   <div id="subhams-chat-body" style={styles.body}>
                       <div style={styles.securityNote}>
                           <CheckCircle size={12} color="#10b981" /> End-To-End Encrypted Session
                       </div>

                       {messages.map((msg, idx) => (
                           <div key={idx} style={{display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '14px'}}>
                               
                               <div style={msg.sender === 'bot' ? styles.botBubble : styles.userBubble}>
                                   <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                   
                                   <div style={{
                                       fontSize: '10px', 
                                       color: msg.sender === 'bot' ? '#94a3b8' : '#d1fae5', 
                                       textAlign: 'right', 
                                       marginTop: '6px',
                                       display: 'flex',
                                       justifyContent: 'flex-end',
                                       alignItems: 'center',
                                       gap: '4px',
                                       fontWeight: '600'
                                   }}>
                                       {msg.time} {msg.sender === 'user' && <span style={{color: '#ffffff'}}>✓✓</span>}
                                   </div>
                               </div>

                               {msg.options && msg.options.length > 0 && (
                                   <div style={{
                                       display: 'flex',
                                       flexWrap: 'wrap', 
                                       gap: '8px',
                                       marginTop: '10px',
                                       opacity: msg.optionsDisabled ? 0.45 : 1,
                                       pointerEvents: msg.optionsDisabled ? 'none' : 'auto',
                                       justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                                   }}>
                                       {msg.options.map((opt, i) => (
                                           <button 
                                               key={i} 
                                               onClick={() => handleSendMessage(opt, msg.isMainMenuTrigger)} 
                                               style={msg.isMainMenuTrigger ? styles.menuMainLinkItem : styles.menuItem}
                                               onMouseOver={(e) => {
                                                   e.currentTarget.style.backgroundColor = msg.isMainMenuTrigger ? '#d1fae5' : '#f8fafc';
                                                   e.currentTarget.style.transform = 'translateY(-2px)';
                                                   e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.08)';
                                               }}
                                               onMouseOut={(e) => {
                                                   e.currentTarget.style.backgroundColor = msg.isMainMenuTrigger ? '#ecfdf5' : '#ffffff';
                                                   e.currentTarget.style.transform = 'translateY(0)';
                                                   e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                                               }}
                                           >
                                               {opt}
                                           </button>
                                       ))}
                                   </div>
                               )}
                           </div>
                       ))}
                       
                       {loading && <div style={{fontSize: '14px', color: '#94a3b8', paddingLeft: '10px', fontStyle: 'italic'}}>Subhams is typing...</div>}
                   </div>

                   <div style={styles.footer}>
                       <input 
                           style={styles.input} 
                           value={input} 
                           onChange={(e) => setInput(e.target.value)} 
                           onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                           placeholder={getDictionary(currentPath, language, customerName, teluguName).placeholder}
                       />
                       <button onClick={() => handleSendMessage(input)} style={styles.sendBtn}>
                           <Send size={16} strokeWidth={2.5} />
                       </button>
                   </div>
               </div>
           )}
       </>
   );
};

const styles = {
    /* 🟢 DESKTOP UI: Wider (390px) and Taller (700px) to comfortably fit long text */
    chatWindow: { position: 'fixed', bottom: '24px', right: '24px', width: '390px', height: '700px', maxHeight: '85vh', backgroundColor: '#f8fafc', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 99999, overflow: 'hidden', border: '1px solid #e2e8f0' },
    header: { padding: '14px 18px', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    langBtn: { backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
    body: { flex: 1, padding: '16px', overflowY: 'auto' },
    securityNote: { textAlign: 'center', fontSize: '10px', color: '#64748b', marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontWeight: '800', textTransform: 'uppercase' },
    botBubble: { backgroundColor: '#ffffff', padding: '14px', borderRadius: '0 14px 14px 14px', width: '100%', maxWidth: '92%', fontSize: '13.5px', lineHeight: '1.5', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', color: '#1e293b', border: '1px solid #e2e8f0' },
    userBubble: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', padding: '12px 16px', borderRadius: '14px 0 14px 14px', alignSelf: 'flex-end', maxWidth: '85%', fontSize: '13.5px', boxShadow: '0 4px 10px rgba(16,185,129,0.2)', fontWeight: '500' },
    
    /* 🟢 BUTTON SIZING: Compact to fit beautifully side-by-side */
    menuItem: { padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '20px', cursor: 'pointer', backgroundColor: '#ffffff', fontWeight: '600', fontSize: '12.5px', color: '#0f172a', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },
    menuMainLinkItem: { padding: '6px 14px', border: '1px solid #10b981', borderRadius: '20px', cursor: 'pointer', backgroundColor: '#ecfdf5', fontWeight: '700', fontSize: '12.5px', color: '#047857', transition: 'all 0.2s ease' },
    
    footer: { padding: '12px 16px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center' },
    input: { flex: 1, padding: '12px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: '500' },
    sendBtn: { background: '#10b981', color: '#fff', border: 'none', borderRadius: '50%', width: '42px', height: '42px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 8px rgba(16, 185, 129, 0.2)' }
};

export default XeroxChatbot;