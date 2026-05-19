import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, CheckCircle, Globe, Printer } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
};

const getGreetingTime = (lang) => {
    const hour = new Date().getHours();
    if (lang === "EN") {
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    } else {
        if (hour < 12) return "శుభోదయం";
        if (hour < 18) return "శుభాహ్నం";
        return "శుభ సాయంత్రం";
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
            // 🚀 THE NEW 6 ADVANCED SHOP MENUS
            options: lang === "EN"
                ? ["📊 Queue & Analytics", "🛡️ Security Matrix", "📲 QR & Onboarding", "🖥️ Windows Agent", "⚙️ Server Limits", "👑 Architect Support"]
                : ["📊 క్యూ & అనలిటిక్స్", "🛡️ సెక్యూరిటీ మ్యాట్రిక్స్", "📲 QR ద్వారా పొందండి", "🖥️ విండోస్ ఏజెంట్", "⚙️ సర్వర్ పరిమితులు", "👑 అడ్మిన్ సపోర్ట్"],
            menuLabel: lang === "EN" ? "Return to Main Menu" : "ప్రధాన మెనూకు తిరిగి వెళ్లండి",
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
                ? ["🖥️ Desktop Agent Setup", "🛡️ Windows SmartScreen Fix", "👑 Contact Architect"]
                : ["🖥️ డెస్క్‌టాప్ ఏజెంట్ సెటప్", "🛡️ విండోస్ స్మార్ట్‌స్క్రీన్ ఫిక్స్", "👑 అడ్మిన్‌ను సంప్రదించండి"],
            menuLabel: lang === "EN" ? "Return to Main Menu" : "ప్రధాన మెనూకు తిరిగి వెళ్లండి",
            menuHeader: lang === "EN" ? "Setup & configuration options:" : "సెటప్ ఎంపికలు:",
            placeholder: lang === "EN" ? "Ask for onboarding help..." : "సెటప్ సహాయం కోసం అడగండి..."
        };
    }
    
    return {
        greeting: lang === "EN" 
            ? `${timeGreeting}, **${name}**! 🙏 I am Subhams Intelligence. How may I streamline your printing experience today?`
            : `${timeGreeting}, **${teName}**! 🙏 నేను సుభమ్స్ AI సిస్టమ్. నేను మీకు ఎలా సహాయపడగలను?`,
        // 🚀 THE NEW 6 ADVANCED CUSTOMER MENUS
        options: lang === "EN"
            ? ["🛡️ Print Modes (Govt/Private)", "🪪 Smart ID Merge", "🔍 Track Print Status", "📦 Upload Rules", "👑 Contact Support"]
            : ["🛡️ ప్రింట్ మోడ్‌లు", "🪪 స్మార్ట్ ID మెర్జ్", "🔍 ప్రింట్ స్టేటస్ ట్రాక్", "📦 అప్‌లోడ్ రూల్స్", "👑 అడ్మిన్ సపోర్ట్"],
        menuLabel: lang === "EN" ? "Return to Main Menu" : "ప్రధాన మెనూకు తిరిగి వెళ్లండి",
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
    const chatEndRef = useRef(null);

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

    const currentDict = getDictionary(currentPath, language, customerName, teluguName);

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

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (text, isMenuAction = false) => {
        if (!text.trim() || loading) return;

        setMessages(prev => prev.map(m => ({ ...m, optionsDisabled: true })));
        setMessages(prev => [...prev, { sender: 'user', text: text.trim(), time: getCurrentTime() }]);
        setInput("");
        setLoading(true);

        if (isMenuAction && (text === "Return to Main Menu" || text === "ప్రధాన మెనూకు తిరిగి వెళ్లండి" || text === "Back to Categories")) {
            setTimeout(() => {
                const updatedDict = getDictionary(currentPath, language, customerName, teluguName);
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: updatedDict.menuHeader,
                    options: updatedDict.options,
                    optionsDisabled: false,
                    time: getCurrentTime()
                }]);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://subhams-vpk.onrender.com';

            const res = await axios.post(
                `${BACKEND_URL}/api/support/chat`, 
                { 
                    message: text, 
                    lang: language, 
                    path: currentPath,
                    userName: customerName,
                    teName: teluguName
                }, 
                { headers: { Authorization: token ? `Bearer ${token}` : '' } } 
            );

            // 🚀 THE MAGIC: The frontend now accepts sub-menus directly from your backend!
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: res.data.reply,
                options: res.data.options || [currentDict.menuLabel],
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
                    @keyframes professionalPulse {
                        0% { transform: scale(1); box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); }
                        50% { transform: scale(1.05); box-shadow: 0 8px 25px rgba(37, 99, 235, 0.5); }
                        100% { transform: scale(1); box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); }
                    }
                    .subhams-help-btn {
                        animation: professionalPulse 2.5s infinite ease-in-out;
                    }
                    .subhams-help-btn:hover {
                        animation: none;
                        transform: scale(1.05);
                    }
                `}
            </style>

            {!isOpen ? (
                <button 
                    onClick={handleOpenChat} 
                    className="subhams-help-btn"
                    style={styles.floatingBtn}
                >
                    <MessageCircle size={22} /> 
                    <span style={{fontWeight:'800', fontSize: '14.5px', letterSpacing: '0.3px'}}>✨ Ask Subhams</span>
                </button>
            ) : (
                <div style={styles.chatWindow}>
                    <div style={styles.header}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <Printer size={20} />
                            <div style={{fontWeight:'700', fontSize:'15px', letterSpacing: '0.3px'}}>Subhams Intelligence</div>
                        </div>
                        <div style={{display:'flex', gap:'14px', alignItems:'center'}}>
                            <button onClick={toggleLanguage} style={styles.langBtn}>
                                {language === "EN" ? <span style={{fontSize:'14px', fontWeight:'900'}}>అ</span> : <Globe size={13} />}
                                {language === "EN" ? "తెలుగు" : "English"}
                            </button>
                            <X size={22} onClick={() => setIsOpen(false)} style={{cursor:'pointer', opacity: 0.8}} />
                        </div>
                    </div>

                    <div style={styles.body}>
                        <div style={styles.securityNote}>
                            <CheckCircle size={13} color="#10b981" /> End-To-End Encrypted Session
                        </div>

                        {messages.map((msg, idx) => (
                            <div key={idx} style={{display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '16px'}}>
                                
                                <div style={msg.sender === 'bot' ? styles.botBubble : styles.userBubble}>
                                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                    
                                    <div style={{
                                        fontSize: '10px', 
                                        color: msg.sender === 'bot' ? '#94a3b8' : '#bfdbfe', 
                                        textAlign: 'right', 
                                        marginTop: '4px',
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {msg.time} {msg.sender === 'user' && <span style={{color: '#60a5fa'}}>✓✓</span>}
                                    </div>
                                </div>

                                {msg.options && msg.options.length > 0 && (
                                    <div style={{
                                        ...styles.menuWrapper,
                                        opacity: msg.optionsDisabled ? 0.45 : 1,
                                        pointerEvents: msg.optionsDisabled ? 'none' : 'auto',
                                        width: msg.isMainMenuTrigger ? 'auto' : '100%'
                                    }}>
                                        {msg.options.map((opt, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handleSendMessage(opt, msg.isMainMenuTrigger)} 
                                                style={msg.isMainMenuTrigger ? styles.menuMainLinkItem : styles.menuItem}
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {loading && <div style={{fontSize: '20px', color: '#94a3b8', paddingLeft: '10px'}}>...</div>}
                        <div ref={chatEndRef} />
                    </div>

                    <div style={styles.footer}>
                        <input 
                            style={styles.input} 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                            placeholder={currentDict.placeholder}
                        />
                        <button onClick={() => handleSendMessage(input)} style={styles.sendBtn}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

const styles = {
    floatingBtn: { position: 'fixed', bottom: '30px', right: '30px', backgroundColor: '#2563eb', color: '#fff', padding: '14px 24px', borderRadius: '30px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 9999, transition: '0.3s ease' },
    chatWindow: { position: 'fixed', bottom: '20px', right: '20px', width: '380px', height: '620px', backgroundColor: '#f8fafc', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 9999, overflow: 'hidden', border: '1px solid #e2e8f0' },
    header: { padding: '16px', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155' },
    langBtn: { backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', transition: '0.2s' },
    body: { flex: 1, padding: '16px', overflowY: 'auto' },
    securityNote: { textAlign: 'center', fontSize: '11px', color: '#64748b', marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
    botBubble: { backgroundColor: '#ffffff', padding: '14px 16px', borderRadius: '0 16px 16px 16px', width: '100%', maxWidth: '92%', fontSize: '14px', lineHeight: '1.6', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', color: '#1e293b', border: '1px solid #f1f5f9' },
    userBubble: { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 16px', borderRadius: '16px 0 16px 16px', alignSelf: 'flex-end', maxWidth: '85%', fontSize: '14px', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' },
    menuWrapper: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', width: '100%' },
    menuItem: { padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#ffffff', fontWeight: '600', fontSize: '13px', color: '#0f172a', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },
    menuMainLinkItem: { padding: '8px 16px', border: '1px solid #3b82f6', borderRadius: '20px', cursor: 'pointer', backgroundColor: '#eff6ff', fontWeight: 'bold', fontSize: '12px', color: '#1d4ed8', textAlign: 'center', display: 'inline-block', marginTop: '6px' },
    footer: { padding: '14px 16px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' },
    input: { flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', backgroundColor: '#f8fafc', color: '#0f172a' },
    sendBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '50%', width: '42px', height: '42px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)', transition: '0.2s' }
};

export default XeroxChatbot;