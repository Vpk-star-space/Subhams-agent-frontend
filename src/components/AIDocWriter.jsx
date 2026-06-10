import { useState, useRef } from 'react';

import ReactQuill, { Quill } from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css'; 
import api from '../api/api';

const secureAxios = api;

// Register Strict Sans-Serif Safe Fonts
const Font = Quill.import('formats/font');
Font.whitelist = [
    'arial', 'times', 'courier', 'georgia', 'garamond', 'verdana', 
    'impact', 'comic', 'trebuchet', 'black', 'tahoma', 'lucida', 
    'century', 'geneva', 'palatino', 'bookman'
];
Quill.register(Font, true);

// Configure Editor Toolbar Controls & Enable History (Undo/Redo)
const modules = {
    toolbar: [
       [{ 'font': ['arial', 'times', 'courier', 'georgia', 'garamond', 'verdana', 'impact', 'comic', 'trebuchet', 'black', 'tahoma', 'lucida', 'century', 'geneva', 'palatino', 'bookman'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['clean']
    ],
    // 🟢 Enables memory so Undo/Redo works
    history: {
        delay: 200,
        maxStack: 500,
        userOnly: true
    }
};

const formats = ['font', 'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'list', 'align'];

export default function AIDocWriter() {

    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('English');
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(false);

    // Refs for scrolling and undo/redo
    const editorRef = useRef(null);
    const quillRef = useRef(null);

const generateDoc = async () => {
    if (!topic) return alert('Please enter a topic!');
    setLoading(true);
    setHtml(''); // Clear previous document immediately
    
    try {
        const res = await secureAxios.post('/ai/generate', { 
            topic, 
            language, 
            style: 'Official Document' 
        });

        // 🟢 1. INSTANT SECURITY CHECK (Red Box)
        if (res.data.type === 'SECURITY_ALERT') {
            setHtml(`
                <div style="border: 2px solid #ef4444; background: #fee2e2; padding: 20px; color: #991b1b; font-weight: bold; border-radius: 8px;">
                    🛑 SECURITY ALERT: ${res.data.message}
                </div>
            `);
            setLoading(false);
            return; // Stop execution here
        }
        
        // 🟢 2. INSTANT RATE LIMIT CHECK (Yellow Box)
        if (res.data.type === 'RATE_LIMIT') {
            setHtml(`
                <div style="border: 2px solid #f59e0b; background: #fef3c7; padding: 20px; color: #b45309; font-weight: bold; border-radius: 8px;">
                    ⏳ SERVER BUSY: ${res.data.message}
                </div>
            `);
            setLoading(false);
            return; // Stop execution here
        }

        // 🟢 3. SUCCESS PATH (Run the 3-second animation)
        setTimeout(() => {
            setHtml(res.data.html || '');
            setLoading(false);
            
            // Scroll down after the text appears
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);

        }, 3000);

    } catch (error) {
        console.error("AI Generation Failed:", error);
        
        // 🟢 4. ADVANCED ERROR CATCHING
        // If the server throws a 429 status code directly, catch it here
        if (error.response && error.response.status === 429) {
            setHtml(`
                <div style="border: 2px solid #f59e0b; background: #fef3c7; padding: 20px; color: #b45309; font-weight: bold; border-radius: 8px;">
                    ⏳ SERVER BUSY: ${error.response.data.message || 'Subhams Writer is currently busy processing too many requests. Please wait a moment and try again.'}
                </div>
            `);
        } else {
            // Standard crash alert
            const errorMsg = error.response?.data?.message || 'Error connecting to Subhams Server';
            alert('Subhams Writer Error: ' + errorMsg);
        }
        
        setLoading(false);
    }
};

    // 🟢 NEW: Custom Undo/Redo Handlers
    const handleUndo = () => {
        if (quillRef.current) quillRef.current.getEditor().history.undo();
    };

    const handleRedo = () => {
        if (quillRef.current) quillRef.current.getEditor().history.redo();
    };

    return (
        <div style={{ padding: '40px 20px', maxWidth: '900px', margin: 'auto', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <style>
                {`
                /* UI ELEMENTS AND CONTAINER STYLES */
                h2 { font-weight: 700; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 20px; }
                .input-label { font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 6px; display: block; }
                .custom-select, .custom-textarea { font-family: Arial, Helvetica, sans-serif; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background-color: #f8fafc; transition: all 0.2s ease; color: #1e293b; cursor: text; }
                .custom-select { cursor: pointer; }
                .custom-select:focus, .custom-textarea:focus { outline: none; border-color: #6366f1; background-color: #ffffff; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }

                /* PREMIUM SPARKLE GENERATE BUTTON */
                .btn-generate { font-family: Arial, Helvetica, sans-serif; font-weight: 600; font-size: 15px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; border: none; border-radius: 10px; padding: 14px 28px; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }
                .btn-generate:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4); background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%); }
                .btn-generate:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; }

                /* CONTINUOUS STAR ICON SPINNING ANIMATION */
                .star-spin { animation: spinAndPulse 1.2s infinite linear; display: inline-block; font-size: 18px; }
                @keyframes spinAndPulse { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.3); } 100% { transform: rotate(360deg) scale(1); } }

                /* BACK & PRINT BUTTONS */
                .btn-back { font-family: Arial, Helvetica, sans-serif; font-weight: 500; background: #ffffff; color: #475569; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; cursor: pointer !important; transition: all 0.2s ease; }
                .btn-back:hover { background: #f1f5f9; color: #0f172a; }
                .btn-print { font-family: Arial, Helvetica, sans-serif; font-weight: 600; font-size: 15px; background: #10b981; color: white; border: none; border-radius: 10px; padding: 14px; width: 100%; cursor: pointer !important; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
                .btn-print:hover { background: #059669; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35); }

                /* EDITOR PREVIEW WITH EXPLICIT DECLARED GLOBAL FONTS */
                .a4-quill-wrapper { background: #f8fafc; padding: 30px; border-radius: 14px; border: 1px solid #e2e8f0; pointer-events: auto !important; }

                /* --- 16 FONT DROP-DOWN LABELS --- */
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="arial"]::before { content: "Arial" !important; font-family: Arial !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="times"]::before { content: "Times New Roman" !important; font-family: 'Times New Roman' !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="courier"]::before { content: "Courier" !important; font-family: 'Courier New' !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="georgia"]::before { content: "Georgia" !important; font-family: Georgia !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="garamond"]::before { content: "Garamond" !important; font-family: Garamond !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="verdana"]::before { content: "Verdana" !important; font-family: Verdana !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="impact"]::before { content: "Impact" !important; font-family: Impact !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="comic"]::before { content: "Comic Sans" !important; font-family: 'Comic Sans MS' !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="trebuchet"]::before { content: "Trebuchet" !important; font-family: 'Trebuchet MS' !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="black"]::before { content: "Arial Black" !important; font-family: 'Arial Black' !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="tahoma"]::before { content: "Tahoma" !important; font-family: Tahoma !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="lucida"]::before { content: "Lucida Sans" !important; font-family: 'Lucida Sans Unicode' !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="century"]::before { content: "Century Gothic" !important; font-family: 'Century Gothic' !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="geneva"]::before { content: "Geneva" !important; font-family: Geneva !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="palatino"]::before { content: "Palatino" !important; font-family: 'Palatino Linotype' !important; }
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="bookman"]::before { content: "Bookman" !important; font-family: 'Bookman Old Style' !important; }

                /* --- EDITOR FONT CLASS MAPPINGS --- */
                .ql-font-arial { font-family: Arial !important; }
                .ql-font-times { font-family: 'Times New Roman' !important; }
                .ql-font-courier { font-family: 'Courier New' !important; }
                .ql-font-georgia { font-family: Georgia !important; }
                .ql-font-garamond { font-family: Garamond !important; }
                .ql-font-verdana { font-family: Verdana !important; }
                .ql-font-impact { font-family: Impact !important; }
                .ql-font-comic { font-family: 'Comic Sans MS' !important; }
                .ql-font-trebuchet { font-family: 'Trebuchet MS' !important; }
                .ql-font-black { font-family: 'Arial Black' !important; }
                .ql-font-tahoma { font-family: Tahoma !important; }
                .ql-font-lucida { font-family: 'Lucida Sans Unicode' !important; }
                .ql-font-century { font-family: 'Century Gothic' !important; }
                .ql-font-geneva { font-family: Geneva !important; }
                .ql-font-palatino { font-family: 'Palatino Linotype' !important; }
                .ql-font-bookman { font-family: 'Bookman Old Style' !important; }

                /* 🟢 ULTIMATE FIX: Elegant, normal-sized 16x16 Black I-Beam Cursor */
                .a4-quill-wrapper,
                .a4-quill-wrapper *,
                .a4-quill-wrapper .ql-container.ql-snow .ql-editor,
                .a4-quill-wrapper .ql-container.ql-snow .ql-editor * {
                    cursor: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDR2MTZtLTQtMTZoOG0tOCAxNmg4Ii8+PC9zdmc+') 8 8, text !important;
                }

                .a4-quill-wrapper .ql-container.ql-snow .ql-editor { 
                    width: 210mm; 
                    min-height: 297mm; 
                    background: #ffffff !important; 
                    padding: 20mm; 
                    color: #000 !important; 
                    margin: auto;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                    border-radius: 4px;
                    color-scheme: light !important; 
                    caret-color: #000 !important; 
                }

                /* CRITICAL PRINTER ENGINE PROTECTION PARAMS */
                @media print {
                    @page { size: A4 portrait; margin: 20mm 15mm; }
                    html, body, #root, div, section, main { visibility: hidden !important; background: none !important; background-color: transparent !important; box-shadow: none !important; text-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
                    .no-print, .ql-toolbar, button, textarea, select, h2 { display: none !important; visibility: hidden !important; height: 0 !important; opacity: 0 !important; }
                    .a4-quill-wrapper, .a4-quill-wrapper *, .ql-container, .ql-editor, img, svg { visibility: visible !important; background: transparent !important; box-shadow: none !important; border: none !important; opacity: 1 !important; }
                    .a4-quill-wrapper { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .ql-editor { font-family: Arial, Helvetica, sans-serif; }
                }
                                        /* AI VERIFICATION NOTICE */
.ai-warning-box {
    background: #fff8e1;
    border-left: 4px solid #ffc107;
    padding: 12px;
    margin: 20px 0;
    font-family: Arial, sans-serif;
    font-size: 13px;
    color: #856404;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.ai-warning-box strong { color: #664d03; }



                `}
            </style>

            <div className="no-print">
<button 
    onClick={() => {
        // This forces the browser to physically reload the dashboard, clearing the writer!
        window.location.href = '/dashboard'; 
    }} 
    className="btn-back" 
    style={{ marginBottom: '20px' }}
>
    ⬅️ Back to Dashboard
</button>

 <h2>✨ Subhams Writer</h2>
<div className="ai-warning-box" style={{ backgroundColor: '#fefaf0', border: '1px solid #fbbf24', padding: '16px', borderRadius: '8px', marginBottom: '20px', color: '#92400e' }}>
    <strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
        ⚠️ Subhams Writer - Official Security & Privacy Notice
    </strong>
    <ul style={{ marginTop: '0', marginBottom: '0', paddingLeft: '24px', lineHeight: '1.6' }}>
        <li>
            <strong>Maximum Privacy (Powered by Groq):</strong> We exclusively use Groq’s enterprise-grade AI infrastructure to guarantee your privacy. Subhams Writer operates under strict <strong>zero-retention rules</strong>. We do not track, save, or use your prompt data to train AI models. 
        </li>
        <li>
            <strong>High-Speed Infrastructure:</strong> Designed specifically for fast, professional service, our advanced tech stack delivers lightning-fast document generation without compromising quality.
        </li>
        <li>
            <strong>Human Verification:</strong> While our AI generates highly accurate drafts, you are strictly responsible for reviewing the accuracy, context, and legality of the final content.
        </li>
        <li>
            <strong>Mandatory Action:</strong> To protect sensitive data (like Aadhaar/PAN), you <strong>must</strong> manually type real details into the secure placeholders highlighted in <span style={{ color: 'red', fontWeight: 'bold' }}>red</span> before final printing.
        </li>
    </ul>
</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
                    <div>
                        <label className="input-label">Select Document Language</label>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="custom-select" style={{ width: '100%' }}>
                            <option value="English">English</option>
                            <option value="Telugu">Telugu</option>
                               <option value="English & Telugu Mix">English & Telugu (Bilingual)</option>
                        </select>
                    </div>

                <div>
                        <label className="input-label">Document Details / Prompt</label>
                        <textarea 
                            value={topic} 
                            onChange={(e) => {
                                setTopic(e.target.value);
                                // 🟢 THE FIX: Magic Auto-Expand Logic
                                e.target.style.height = '90px'; // Resets height briefly
                                e.target.style.height = e.target.scrollHeight + 'px'; // Grows to fit new text
                            }} 
                            placeholder="What document do you need?" 
                            className="custom-textarea" 
                            style={{ 
                                width: '100%', 
                                minHeight: '90px',     /* Forces it to start at 90px */
                                resize: 'none',        /* Hides the clunky manual drag handle */
                                overflow: 'hidden',    /* Hides the ugly inner scrollbar */
                                boxSizing: 'border-box'/* Keeps it from breaking your layout */
                            }} 
                        />
                    </div>
                </div>

                <button onClick={generateDoc} disabled={loading} className="btn-generate">
                    <span className={loading ? "star-spin" : ""}>✨</span>
                    {loading ? 'Subhams Writer is thinking...' : 'Generate Document'}
                </button>
            </div>

            {/* RICH TEXT DOCUMENT GENERATOR PREVIEW */}
            {html && (
                <div className="a4-quill-wrapper" style={{ marginTop: '30px' }} ref={editorRef}>
                    
                    {/* 🟢 NEW: UNDO & REDO BUTTONS */}
                    <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'flex-start' }}>
                        <button onClick={handleUndo} style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#334155', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            ↩️ Undo
                        </button>
                        <button onClick={handleRedo} style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#334155', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            ↪️ Redo
                        </button>
                    </div>

                    <ReactQuill 
                        ref={quillRef}
                        theme="snow" 
                        value={html} 
                        onChange={setHtml} 
                        modules={modules} 
                        formats={formats} 
                    />
                </div>
            )}

            {/* ACTION PRINTING METHOD */}
            {html && (
                <div style={{ marginTop: '25px' }}>
                    <button className="btn-print no-print" onClick={() => window.print()}>
                        🖨️ Print Clean Document
                    </button>
                </div>
            )}
        </div>
    );
}