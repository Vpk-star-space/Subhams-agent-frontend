import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { io } from 'socket.io-client'; 

// 🟢 FIX: Added polling fallback to prevent 1006 errors
const socket = io('https://subhams-vpk.onrender.com', {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5
});

const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const getOrCreateUserCode = () => {
    let code = localStorage.getItem('subhams_userCode');
    if (!code) {
        code = Math.floor(100 + Math.random() * 900); 
        localStorage.setItem('subhams_userCode', code);
    }
    return code;
};

export default function CustomerUpload() {
  const { shopId: urlShopId } = useParams(); 
  
  const [userCode] = useState(getOrCreateUserCode);
  const [shopId, setShopId] = useState(urlShopId || localStorage.getItem('subhams_shopId') || '');
  const [customerName, setCustomerName] = useState(localStorage.getItem('subhams_customerName') || '');
  
  const uniqueCustomerName = customerName.trim() ? `${customerName.trim()} #${userCode}` : '';

  const [securityMode, setSecurityMode] = useState('none'); 
  const [securePurpose, setSecurePurpose] = useState('');
  const [maskAadhaar, setMaskAadhaar] = useState(false);
  const [isBlindPreview, setIsBlindPreview] = useState(false);
  
  const todayDate = new Date().toLocaleDateString('en-GB'); 

  const [drawState, setDrawState] = useState({ isDrawing: false, startX: 0, startY: 0, currentRect: null });
  const [isScanning, setIsScanning] = useState(false);
  const [fileItems, setFileItems] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [idMergeModal, setIdMergeModal] = useState({ open: false, front: null, back: null });
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const [liveStatusTracker, setLiveStatusTracker] = useState(() => {
    const saved = localStorage.getItem('subhams_tracker');
    return saved ? JSON.parse(saved) : {};
  });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('subhams_shopId', shopId);
    localStorage.setItem('subhams_customerName', customerName);
    localStorage.setItem('subhams_tracker', JSON.stringify(liveStatusTracker));
  }, [shopId, customerName, liveStatusTracker]);

  useEffect(() => {
    if (shopId.trim() && uniqueCustomerName) {
      socket.emit('JOIN_CUSTOMER', { shopId: shopId.toUpperCase(), customerName: uniqueCustomerName });
    }
  }, [shopId, uniqueCustomerName]);

  useEffect(() => {
    socket.on('CUSTOMER_TRACKER', (data) => {
      setLiveStatusTracker(prev => ({ ...prev, [data.jobId]: data }));
    });
    return () => socket.off('CUSTOMER_TRACKER');
  }, []);

  const handleFileChange = (e) => {
    const rawFiles = Array.from(e.target.files);
    const validItems = [];

    for (const f of rawFiles) {
        if (f.size > MAX_FILE_SIZE_BYTES) {
            alert(`❌ FILE TOO LARGE!\n\nYour file "${f.name}" is ${(f.size / 1024 / 1024).toFixed(1)}MB.\nThe maximum limit is 15MB. Please compress the file and try again.`);
            continue; 
        }
        
        const isImage = f.type.startsWith('image/');
        validItems.push({
            file: f,
            copies: 1,
            colorMode: 'bw',
            scale: 'fit',        
            position: 'top-left', 
            previewUrl: isImage ? URL.createObjectURL(f) : null,
            isPdf: !isImage,
            maskRectArray: [] 
        });
    }

    if (validItems.length === 0) return; 

    const combined = [...fileItems, ...validItems];
    if (combined.length > 5) {
      alert('Maximum 5 files allowed per order.');
      setFileItems(combined.slice(0, 5));
    } else {
      setFileItems(combined);
    }
    e.target.value = ''; 
  };

  const processIdMerge = async () => {
    const { front, back } = idMergeModal;
    if (!front || !back) return alert("Please select both Front and Back sides.");
    
    if (front.size > MAX_FILE_SIZE_BYTES || back.size > MAX_FILE_SIZE_BYTES) {
        return alert("❌ One of your ID photos is too large! Maximum limit is 15MB.");
    }

    setIsUploading(true);
    setStatus('⚙️ Optimizing and Merging ID...');

    try {
      const loadImage = (file) => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => { const img = new Image(); img.onload = () => resolve(img); img.src = e.target.result; };
          reader.readAsDataURL(file);
      });

      const img1 = await loadImage(front);
      const img2 = await loadImage(back);

      const cardWidth = 800; const cardHeight = 500; const gap = 30;
      const canvas = document.createElement('canvas');
      canvas.width = cardWidth; canvas.height = (cardHeight * 2) + gap;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawCover = (img, yPos) => {
          const imgRatio = img.width / img.height; const targetRatio = cardWidth / cardHeight;
          let sw = img.width, sh = img.height, sx = 0, sy = 0;
          if (imgRatio > targetRatio) { sw = img.height * targetRatio; sx = (img.width - sw) / 2; } 
          else { sh = img.width / targetRatio; sy = (img.height - sh) / 2; }
          ctx.drawImage(img, sx, sy, sw, sh, 0, yPos, cardWidth, cardHeight);
      };

      drawCover(img1, 0); drawCover(img2, cardHeight + gap);

      canvas.toBlob((blob) => {
          const mergedFile = new File([blob], `Smart_Merged_ID_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setFileItems([...fileItems, { file: mergedFile, copies: 1, colorMode: 'color', scale: 'fit', position: 'top-left', previewUrl: URL.createObjectURL(mergedFile), isPdf: false, maskRectArray: [] }]);
          setIdMergeModal({ open: false, front: null, back: null });
          setIsUploading(false); setStatus('');
      }, 'image/jpeg', 0.9);

    } catch (error) {
        console.error("Merge error:", error);
        setIsUploading(false); setStatus(''); alert("Failed to merge images. Please try again.");
    }
  };

  const removeFileItem = (indexToRemove) => {
    if (fileItems[indexToRemove].previewUrl) URL.revokeObjectURL(fileItems[indexToRemove].previewUrl);
    setFileItems(fileItems.filter((_, index) => index !== indexToRemove));
    if (activePreviewIndex === indexToRemove) setActivePreviewIndex(null);
  };

  const updateItemSetting = (index, field, value) => {
      const updated = [...fileItems];
      updated[index][field] = value;
      if (field === 'scale' && value === 'fit') updated[index].position = 'top-left';
      setFileItems(updated);
  };

  const startDrawing = (e, index) => {
      if (securityMode !== 'private' || !maskAadhaar || fileItems[index].isPdf) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      
      if (!clientX || !clientY) return;

      const x = (clientX - rect.left) / rect.width * 100;
      const y = (clientY - rect.top) / rect.height * 100;
      
      setDrawState({ isDrawing: true, startX: x, startY: y, currentRect: { x, y, width: 0, height: 0 } });
      if(e.pointerId) e.currentTarget.setPointerCapture(e.pointerId);
  };

  const keepDrawing = (e) => {
      if (!drawState.isDrawing) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      
      if (!clientX || !clientY) return;

      const currentX = (clientX - rect.left) / rect.width * 100;
      const currentY = (clientY - rect.top) / rect.height * 100;

      const x = Math.max(0, Math.min(drawState.startX, currentX));
      const y = Math.max(0, Math.min(drawState.startY, currentY));
      const width = Math.min(100 - x, Math.abs(currentX - drawState.startX));
      const height = Math.min(100 - y, Math.abs(currentY - drawState.startY));

      setDrawState(prev => ({ ...prev, currentRect: { x, y, width, height } }));
  };

  const stopDrawing = (e, index) => {
      if (drawState.isDrawing && drawState.currentRect && drawState.currentRect.width > 2) {
          const updatedFileItems = [...fileItems];
          updatedFileItems[index].maskRectArray.push(drawState.currentRect);
          setFileItems(updatedFileItems);
      }
      setDrawState({ isDrawing: false, startX: 0, startY: 0, currentRect: null });
      if(e.pointerId) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const undoLastMask = (index) => {
      const updatedFileItems = [...fileItems];
      updatedFileItems[index].maskRectArray.pop();
      setFileItems(updatedFileItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopId) return alert("Please enter a Shop ID.");
    if (!customerName.trim()) return alert("Please enter your name.");
    if (fileItems.length === 0) return alert("Please add at least one file.");

    if (securityMode !== 'none' && !securePurpose.trim()) {
        return alert("Please enter the purpose of the document to generate the security stamp.");
    }

    setIsUploading(true);
    setStatus('📤 Sending files to Printer...');
    setActivePreviewIndex(null); 
    
    try {
      for (const item of fileItems) {
          const formData = new FormData();
          formData.append('shopId', shopId); 
          formData.append('customerName', uniqueCustomerName); 
          formData.append('copies', item.copies); 
          formData.append('colorMode', item.colorMode);
          formData.append('fileName', item.file.name); 
          formData.append('scale', item.scale);
          formData.append('position', item.position);
          
          formData.append('securityMode', securityMode);
          formData.append('isBlindPreview', isBlindPreview); 
          
          if (securityMode !== 'none') {
              formData.append('securePurpose', securePurpose.trim());
              formData.append('secureDate', todayDate);
              formData.append('maskAadhaar', maskAadhaar);
              
              if (maskAadhaar && item.maskRectArray.length > 0 && !item.isPdf) {
                  item.maskRectArray.forEach(rect => {
                      formData.append('maskRect', JSON.stringify(rect));
                  });
              }
          }

          formData.append('documents', item.file);
          const res = await axios.post('https://subhams-vpk.onrender.com/api/jobs/upload', formData);
          
          setLiveStatusTracker(prev => ({
            ...prev, [res.data.jobId]: { jobId: res.data.jobId, fileName: item.file.name, status: 'SECURED', msg: 'File securely added to queue.' }
          }));
      }
      
      setStatus(`✅ Success! Files sent to the queue.`);
      setFileItems([]); setSecurityMode('none'); setSecurePurpose(''); setMaskAadhaar(false); setIsBlindPreview(false);
      
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 500);

    } catch (err) {
      setStatus(`❌ Error: ${err.response?.data?.message || 'Failed to send files.'}`);
    } finally {
      setIsUploading(false); setTimeout(() => setStatus(''), 5000); 
    }
  };

  const handleRevoke = (jobId) => {
    if(window.confirm("Are you sure? This will instantly wipe the file from the shop's screen and memory.")) {
        socket.emit('CUSTOMER_REVOKE', { jobId });
    }
  };

  const clearHistory = () => {
    if(window.confirm("Clear tracking history?")) {
      setLiveStatusTracker({});
    }
  };

  const getJustify = (pos) => pos.includes('left') ? 'flex-start' : pos.includes('right') ? 'flex-end' : 'center';
  const getAlign = (pos) => pos.includes('top') ? 'flex-start' : pos.includes('bottom') ? 'flex-end' : 'center';
  
  const getImgSize = (scale) => {
      if (scale === 'fit') return { width: '100%', height: '100%' };
      if (scale === 'aadhaar') return { width: '85%', aspectRatio: '241 / 153' };
      if (scale === 'pan') return { width: '85%', aspectRatio: '244 / 153' };
      if (scale === 'passport') return { height: '35%', aspectRatio: '99 / 128' };
      return { width: '100%', height: '100%' };
  };

  const getWatermarkStyle = (text) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="10" y="50" transform="rotate(-20 50 50)" font-family="Arial" font-size="12" font-weight="bold" fill="rgba(0,0,0,0.15)">${text}</text></svg>`;
    return {
        backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`,
        backgroundRepeat: 'repeat',
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10
    };
  };

  const activeOrders = Object.values(liveStatusTracker);
  const getStepNumber = (status) => status === 'SECURED' ? 1 : status === 'PREVIEWING' ? 2 : status === 'PRINTING' ? 3 : status === 'WIPED' ? 4 : 1;

  if (!shopId && !isScanning) {
    return (
      <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', padding: '40px 20px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <div style={{ fontSize: '60px', marginBottom: '15px' }}>🖨️</div>
          <h2 style={{ color: '#1e293b', margin: '0 0 10px 0', fontSize: '22px' }}>Subhams Print Portal</h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' }}>
            To securely upload and print documents, please scan the QR Code on the shop counter.
          </p>
          
          <button onClick={() => setIsScanning(true)} style={{...uploadBtnStyle, width: '100%', padding: '18px', background: '#2563eb', color: 'white', border: 'none', fontSize: '16px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'}}>
            📸 Scan Shop QR Now
          </button>
          
          <div style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px 0' }}>Are you a Shop Owner?</p>
            <a href="https://subhams-agent-vpk.vercel.app" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}>
              Register your Shop ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {idMergeModal.open && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{marginTop: 0, textAlign: 'center', color: '#1e293b'}}>🪪 Smart ID Merge</h3>
            <p style={{fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '20px'}}>Select the front and back of your ID.</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <button type="button" onClick={() => frontInputRef.current.click()} style={{...mergeBtnStyle, background: idMergeModal.front ? '#dcfce3' : '#f1f5f9', border: idMergeModal.front ? '2px solid #16a34a' : '2px dashed #cbd5e1'}}>
                {idMergeModal.front ? '✅ Front Selected' : '📸 1. Select Front Side'}
              </button>
              <input type="file" accept="image/*" ref={frontInputRef} onChange={(e) => setIdMergeModal({...idMergeModal, front: e.target.files[0]})} style={{ display: 'none' }} />
              <button type="button" onClick={() => backInputRef.current.click()} style={{...mergeBtnStyle, background: idMergeModal.back ? '#dcfce3' : '#f1f5f9', border: idMergeModal.back ? '2px solid #16a34a' : '2px dashed #cbd5e1'}}>
                {idMergeModal.back ? '✅ Back Selected' : '📸 2. Select Back Side'}
              </button>
              <input type="file" accept="image/*" ref={backInputRef} onChange={(e) => setIdMergeModal({...idMergeModal, back: e.target.files[0]})} style={{ display: 'none' }} />
            </div>
            <div style={{display: 'flex', gap: '10px', marginTop: '25px'}}>
              <button onClick={() => setIdMergeModal({open: false, front: null, back: null})} style={{...actionBtn, background: '#fee2e2', color: '#991b1b', flex: 1}}>Cancel</button>
              <button onClick={processIdMerge} disabled={!idMergeModal.front || !idMergeModal.back || isUploading} style={{...actionBtn, background: '#2563eb', color: 'white', flex: 2}}>Stitch & Add ✅</button>
            </div>
          </div>
        </div>
      )}

      <h2 style={{ textAlign: 'center', color: '#1e293b', margin: '0 0 5px 0' }}>Subhams Xerox</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Mobile Fast Print Portal</p>

      <div style={{...sectionCard, marginBottom: '15px'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{...labelStyle, marginBottom: 0}}>Your Name / మీ పేరు</label>
            {customerName && <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>ID: #{userCode}</span>}
        </div>
        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} placeholder="Enter your name" required />
      </div>

      <div style={{...sectionCard, marginBottom: '15px'}}>
        <label style={labelStyle}>Shop ID / షాప్ ID</label>
        {isScanning ? (
          <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px' }}>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>Loading Camera...</span>
            <div style={{ width: '100%', maxWidth: '280px', position: 'relative' }}>
              <div style={{ paddingTop: '100%', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid #3b82f6', background: '#000', minHeight: '280px' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                   {/* 🟢 FIX: Removed "formats" prop and made the receiver bulletproof! */}
                    <Scanner 
                        onScan={(result) => {
                            console.log("Raw Scan Result:", result); // Helps us debug if needed
                            
                            let text = '';
                            // Handle new version (Array)
                            if (Array.isArray(result) && result.length > 0) {
                                text = result[0].rawValue;
                            } 
                            // Handle older versions (String or Object)
                            else if (typeof result === 'string') {
                                text = result;
                            } else if (result && result.text) {
                                text = result.text;
                            }

                            if (text) {
                                const extractedId = text.includes('/u/') ? text.split('/u/').pop() : text;
                                setShopId(extractedId);
                                setIsScanning(false);
                            }
                        }}
                        onError={(error) => console.log("Scanner Error:", error)}
                        components={{ audio: false, finder: true }}
                    />
                  </div>
              </div>
            </div>
            <button onClick={() => setIsScanning(false)} style={{...cancelScanBtn, position: 'relative', left: 'auto', bottom: 'auto', transform: 'none', marginTop: '15px'}}>Cancel Scanner</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="e.g. SUBHAMS-123456" value={shopId} onChange={(e) => setShopId(e.target.value.toUpperCase())} style={{...inputStyle, flex: 1, fontWeight: 'bold', color: '#2563eb'}} />
            <button type="button" style={qrBtnStyle} onClick={() => setIsScanning(true)}>📷 Scan QR</button>
          </div>
        )}
      </div>

      <div style={{...sectionCard, background: securityMode !== 'none' ? '#f0fdf4' : '#fff', border: securityMode !== 'none' ? '2px solid #22c55e' : '1px solid #e2e8f0'}}>
        <h4 style={{ margin: '0 0 10px 0', color: '#166534', fontSize: '14px' }}>🛡️ Document Privacy Guard</h4>
        
        <div style={{ marginBottom: '15px', background: isBlindPreview ? '#fee2e2' : '#f8fafc', padding: '10px', borderRadius: '8px', border: isBlindPreview ? '1px solid #ef4444' : '1px solid #e2e8f0', transition: '0.3s' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: isBlindPreview ? '#991b1b' : '#334155' }}>
                <input type="checkbox" checked={isBlindPreview} onChange={(e) => setIsBlindPreview(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                👁️‍🗨️ Blind Preview (Hide document details from shopkeeper)
            </label>
            <p style={{fontSize: '11px', color: '#64748b', marginTop: '5px', margin: 0}}>Shopkeeper will only see a softly blurred outline to adjust position, ensuring absolute privacy without breaking alignment.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button type="button" onClick={() => setSecurityMode('none')} style={{...securityBtn, background: securityMode === 'none' ? '#334155' : '#f1f5f9', color: securityMode === 'none' ? 'white' : '#64748b'}}>
                Standard
            </button>
            <button type="button" onClick={() => setSecurityMode('govt')} style={{...securityBtn, background: securityMode === 'govt' ? '#2563eb' : '#f1f5f9', color: securityMode === 'govt' ? 'white' : '#64748b'}}>
                🏛️ Govt/Bank
            </button>
            <button type="button" onClick={() => setSecurityMode('private')} style={{...securityBtn, background: securityMode === 'private' ? '#ea580c' : '#f1f5f9', color: securityMode === 'private' ? 'white' : '#64748b'}}>
                🏢 Private Use
            </button>
        </div>

        {securityMode !== 'none' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <label style={{...labelStyle, color: securityMode === 'govt' ? '#1e40af' : '#c2410c'}}>
                        {securityMode === 'govt' ? 'Name of Bank/Govt (For Attestation Box)' : 'Purpose of ID (For Watermark & Attestation)'}
                    </label>
                    <input 
                        type="text" 
                        placeholder={securityMode === 'govt' ? "e.g., HDFC Bank, RTO Office" : "e.g., Hotel Check-in, Jio SIM"} 
                        value={securePurpose} 
                        onChange={(e) => setSecurePurpose(e.target.value)} 
                        style={{...inputStyle, border: `1px solid ${securityMode === 'govt' ? '#bfdbfe' : '#fed7aa'}`, background: '#fff'}} 
                    />
                </div>
                {securityMode === 'private' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#9a3412', background: '#ffedd5', padding: '10px', borderRadius: '8px' }}>
                        <input type="checkbox" checked={maskAadhaar} onChange={(e) => setMaskAadhaar(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                        👁️‍🗨️ Mask Sensitive data (ex: IDs etc, (swipe specific area))
                    </label>
                )}
            </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', paddingBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button type="button" onClick={() => fileInputRef.current.click()} style={uploadBtnStyle}><span style={{ fontSize: '24px' }}>📁</span><br/>Browse Files</button>
          <input type="file" multiple accept=".pdf,image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          <button type="button" onClick={() => cameraInputRef.current.click()} style={{...uploadBtnStyle, background: '#eff6ff', borderColor: '#bfdbfe'}}><span style={{ fontSize: '24px' }}>📸</span><br/>Take Photo</button>
          <input type="file" accept="image/*" capture="environment" multiple ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        </div>

        <button type="button" onClick={() => setIdMergeModal({open: true, front: null, back: null})} style={{...uploadBtnStyle, background: '#fef3c7', borderColor: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px'}}>
          <span style={{ fontSize: '28px' }}>🪪</span>
          <div style={{textAlign: 'left'}}>
            <span style={{fontWeight: 'bold', color: '#b45309', display: 'block', fontSize: '14px'}}>Smart ID Merge</span>
            <span style={{fontSize: '11px', color: '#92400e'}}>Combine Front & Back instantly</span>
          </div>
        </button>

        {fileItems.length > 0 && (
          <div style={sectionCard}>
            <h4 style={{ margin: '0 0 10px 0', color: '#334155', fontSize: '14px' }}>Your Selected Files ({fileItems.length}/5)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {fileItems.map((item, index) => (
                <div key={index} style={{ border: activePreviewIndex === index ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ background: activePreviewIndex === index ? '#eff6ff' : '#f8fafc', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, marginRight: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📄 {item.file.name}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{item.copies}x Copy • {item.colorMode === 'color' ? '🎨 Color' : '⚫ B&W'} • Size: {item.scale}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => setActivePreviewIndex(activePreviewIndex === index ? null : index)} style={{ background: activePreviewIndex === index ? '#2563eb' : '#fff', color: activePreviewIndex === index ? '#fff' : '#0f172a', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                            {activePreviewIndex === index ? 'Close ⬆️' : '⚙️ Adjust'}
                        </button>
                        <button type="button" onClick={() => removeFileItem(index)} style={removeBtnStyle}>❌</button>
                    </div>
                  </div>

                  {activePreviewIndex === index && (
                      <div style={{ background: '#fff', padding: '15px', borderTop: '1px solid #cbd5e1' }}>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              
                              <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', flexShrink: 0, overflow: 'hidden' }}>
                                  
                                  {item.isPdf ? (
                                      <div style={{ background: '#f8fafc', padding: '30px', textAlign: 'center', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                          <div style={{ fontSize: '48px', opacity: 0.5, marginBottom: '10px' }}>📄</div>
                                          <h4 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>PDF Document Selected</h4>
                                          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                              Multi-page PDF files will be printed exactly as they are. <br/> Masking and size adjustments are disabled for PDFs.
                                          </p>
                                      </div>
                                  ) : (
                                      <>
                                          <div style={{ 
                                              width: '100%', aspectRatio: '1 / 1.414', background: '#f8fafc', 
                                              borderRadius: '4px', position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
                                              padding: (securityMode === 'govt' || securityMode === 'private') ? '6px' : '0', 
                                              border: (securityMode === 'govt' || securityMode === 'private') ? '2px solid #0f172a' : '1px solid #cbd5e1'
                                          }}>
                                              <div style={{ 
                                                  height: (securityMode === 'govt' || securityMode === 'private') ? '75%' : '100%', 
                                                  display: 'flex', padding: '4px', boxSizing: 'border-box', position: 'relative',
                                                  justifyContent: getJustify(item.position), alignItems: getAlign(item.position)
                                              }}>
                                                  
                                                  <div 
                                                      onPointerDown={(e) => startDrawing(e, index)}
                                                      onPointerMove={keepDrawing}
                                                      onPointerUp={(e) => stopDrawing(e, index)}
                                                      onPointerCancel={(e) => stopDrawing(e, index)}
                                                      style={{ 
                                                          ...getImgSize(item.scale), position: 'relative', display: 'inline-block',
                                                          touchAction: 'none', 
                                                          cursor: (securityMode === 'private' && maskAadhaar) ? 'crosshair' : 'default'
                                                      }}
                                                  >
                                                      <img 
                                                        src={item.previewUrl} 
                                                        alt="Preview" 
                                                        style={{
                                                            width: '100%', height: '100%', objectFit: 'fill',
                                                            filter: `${item.colorMode === 'bw' ? 'grayscale(100%) contrast(120%) ' : ''}${isBlindPreview ? 'blur(4px) ' : ''}`.trim() || 'none',
                                                            transition: 'filter 0.3s ease'
                                                        }} 
                                                        draggable={false} 
                                                      />
                                                      
                                                      {item.maskRectArray.map((rect, rectIndex) => (
                                                          <div key={rectIndex} style={{
                                                              position: 'absolute',
                                                              left: `${rect.x}%`, top: `${rect.y}%`,
                                                              width: `${rect.width}%`, height: `${rect.height}%`,
                                                              backgroundColor: 'black', opacity: 0.95,
                                                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                          }}>
                                                              <span style={{color: 'white', fontSize: '6px', fontWeight: 'bold'}}>XXXX XXXX</span>
                                                          </div>
                                                      ))}

                                                      {drawState.isDrawing && drawState.currentRect && (
                                                           <div style={{
                                                              position: 'absolute',
                                                              left: `${drawState.currentRect.x}%`, top: `${drawState.currentRect.y}%`,
                                                              width: `${drawState.currentRect.width}%`, height: `${drawState.currentRect.height}%`,
                                                              backgroundColor: 'black', opacity: 0.5, border: '1px dashed yellow'
                                                          }}></div>
                                                      )}
                                                  </div>

                                                  {securityMode === 'private' && (
                                                      <div style={getWatermarkStyle(securePurpose ? `${securePurpose.toUpperCase()} - ${todayDate}` : 'PRIVATE USE')}></div>
                                                  )}
                                              </div>

                                              {(securityMode === 'govt' || securityMode === 'private') && (
                                                  <div style={{ height: '25%', borderTop: '1.5px solid #0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2px' }}>
                                                      <div style={{ fontSize: '4.5px', color: '#0f172a', lineHeight: '1.2' }}>
                                                          <strong>DECLARATION & ATTESTATION</strong><br/>
                                                          To: <span style={{color: '#2563eb', fontWeight: 'bold'}}>{securePurpose || '[Enter Purpose]'}</span><br/>
                                                          Date: <strong>{todayDate}</strong> &nbsp;&nbsp; Sign: ______
                                                      </div>
                                                      <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '8px', height: '8px', background: '#0f172a' }}></div>
                                                  </div>
                                              )}
                                          </div>
                                          
                                          {securityMode === 'private' && maskAadhaar && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                                  <p style={{fontSize: '11px', color: '#b45309', margin: 0, fontWeight: 'bold'}}>👆 Zoom using your phone. Swipe to draw multiple boxes.</p>
                                                  <button 
                                                      type="button" 
                                                      onClick={() => undoLastMask(index)} 
                                                      disabled={item.maskRectArray.length === 0}
                                                      style={{ fontSize: '11px', padding: '5px 10px', background: item.maskRectArray.length > 0 ? '#fee2e2' : '#f1f5f9', color: item.maskRectArray.length > 0 ? '#991b1b' : '#94a3b8', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: item.maskRectArray.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                                                  >
                                                      ↩️ Undo Mask
                                                  </button>
                                              </div>
                                          )}
                                      </>
                                  )}
                              </div>

                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={labelStyle}>Copies</label>
                                        <input type="number" min="1" value={item.copies} onChange={(e) => updateItemSetting(index, 'copies', e.target.value)} style={{...inputStyle, padding: '6px'}} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Color</label>
                                        <select value={item.colorMode} onChange={(e) => updateItemSetting(index, 'colorMode', e.target.value)} style={{...inputStyle, padding: '6px'}}>
                                            <option value="bw">B&W</option><option value="color">Color</option>
                                        </select>
                                    </div>
                                </div>

                                {!item.isPdf && (
                                    <>
                                        <div>
                                            <label style={labelStyle}>Print Size</label>
                                            <select value={item.scale} onChange={(e) => updateItemSetting(index, 'scale', e.target.value)} style={{...inputStyle, padding: '6px'}}>
                                                <option value="fit">Fit to A4 (Full Page)</option>
                                                <option value="aadhaar">Card Size (85x54mm)</option>
                                                <option value="pan">PAN Size (86x54mm)</option>
                                                <option value="passport">Passport Photo</option>
                                            </select>
                                        </div>
                                        {item.scale !== 'fit' && (
                                            <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <label style={{...labelStyle, textAlign: 'center', marginBottom: '8px'}}>Placement on Paper</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'white', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                                    {['top-left', 'top-center', 'top-right', 'mid-left', 'mid-center', 'mid-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => {
                                                        const icons = { 'top-left': '↖', 'top-center': '⬆', 'top-right': '↗', 'mid-left': '⬅', 'mid-center': '•', 'mid-right': '➡', 'bottom-left': '↙', 'bottom-center': '⬇', 'bottom-right': '↘' };
                                                        const isSelected = item.position === pos;
                                                        return (
                                                            <button key={pos} type="button" onClick={() => updateItemSetting(index, 'position', pos)} title={pos.replace('-', ' ').toUpperCase()}
                                                                style={{ height: '35px', borderRadius: '4px', border: isSelected ? '2px solid #1d4ed8' : '1px solid #e2e8f0', background: isSelected ? '#2563eb' : '#f8fafc', color: isSelected ? '#ffffff' : '#64748b', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'all 0.2s ease-in-out' }}>
                                                                {icons[pos]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                              </div>
                          </div>
                      </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={isUploading || fileItems.length === 0} style={submitBtn}>
          {isUploading ? 'Sending...' : 'Send to Printer / ప్రింట్ చేయండి'}
        </button>
      </form>

      {status && <div style={{ ...statusBox, background: status.includes('❌') ? '#fee2e2' : '#dcfce3', color: status.includes('❌') ? '#991b1b' : '#166534' }}>{status}</div>}

      {activeOrders.length > 0 && (
        <div style={trackerContainerStyle}>
          <div style={trackerHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🛡️ Live Order Tracking ({activeOrders.length})</span>
            </div>
            <button onClick={clearHistory} style={{background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline'}}>Clear All</button>
          </div>
          
          <div style={{ padding: '15px' }}>
            {activeOrders.map((order) => {
              const step = getStepNumber(order.status);
              const isCancelled = order.status === 'CANCELLED';
              const isWiped = order.status === 'WIPED' || isCancelled;

              return (
                <div key={order.jobId} style={orderCard}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📄 {order.fileName}</div>
                  {isCancelled ? ( <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>❌ {order.msg}</div> ) : (
                    <>
                      <div style={timelineContainer}>
                        <div style={stepStyle(step >= 1)}><div style={circleStyle(step >= 1)}>1</div><span style={stepLabel}>Secured</span></div><div style={lineStyle(step >= 2)} />
                        <div style={stepStyle(step >= 2)}><div style={circleStyle(step >= 2)}>2</div><span style={stepLabel}>Viewed</span></div><div style={lineStyle(step >= 3)} />
                        <div style={stepStyle(step >= 3)}><div style={circleStyle(step >= 3)}>3</div><span style={stepLabel}>Printed</span></div><div style={lineStyle(step >= 4)} />
                        <div style={stepStyle(step >= 4)}><div style={circleStyle(step >= 4)}>4</div><span style={stepLabel}>Wiped</span></div>
                      </div>
                      <div style={statusMsg}>{order.msg || 'File secured in RAM by Subham Agent.'}</div>
                      {!isWiped && (
                        <button onClick={() => handleRevoke(order.jobId)} style={{ width: '100%', padding: '8px', background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', marginTop: '10px', cursor: 'pointer' }}>🛑 Revoke Access & Delete</button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const containerStyle = { maxWidth: '450px', margin: '0 auto', padding: '20px', fontFamily: "'Inter', sans-serif", background: '#f8fafc', minHeight: '100vh', position: 'relative' };
const sectionCard = { background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', background: '#f8fafc', boxSizing: 'border-box' };
const qrBtnStyle = { padding: '0 15px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' };
const cancelScanBtn = { position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', zIndex: 10 };
const uploadBtnStyle = { padding: '20px 10px', background: '#f1f5f9', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', color: '#475569', fontWeight: 'bold', fontSize: '13px' };
const removeBtnStyle = { background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const submitBtn = { width: '100%', padding: '18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' };
const statusBox = { marginTop: '20px', padding: '15px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' };
const securityBtn = { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: '0.2s' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContent = { background: 'white', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const mergeBtnStyle = { width: '100%', padding: '15px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: '#1e293b' };
const actionBtn = { padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };

const trackerContainerStyle = { marginTop: '30px', background: '#fff', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderRadius: '12px', overflow: 'hidden' };
const trackerHeader = { background: '#2563eb', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '15px' };
const orderCard = { background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const timelineContainer = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '15px 0' };
const stepStyle = (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: active ? 1 : 0.4, transition: 'opacity 0.3s' });
const circleStyle = (active) => ({ width: '24px', height: '24px', borderRadius: '50%', background: active ? '#16a34a' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', boxShadow: active ? '0 0 8px rgba(22, 163, 74, 0.4)' : 'none', transition: 'all 0.3s' });
const lineStyle = (active) => ({ flex: 1, height: '3px', background: active ? '#16a34a' : '#e2e8f0', margin: '0 8px', marginTop: '-18px', transition: 'background 0.3s' });
const stepLabel = { fontSize: '10px', marginTop: '6px', fontWeight: 'bold', color: '#334155' };
const statusMsg = { fontSize: '12px', color: '#475569', marginTop: '10px', fontStyle: 'italic', borderTop: '1px solid #e2e8f0', paddingTop: '8px', lineHeight: '1.4' };