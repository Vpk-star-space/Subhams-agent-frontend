import { useState } from 'react';
import ReactQuill from 'react-quill-new'; 
// 🟢 FIX 1: Import the CSS directly here to stop the massive black arrows!
import 'react-quill-new/dist/quill.snow.css'; 
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
                /* 🟢 FIX 2: Stop global CSS (like Tailwind) from making SVG icons massive */
                .ql-picker-label svg, .ql-icon-picker svg {
                    width: 18px !important;
                    height: 18px !important;
                    display: inline-block !important;
                }

                /* SCREEN STYLING (Looks like a desk) */
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

                /* 🟢 FIX 3: PERFECT PRINT STYLING */
                @media print {
                    /* Turn off browser URL, Date, and Page Numbers */
                    @page {
                        margin: 0 !important; 
                    }

                    /* Hide ALL dashboard elements completely */
                    body * {
                        visibility: hidden;
                    }

                    /* Detach the paper and force it to the absolute top-left of the screen.
                       This deletes the invisible gap caused by the dashboard header! */
                    .a4-quill-wrapper {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        z-index: 999999 !important;
                    }

                    /* Make the editor and its contents visible again */
                    .a4-quill-wrapper, .a4-quill-wrapper * {
                        visibility: visible !important;
                    }

                    /* Delete the toolbar from the print */
                    .ql-toolbar {
                        display: none !important;
                    }

                    /* Clean up the paper borders for printing */
                    .a4-quill-wrapper .ql-container {
                        border: none !important;
                        padding: 0 !important;
                    }

                    .a4-quill-wrapper .ql-editor {
                        box-shadow: none !important;
                        width: 100% !important;
                        min-height: auto !important;
                        padding: 20mm !important; /* Simulates the physical paper margin safely */
                        overflow: visible !important;
                    }
                }
                `}
            </style>

            {/* EVERYTHING IN THIS DIV HIDES DURING PRINTING */}
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