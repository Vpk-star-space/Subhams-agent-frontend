import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Configure Editor Toolbar Controls
const modules = {
    toolbar: [
       [{ 'font': ['arial', 'times', 'courier', 'georgia', 'garamond', 'verdana', 'impact', 'comic', 'trebuchet', 'black', 'tahoma', 'lucida', 'century', 'geneva', 'palatino', 'bookman'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['clean']
    ]
};

const formats = ['font', 'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'list', 'bullet', 'align'];

export default function AIDocWriter() {
    const navigate = useNavigate();
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('English');
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(false);

    // AI Document Writer Data Handler
    const generateDoc = async () => {
        if (!topic) return alert('Please enter a topic!');
        setLoading(true);
        
        try {
            const res = await secureAxios.post('/ai/generate', { topic, language, style: 'Official Document' });
            
            // Runs the 3-second icon animation step safely
            setTimeout(() => {
                setHtml(res.data.html || '');
                setLoading(false);
            }, 3000);

        } catch (error) {
            console.error(error);
            alert('Error generating document');
            setLoading(false);
        }
    };
     return (
        <div style={{ padding: '40px 20px', maxWidth: '900px', margin: 'auto', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <style>

                
                {`

                /* UI ELEMENTS AND CONTAINER STYLES */
                h2 {
                    font-weight: 700;
                    color: #0f172a;
                    letter-spacing: -0.5px;
                    margin-bottom: 20px;
                }

                .input-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #475569;
                    margin-bottom: 6px;
                    display: block;
                }

                .custom-select, .custom-textarea {
                    font-family: Arial, Helvetica, sans-serif;
                    border: 1px solid #cbd5e1;
                    border-radius: 10px;
                    padding: 12px;
                    background-color: #f8fafc;
                    transition: all 0.2s ease;
                    color: #1e293b;
                }

                .custom-select:focus, .custom-textarea:focus {
                    outline: none;
                    border-color: #6366f1;
                    background-color: #ffffff;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }

                /* PREMIUM SPARKLE GENERATE BUTTON */
                .btn-generate {
                    font-family: Arial, Helvetica, sans-serif;
                    font-weight: 600;
                    font-size: 15px;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    padding: 14px 28px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
                }

                .btn-generate:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
                    background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
                }

                .btn-generate:disabled {
                    background: #94a3b8;
                    box-shadow: none;
                    cursor: not-allowed;
                }

                /* CONTINUOUS STAR ICON SPINNING ANIMATION */
                .star-spin {
                    animation: spinAndPulse 1.2s infinite linear;
                    display: inline-block;
                    font-size: 18px;
                }

                @keyframes spinAndPulse {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.3); }
                    100% { transform: rotate(360deg) scale(1); }
                }

                /* BACK BUTTON */
                .btn-back {
                    font-family: Arial, Helvetica, sans-serif;
                    font-weight: 500;
                    background: #ffffff;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-back:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }

                /* PRINT BUTTON */
                .btn-print {
                    font-family: Arial, Helvetica, sans-serif;
                    font-weight: 600;
                    font-size: 15px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    padding: 14px;
                    width: 100%;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
                }

                .btn-print:hover {
                    background: #059669;
                    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
                }

                /* EDITOR PREVIEW WITH EXPLICIT DECLARED GLOBAL FONTS */
                .a4-quill-wrapper { 
                    background: #f8fafc; 
                    padding: 30px; 
                    border-radius: 14px;
                    border: 1px solid #e2e8f0;
                }
                .a4-quill-wrapper .ql-editor { 
                    width: 210mm; min-height: 297mm; background: white; 
                    padding: 20mm; color: #000; margin: auto;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                    border-radius: 4px;
                }

/* --- 16 FONT DROP-DOWN LABELS (Fixes the invisible logo/name issue) --- */
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

                /* CRITICAL PRINTER ENGINE PROTECTION PARAMS */
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 20mm 15mm;
                    }
                    html, body, #root, div, section, main {
                        visibility: hidden !important;
                        background: none !important;
                        background-color: transparent !important;
                        box-shadow: none !important;
                        text-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                    }
                    /* Hide layouts but NEVER break images/logos inside the wrap */
                    .no-print, .ql-toolbar, button, textarea, select, h2 {
                        display: none !important;
                        visibility: hidden !important;
                        height: 0 !important;
                        opacity: 0 !important;
                    }
                    
                    /* Isolate editor and keep graphics/logos fully visible */
                    .a4-quill-wrapper, .a4-quill-wrapper *, .ql-container, .ql-editor, img, svg {
                        visibility: visible !important;
                        background: transparent !important;
                        box-shadow: none !important;
                        border: none !important;
                        opacity: 1 !important;
                    }
                    .a4-quill-wrapper {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                    }
                    .ql-container { border: none !important; box-shadow: none !important; }
                    .ql-editor {
                        width: 100% !important;
                        height: auto !important;
                        min-height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        color: #000000 !important;
                    }
                    /* Force browser engine to keep rendering logos, pictures and colors */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Lock in Sans-Serif stack for all printed elements */
                    .ql-editor, .ql-editor *, .ql-editor p, .ql-editor span, .ql-editor h1, .ql-editor h2 {
                        font-family: Arial, Helvetica, sans-serif !important;
                    }
                }
                `}
            </style>
              {/* MAIN NAVIGATION AND CONTROLS SECTION */}
            <div className="no-print">
                <button onClick={() => navigate(-1)} className="btn-back" style={{ marginBottom: '20px' }}>← Back</button>
                <h2>✨ Subhams Writer</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
                    <div>
                        <label className="input-label">Select Document Language</label>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="custom-select" style={{ width: '100%' }}>
                            <option value="English">English</option>
                            <option value="Telugu">Telugu</option>
                        </select>
                    </div>

                    <div>
                        <label className="input-label">Document Details / Prompt</label>
                        <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What document do you need?" className="custom-textarea" style={{ width: '100%', height: '90px', resize: 'vertical' }} />
                    </div>
                </div>

                <button onClick={generateDoc} disabled={loading} className="btn-generate">
                    <span className={loading ? "star-spin" : ""}>✨</span>
                    {loading ? 'Subhams Writer is thinking...' : 'Generate Document'}
                </button>
            </div>

            {/* RICH TEXT DOCUMENT GENERATOR PREVIEW */}
            {html && (
                <div className="a4-quill-wrapper" style={{ marginTop: '30px' }}>
                    <ReactQuill theme="snow" value={html} onChange={setHtml} modules={modules} formats={formats} />
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