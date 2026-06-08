import { useState } from 'react';
import ReactQuill from 'react-quill-new'; 
import api from '../api/api';

const secureAxios = api;

export default function AIDocWriter() {
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('English');
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(false);

    const generateDoc = async () => {
        if (!topic) {
            return alert('Please enter a topic!');
        }

        setLoading(true);

        try {
            const res = await secureAxios.post('/ai/generate', {
                topic,
                language: language,
                style: 'Official Document'
            });

            setHtml(res.data.html || '');

        } catch (error) {
            console.error(error);
            alert('Error generating document');
        }

        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
            
            <style>
                {`
                /* 🟢 SCREEN STYLING (Looks like a desk) */
                .a4-quill-wrapper .ql-container {
                    background: #f1f5f9;
                    border: 1px solid #cbd5e1;
                    border-radius: 0 0 8px 8px;
                    display: flex;
                    justify-content: center;
                    padding: 40px 0;
                }
                .a4-quill-wrapper .ql-toolbar {
                    background: white;
                    border-radius: 8px 8px 0 0;
                    border-color: #cbd5e1;
                }
                .a4-quill-wrapper .ql-editor {
                    width: 210mm;
                    min-height: 297mm;
                    background: white;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                    padding: 20mm;
                    font-family: Arial, sans-serif;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #000;
                }

                /* 🟢 BULLETPROOF PRINT STYLING */
                @media print {
                    /* 1. Force EVERYTHING on the entire screen to be invisible */
                    * {
                        visibility: hidden !important;
                    }

                    /* 2. Un-hide ONLY our text editor and the text inside it */
                    .ql-editor, .ql-editor * {
                        visibility: visible !important;
                    }

                    /* 3. Snap the editor to the absolute top-left corner of the page */
                    .ql-editor {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        
                        /* This fixes the "2 blank pages" bug */
                        height: auto !important; 
                        min-height: auto !important; 
                        
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        overflow: visible !important;
                    }

                    /* 4. Completely DESTROY the dashboard navigation and toolbars so they take up 0 space */
                    .ql-toolbar, 
                    .no-print, 
                    nav, 
                    header, 
                    footer {
                        display: none !important;
                        height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* 5. Let the physical printer handle the margins, not the code */
                    @page {
                        size: A4 portrait;
                        margin: 15mm; 
                    }
                }
                `}
            </style>

            <div className="no-print">
                <h2>✨ Subhams Writer</h2>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px', marginRight: '10px' }}>Select Language:</label>
                    <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                        <option value="English">English Only</option>
                        <option value="Telugu">Telugu Only</option>
                        <option value="English and Telugu (Bilingual)">Both (English & Telugu)</option>
                    </select>
                </div>

                <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What document do you need? (e.g. Leave letter for son's fever)"
                    style={{
                        width: '100%', height: '100px', marginBottom: '15px', padding: '12px',
                        borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', resize: 'vertical'
                    }}
                />

                <button
                    onClick={generateDoc}
                    disabled={loading}
                    style={{
                        padding: '12px 20px', background: '#2563eb', color: 'white', border: 'none',
                        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px'
                    }}
                >
                    {loading ? 'Generating...' : 'Generate Document'}
                </button>
            </div>

            {/* THE EDITOR: ONLY THIS WILL PRINT */}
            {html && (
                <div className="a4-quill-wrapper">
                    <ReactQuill 
                        theme="snow" 
                        value={html} 
                        onChange={setHtml} 
                    />
                </div>
            )}

            {/* PRINT BUTTON: ALSO HIDES DURING PRINTING */}
            {html && (
                <button
                    className="no-print"
                    onClick={() => window.print()}
                    style={{
                        marginTop: '20px', padding: '12px 20px', background: '#16a34a', color: 'white',
                        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%'
                    }}
                >
                    🖨️ Print Document
                </button>
            )}
        </div>
    );
}