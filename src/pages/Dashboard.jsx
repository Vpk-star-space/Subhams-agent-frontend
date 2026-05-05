import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react'; 

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://subhams-vpk.onrender.com';
const socket = io(BACKEND_URL, { 
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5
});

export default function Dashboard() {
  const navigate = useNavigate();
  
  const auth = useMemo(() => ({
    shopId: localStorage.getItem('shopId') || '', 
    token: localStorage.getItem('accessToken') || '' 
  }), []);

  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null); 
  const [previewImage, setPreviewImage] = useState(null);
  
  // 🚨 Hardware Security State
  const [pendingHardware, setPendingHardware] = useState(null);

  const [pricing, setPricing] = useState({ bw: 2, color: 10, aadhaar: 30, passport: 20 });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempPricing, setTempPricing] = useState({ ...pricing });

  // 🌟 The Update Overlay State (Waiting for the server signal!)
  const [needsUpdate, setNeedsUpdate] = useState(false);

  // ✏️ MULTI-DRAW & ZOOM STATES
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawState, setDrawState] = useState({ isDrawing: false, startX: 0, startY: 0, currentRect: null });
  const [zoomLevel, setZoomLevel] = useState(1);

  const [printSettings, setPrintSettings] = useState({
    colorMode: 'bw',
    scale: 'fit',
    position: 'top-left',
    backJobId: null,
    securityMode: 'none', 
    securePurpose: '',
    secureDate: '',
    maskAadhaar: false,
    maskRectArray: [], 
    isBlindPreview: false 
  });
  
  const initialFetchDone = useRef(false);
  const isCheckingHardware = useRef(false);
  const uploadLink = `${window.location.origin}/u/${auth.shopId}`;

  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate('/');
  }, [navigate]);

  // 🟢 FIX 1: Dynamic secureAxios URL
  const secureAxios = useMemo(() => {
    return axios.create({
      baseURL: `${BACKEND_URL}/api`,
      headers: { Authorization: `Bearer ${auth.token}` }
    });
  }, [auth.token]);

  const fetchPricing = useCallback(async () => {
    try {
      const res = await secureAxios.get(`/shop/pricing/${auth.shopId}`);
      if (res.data.success) {
        setPricing(res.data.pricing);
        setTempPricing(res.data.pricing);
      }
    } catch (err) {
      console.error("Pricing fetch error:", err); 
    }
  }, [auth.shopId, secureAxios]);

  const savePricing = async () => {
    try {
      const res = await secureAxios.put(`/shop/pricing/${auth.shopId}`, { pricing: tempPricing });
      if (res.data.success) {
        setPricing(tempPricing);
        setIsSettingsOpen(false);
        alert("✅ Prices updated successfully!");
      }
    } catch (err) {
      console.error("Save pricing error:", err); 
      alert("❌ Failed to update prices.");
    }
  };

  const fetchQueue = useCallback(async () => {
    if (!auth.shopId || !auth.token) return;
    try {
      const response = await secureAxios.get(`/jobs/queue/${auth.shopId}`);
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      console.error("Queue fetch error:", err); 
    }
  }, [auth.shopId, auth.token, secureAxios, handleLogout]);

 // 🛡️ Fetches hardware status SAFELY
  const checkHardware = useCallback(async () => {
    // If we don't have auth, OR if a check is already running, STOP and do nothing.
    if (!auth.shopId || !auth.token || isCheckingHardware.current) return;
    
    isCheckingHardware.current = true; // Lock the door

    try {
      const res = await secureAxios.get(`/shop/hardware/status/${auth.shopId}`);
      if (res.data.success && res.data.pendingHardware) {
        setPendingHardware(res.data.pendingHardware);
      } else {
        setPendingHardware(null);
      }
    } catch (err) {
      console.error("Hardware check error:", err); 
    } finally {
      isCheckingHardware.current = false; // Unlock the door when finished or failed
    }
  }, [auth.shopId, auth.token, secureAxios]);

  
  
  // 🟢 FIX 3: Fast HTTP Preview instead of Laggy Sockets!
  useEffect(() => {
    if (activeJob && !isDrawingMode) {
   

      const delayTimer = setTimeout(async () => {
        try {
            // Ask for the file via HTTP Blob (super fast, no Base64 text limits!)
            const response = await secureAxios.post(`/preview-fast/${activeJob.jobId}`, { 
                overrides: { ...printSettings } 
            }, { responseType: 'blob' }); // Tell Axios we want a binary file
            
            const cleanBlobUrl = URL.createObjectURL(response.data) + '#toolbar=0';
            setPreviewImage(cleanBlobUrl);
        } catch (error) {
            console.error("Fast preview error:", error);
        }
      }, 600); // 600ms debounce saves CPU

      return () => clearTimeout(delayTimer); 
    }
  }, [activeJob, printSettings, isDrawingMode, secureAxios]);

// 🟢 FIX 2: Optimized Socket Connection (No Lag)
  useEffect(() => {
    if (!auth.token || !auth.shopId) {
      navigate('/login');
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
        console.log("🌐 Dashboard Connected to Socket. Joining Room:", auth.shopId);
        socket.emit('JOIN_SHOP', { shopId: auth.shopId });
    };

    socket.on('connect', handleConnect);
    if (socket.connected) handleConnect();

    if (!initialFetchDone.current) {
        fetchQueue();
        fetchPricing();
        checkHardware();
        initialFetchDone.current = true;
    }

    const securityInterval = setInterval(checkHardware, 5000);

    socket.on('NEW_JOB_RECEIVED', () => fetchQueue());
    
    socket.on('AGENT_NEEDS_UPDATE', () => {
        console.log("🚨 POPUP TRIGGERED: Agent needs update!");
        setNeedsUpdate(true);
    });
    
    return () => {
      socket.off('connect', handleConnect);
      // 👇 Notice handlePreview is completely gone from here!
      socket.off('NEW_JOB_RECEIVED');
      socket.off('AGENT_NEEDS_UPDATE');
      clearInterval(securityInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.shopId, auth.token, navigate]); // Clean dependency array

  const calculateJobPrice = (job, isForPreview = false) => {
    const settings = isForPreview ? printSettings : job.options;
    let rate = pricing.bw; 

    if (settings.scale === 'aadhaar' || settings.scale === 'pan') rate = pricing.aadhaar;
    else if (settings.scale === 'passport') rate = pricing.passport;
    else if (settings.colorMode === 'color') rate = pricing.color;

    const copies = settings.copies || 1;
    let total = rate * copies;
    
    return total;
  };

  const handleView = (job) => {
    let parsedMaskArray = [];
    if (job.options?.maskRect) {
        try {
            const rawMasks = Array.isArray(job.options.maskRect) ? job.options.maskRect : [job.options.maskRect];
            parsedMaskArray = rawMasks.map(m => typeof m === 'string' ? JSON.parse(m) : m).filter(m => m && m.width > 0);
        } catch(e) {
            console.error("Could not parse coordinates:", e);
        }
    }
    
    setPrintSettings({
      colorMode: job.options?.colorMode || 'bw',
      scale: job.options?.scale || 'fit',            
      position: job.options?.position || 'top-left', 
      backJobId: null,
      securityMode: job.options?.securityMode || 'none', 
      securePurpose: job.options?.securePurpose || '',
      secureDate: job.options?.secureDate || new Date().toLocaleDateString('en-GB'),
      maskAadhaar: job.options?.maskAadhaar === true || job.options?.maskAadhaar === 'true' || parsedMaskArray.length > 0,
      maskRectArray: parsedMaskArray,
      isBlindPreview: job.options?.isBlindPreview === true || job.options?.isBlindPreview === 'true'
    });
    
    setActiveJob(job);
    setPreviewImage(null); 
    setIsDrawingMode(false);
    setZoomLevel(1);

    // 🟢 BUG FIX: Tell the server that the shop owner just viewed the file!
    socket.emit('NOTIFY_VIEWED', { jobId: job.jobId });
  };

  const handlePrint = (jobId) => {
    socket.emit('MANUAL_PRINT', { 
        jobId, 
        fileIndex: 0,
        overrides: {
            ...printSettings,
            maskRect: printSettings.maskRectArray, 
            copies: activeJob?.options?.copies || 1
        } 
    });
    alert('Command Sent! / ప్రింట్ ఆర్డర్ పంపబడింది!');
    setPreviewImage(null);
    setActiveJob(null);
    setIsDrawingMode(false);
    setTimeout(fetchQueue, 2000); 
  };

  const handleDelete = async (jobId) => {
    if(!window.confirm("Delete this job? File will be securely wiped from the server.")) return;
    
    socket.emit('NOTIFY_DELETE', { jobId });

    try {
        await secureAxios.delete(`/jobs/${jobId}`);
        if(activeJob?.jobId === jobId) {
            setActiveJob(null);
            setPreviewImage(null);
            setIsDrawingMode(false);
        }
        fetchQueue();
    } catch (err) {
        console.error("Job delete error:", err); 
        alert("Failed to delete job.");
    }
  };

  const handleHardwareDecision = async (decision) => {
    try {
      const res = await secureAxios.post('/shop/hardware/decision', { shopId: auth.shopId, decision });
      if (res.data.success) {
        setPendingHardware(null);
        alert(decision === 'APPROVE' ? "✅ Hardware Approved!" : "❌ Hardware Rejected!");
      }
    } catch (err) {
      console.error("Hardware decision error:", err); 
      alert("Action failed.");
    }
  };

  const copyShopId = () => {
    navigator.clipboard.writeText(auth.shopId);
    alert(`Shop ID Copied: ${auth.shopId}`);
  };

  const downloadQR = () => {
    const svg = document.getElementById("shop-qr-code");
    if(!svg) return alert("QR Code not ready yet.");
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Subhams-QR-${auth.shopId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startDrawing = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (!clientX || !clientY) return;
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      setDrawState({ isDrawing: true, startX: x, startY: y, currentRect: { x, y, width: 0, height: 0 } });
      setPrintSettings({ ...printSettings, maskAadhaar: true });
      if(e.pointerId) e.currentTarget.setPointerCapture(e.pointerId);
  };

  const keepDrawing = (e) => {
      if (!drawState.isDrawing) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (!clientX || !clientY) return;
      const currentX = ((clientX - rect.left) / rect.width) * 100;
      const currentY = ((clientY - rect.top) / rect.height) * 100;
      const x = Math.max(0, Math.min(drawState.startX, currentX));
      const y = Math.max(0, Math.min(drawState.startY, currentY));
      const width = Math.min(100 - x, Math.abs(currentX - drawState.startX));
      const height = Math.min(100 - y, Math.abs(currentY - drawState.startY));
      setDrawState(prev => ({ ...prev, currentRect: { x, y, width, height } }));
  };

  const stopDrawing = (e) => {
      if (drawState.isDrawing && drawState.currentRect && drawState.currentRect.width > 2) {
          setPrintSettings(prev => ({
              ...prev,
              maskRectArray: [...prev.maskRectArray, drawState.currentRect]
          }));
      }
      setDrawState({ isDrawing: false, startX: 0, startY: 0, currentRect: null });
      if(e.pointerId) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const undoLastMask = () => {
      setPrintSettings(prev => {
          const newArray = [...prev.maskRectArray];
          newArray.pop();
          return { ...prev, maskRectArray: newArray };
      });
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

  const groupedJobs = useMemo(() => {
    return jobs.reduce((groups, job) => {
      const name = job.customerName || 'Guest Customer';
      if (!groups[name]) groups[name] = [];
      groups[name].push(job);
      return groups;
    }, {});
  }, [jobs]);

  if (!auth.shopId || !auth.token) return null;

  const isCardSize = ['aadhaar', 'pan', 'passport'].includes(printSettings.scale);
  const otherCustomerJobs = activeJob ? jobs.filter(j => j.customerName === activeJob.customerName && j.jobId !== activeJob.jobId) : [];
  const hasCustomerMask = activeJob && activeJob.options?.maskRect && printSettings.maskRectArray.length > 0;
  
  const isActivePdf = activeJob && activeJob.files[0]?.mimeType === 'application/pdf';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🌟 1. THE UPDATE OVERLAY 🌟 */}
      {needsUpdate && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🚀</div>
            <h2 style={{ color: '#0f172a', margin: '0 0 10px 0' }}>Update Required</h2>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5' }}>
              A newer, faster, and more secure version of the Windows Desktop Agent is available. You must install this update to continue printing.
            </p>
            
            <a 
              href="/Install-SubhamsAgent.exe" 
              download="Install-SubhamsAgent.exe"
              style={downloadBtnStyle}
              onClick={() => setNeedsUpdate(false)}
            >
              ⬇️ Download New Update
            </a>
            
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '15px' }}>
              Note: Just run the downloaded file! You do not need to uninstall the old one.
            </p>
          </div>
        </div>
      )}

      <nav style={{ background: '#0f172a', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: 0, color: '#facc15' }}>Subhams Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setIsSettingsOpen(true)} style={{...navBtn, background: '#475569'}}>⚙️ Set Rates</button>
          <button onClick={fetchQueue} style={navBtn}>🔄 Refresh Queue</button>
          <button onClick={handleLogout} style={{ ...navBtn, background: '#b91c1c' }}>🚪 Logout</button>
        </div>
      </nav>

      {isSettingsOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px'}}>Shop Price Settings</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', margin: '20px 0'}}>
              <div>
                <label style={controlLabel}>B&W Print Rate (₹)</label>
                <input type="number" value={tempPricing.bw} onChange={(e) => setTempPricing({...tempPricing, bw: e.target.value})} style={controlInput} />
              </div>
              <div>
                <label style={controlLabel}>Color Print Rate (₹)</label>
                <input type="number" value={tempPricing.color} onChange={(e) => setTempPricing({...tempPricing, color: e.target.value})} style={controlInput} />
              </div>
              <div>
                <label style={controlLabel}>Aadhaar/PAN Card Rate (₹)</label>
                <input type="number" value={tempPricing.aadhaar} onChange={(e) => setTempPricing({...tempPricing, aadhaar: e.target.value})} style={controlInput} />
              </div>
              <div>
                <label style={controlLabel}>Passport Photo Rate (₹)</label>
                <input type="number" value={tempPricing.passport} onChange={(e) => setTempPricing({...tempPricing, passport: e.target.value})} style={controlInput} />
              </div>
            </div>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button onClick={() => setIsSettingsOpen(false)} style={{...actionBtn, background: '#f1f5f9'}}>Cancel</button>
              <button onClick={savePricing} style={{...actionBtn, background: '#16a34a', color: 'white'}}>Save Prices</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* 🚨 THE NEW BIG HARDWARE SECURITY POPUP 🚨 */}
        {pendingHardware && (
          <div style={securityBannerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '30px' }}>🚨</span>
                  <div>
                      <h3 style={{ color: '#991b1b', margin: '0 0 5px 0' }}>SECURITY ALERT: Unrecognized Device Detected!</h3>
                      <p style={{ color: '#7f1d1d', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                          A new computer is attempting to connect to your Shop using your Agent Key.<br/>
                          <b>Device Fingerprint:</b> <code style={{background: '#fee2e2', padding: '2px 6px', borderRadius: '4px'}}>{pendingHardware}</code>
                      </p>
                  </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleHardwareDecision('REJECT')} style={rejectBtn}>
                      ❌ Reject & Block
                  </button>
                  <button onClick={() => handleHardwareDecision('APPROVE')} style={approveBtn}>
                      ✅ Approve New Device
                  </button>
              </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px', marginTop: '10px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px', textAlign: 'center' }}>Shop QR Code</h3>
              <div style={{ background: '#fff', padding: '15px', display: 'flex', justifyContent: 'center', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <QRCodeSVG id="shop-qr-code" value={uploadLink} size={180} />
              </div>
              <button onClick={downloadQR} style={downloadBtn}>📥 Download QR Code</button>
              <div style={{ marginTop: '20px', background: '#f1f5f9', padding: '12px', borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>YOUR SHOP ID</span>
                <span style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '18px', letterSpacing: '1px' }}>{auth.shopId}</span>
                <button onClick={copyShopId} style={copyIdBtn}>📋 Copy ID</button>
              </div>
            </div>

            <button onClick={() => navigate('/manage')} style={vaultBtn}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🔐</span>
              Security Vault (OTP)<br/>
              <span style={{ fontSize: '12px', fontWeight: 'normal', opacity: 0.8, marginTop: '4px', display: 'block' }}>Manage Agent Key</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            
            <div style={{...card, padding: '20px', maxHeight: '750px', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', position: 'sticky', top: 0, background: '#fff', paddingBottom: '10px', zIndex: 10 }}>Print Queue</h3>
              
              {Object.keys(groupedJobs).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>No pending jobs. Ready for customers!</div>
              ) : (
                Object.entries(groupedJobs).map(([customerName, customerJobs]) => {
                  const folderTotal = customerJobs.reduce((sum, job) => sum + calculateJobPrice(job), 0);
                  return (
                    <div key={customerName} style={{ marginBottom: '25px', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ background: '#e0e7ff', padding: '12px 20px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#3730a3', fontSize: '15px' }}>📁 {customerName}</span>
                        <span style={{ background: '#16a34a', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}>Bill: ₹{folderTotal}</span>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                        <tbody>
                          {customerJobs.map((job) => (
                            <tr key={job.jobId} style={{ borderBottom: '1px solid #f1f5f9', background: activeJob?.jobId === job.jobId ? '#f0fdf4' : 'transparent' }}>
                              <td style={{ padding: '15px' }}>
                                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px', marginBottom: '4px' }}>
                                  📄 {job.options?.fileName || `Job ${job.jobId.substring(0,6)}`}
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569', display: 'inline-block', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', border: '1px solid #e2e8f0' }}>
                                  {job.options?.copies}x • {job.options?.colorMode === 'color' ? '🎨 Color' : '⚫ B&W'} • ₹{calculateJobPrice(job)}
                                  {job.options?.securityMode === 'govt' && <span style={{ color: '#166534', marginLeft: '5px' }}>• 🏛️ Govt Attested</span>}
                                  {job.options?.securityMode === 'private' && <span style={{ color: '#ea580c', marginLeft: '5px' }}>• 🏢 Private Guard</span>}
                                  {(job.options?.isBlindPreview === true || job.options?.isBlindPreview === 'true') && <span style={{ color: '#991b1b', marginLeft: '5px' }}>• 🔒 Blind</span>}
                                </div>
                              </td>
                              <td style={{ padding: '15px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <button onClick={() => handleDelete(job.jobId)} style={{ ...actionBtn, background: '#fee2e2', color: '#b91c1c' }}>🗑️</button>
                                <button onClick={() => handleView(job)} style={{ ...actionBtn, background: activeJob?.jobId === job.jobId ? '#10b981' : '#f8fafc', color: activeJob?.jobId === job.jobId ? 'white' : '#0f172a', border: '1px solid #cbd5e1' }}>
                                   {activeJob?.jobId === job.jobId ? 'Viewing' : 'View'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })
              )}
            </div>

            <div style={{ ...card, background: '#f8fafc', border: '2px dashed #e2e8f0', display: 'flex', flexDirection: 'column', minHeight: '750px', padding: '15px' }}>
              {activeJob ? (
                <>
                   {printSettings.isBlindPreview && (
                      <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', border: '1px solid #f87171' }}>
                          <strong>🔒 Customer Requested Blind Preview</strong><br/>
                          <span style={{ fontSize: '12px' }}>Sensitive details have been deliberately blurred to protect privacy. Downloading or copying is blocked.</span>
                      </div>
                   )}

                   <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #cbd5e1', display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                        <div>
                           <label style={controlLabel}>Requested Copies</label>
                           <div style={{ ...controlInput, background: '#e2e8f0', color: '#475569', fontWeight: 'bold' }}>
                              {activeJob.options?.copies || 1}
                           </div>
                        </div>
                        <div>
                           <label style={controlLabel}>Color</label>
                           <select value={printSettings.colorMode} onChange={(e) => { setPreviewImage(null); setPrintSettings({...printSettings, colorMode: e.target.value}); }} style={controlInput}>
                              <option value="bw">B&W</option>
                              <option value="color">Color</option>
                           </select>
                        </div>
                        
                        {!isActivePdf && (
                          <div>
                             <label style={controlLabel}>Physical Print Size</label>
                             <select value={printSettings.scale} onChange={(e) => { setPreviewImage(null); setPrintSettings({...printSettings, scale: e.target.value, position: 'top-left', backJobId: null}); }} style={controlInput}>
                                <option value="fit">Fit to A4 (Full Page)</option>
                                <option value="aadhaar">Aadhaar Card (85x54mm)</option>
                                <option value="pan">PAN Card (86x54mm)</option>
                                <option value="passport">Passport Photo (35x45mm)</option>
                             </select>
                          </div>
                        )}
                      </div>

                      {isCardSize && !isActivePdf && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <label style={{...controlLabel, textAlign: 'center', marginBottom: '8px'}}>Placement on A4</label>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', background: 'white', padding: '5px', border: '2px solid #e2e8f0', borderRadius: '4px' }}>
                                {['top-left', 'top-center', 'top-right', 'mid-left', 'mid-center', 'mid-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                  <button
                                    key={pos}
                                    onClick={() => { setPreviewImage(null); setPrintSettings({...printSettings, position: pos}); }}
                                    title={`Place at ${pos}`}
                                    style={{
                                      width: '30px', height: '35px', borderRadius: '4px', 
                                      border: printSettings.position === pos ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                      background: printSettings.position === pos ? '#dbeafe' : '#f8fafc',
                                      cursor: 'pointer', transition: '0.2s'
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                            {otherCustomerJobs.length > 0 && (
                                <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                                    <label style={{...controlLabel, color: '#b45309'}}>➕ Attach Back Side</label>
                                    <select value={printSettings.backJobId || ''} onChange={(e) => { setPreviewImage(null); setPrintSettings({...printSettings, backJobId: e.target.value}); }} style={{...controlInput, borderColor: '#fcd34d'}}>
                                        <option value="">None (Single Sided)</option>
                                        {otherCustomerJobs.map(j => (
                                            <option key={j.jobId} value={j.jobId}>{j.options?.fileName || j.jobId}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                      )}

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '10px', height: '100%' }}>
                        
                        <div style={{ background: printSettings.securityMode !== 'none' ? '#f0fdf4' : '#fff', padding: '8px', borderRadius: '8px', border: printSettings.securityMode !== 'none' ? '2px solid #22c55e' : '1px solid #cbd5e1' }}>
                            <label style={{...controlLabel, color: printSettings.securityMode !== 'none' ? '#166534' : '#64748b'}}>🛡️ Security Mode</label>
                            <select 
                                value={printSettings.securityMode} 
                                onChange={(e) => { setPreviewImage(null); setPrintSettings({...printSettings, securityMode: e.target.value, secureDate: new Date().toLocaleDateString('en-GB')}); }} 
                                style={{...controlInput, padding: '4px'}}
                            >
                                <option value="none">Off (Standard Print)</option>
                                <option value="govt">🏛️ Govt/Bank (Attestation Box)</option>
                                <option value="private">🏢 Private Use (Heavy Watermark)</option>
                            </select>
                            
                            {printSettings.securityMode !== 'none' && (
                                <input 
                                    type="text" placeholder="Purpose (e.g., Bank/Hotel)" value={printSettings.securePurpose}
                                    onChange={(e) => setPrintSettings({...printSettings, securePurpose: e.target.value})} onBlur={() => setPreviewImage(null)} 
                                    style={{...controlInput, marginTop: '5px', padding: '4px 8px', border: '1px solid #86efac'}}
                                />
                            )}
                            
                            {printSettings.securityMode === 'private' && !isActivePdf && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                                    {hasCustomerMask ? (
                                        <div style={{ background: '#dcfce3', padding: '6px', borderRadius: '4px', border: '1px solid #86efac' }}>
                                            <span style={{fontSize: '11px', color: '#166534', fontWeight: 'bold'}}>✅ Customer Provided Mask</span>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => { setIsDrawingMode(!isDrawingMode); setPreviewImage(null); }} 
                                            style={{ fontSize: '11px', padding: '6px', background: isDrawingMode ? '#fee2e2' : '#fef3c7', border: isDrawingMode ? '1px solid #ef4444' : '1px solid #f59e0b', borderRadius: '4px', cursor: 'pointer', color: isDrawingMode ? '#991b1b' : '#b45309', fontWeight: 'bold', width: '100%' }}
                                        >
                                            {isDrawingMode ? '❌ Cancel Drawing' : '✏️ Draw Mask Manually'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ background: '#dcfce3', color: '#166534', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                            Current Bill: ₹{calculateJobPrice(activeJob, true)}
                        </div>
                        <button onClick={() => handlePrint(activeJob.jobId)} style={{...printBtn, width: '100%', padding: '15px'}}>🖨️ PRINT NOW</button>
                      </div>
                   </div>

                  {isDrawingMode && !isActivePdf ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: '2px dashed #94a3b8', borderRadius: '8px', padding: '20px' }}>
                          <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>👆 Use the buttons to zoom. Swipe to Draw Masks</h4>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', width: '100%', maxWidth: '400px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Zoom Level: {Math.round(zoomLevel * 100)}%</span>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                  <button type="button" onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.2))} style={zoomBtn}>➖</button>
                                  <button type="button" onClick={() => setZoomLevel(1)} style={zoomBtn}>Reset</button>
                                  <button type="button" onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))} style={zoomBtn}>➕</button>
                              </div>
                          </div>

                          <div 
                              style={{ 
                                  width: '100%', maxWidth: '400px', aspectRatio: '1 / 1.414', background: '#f8fafc', 
                                  borderRadius: '4px', position: 'relative', overflow: 'auto', boxSizing: 'border-box',
                                  padding: (printSettings.securityMode === 'govt' || printSettings.securityMode === 'private') ? '6px' : '0', 
                                  border: (printSettings.securityMode === 'govt' || printSettings.securityMode === 'private') ? '2px solid #0f172a' : '1px solid #cbd5e1'
                              }}
                          >
                              <div style={{ 
                                  height: (printSettings.securityMode === 'govt' || printSettings.securityMode === 'private') ? '75%' : '100%', 
                                  display: 'flex', padding: '4px', boxSizing: 'border-box', position: 'relative',
                                  justifyContent: getJustify(printSettings.position), alignItems: getAlign(printSettings.position),
                                  transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.1s' 
                              }}>
                                  
                                  <div 
                                      onPointerDown={startDrawing}
                                      onPointerMove={keepDrawing}
                                      onPointerUp={stopDrawing}
                                      onPointerCancel={stopDrawing}
                                      style={{ 
                                          ...getImgSize(printSettings.scale), position: 'relative', display: 'inline-block',
                                          touchAction: 'none', cursor: 'crosshair', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                      }}
                                  >
                                      <img 
                                        src={`${BACKEND_URL}/api/jobs/download/${activeJob.jobId}`} 
                                        alt="Original File" 
                                        style={{ 
                                            width: '100%', height: '100%', objectFit: 'fill', display: 'block', background: 'white',
                                            filter: `${printSettings.colorMode === 'bw' ? 'grayscale(100%) contrast(120%) ' : ''}${printSettings.isBlindPreview ? 'blur(4px)' : ''}`.trim() || 'none',
                                            transition: 'filter 0.3s ease'
                                        }} 
                                        draggable={false}
                                        onError={(e) => { e.target.style.display = 'none'; alert("Cannot draw mask on PDF files. Please use an image file."); setIsDrawingMode(false); }}
                                      />
                                      
                                      {printSettings.maskRectArray.map((rect, rectIndex) => (
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

                                      {printSettings.securityMode === 'private' && (
                                          <div style={getWatermarkStyle(printSettings.securePurpose ? `${printSettings.securePurpose.toUpperCase()} - ${new Date().toLocaleDateString('en-GB')}` : 'PRIVATE USE')}></div>
                                      )}
                                  </div>
                              </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                              <button 
                                  onClick={undoLastMask} 
                                  disabled={printSettings.maskRectArray.length === 0}
                                  style={{ padding: '12px 20px', background: printSettings.maskRectArray.length > 0 ? '#fee2e2' : '#f1f5f9', color: printSettings.maskRectArray.length > 0 ? '#991b1b' : '#94a3b8', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: printSettings.maskRectArray.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '14px' }}
                              >
                                  ↩️ Undo Last Mask
                              </button>
                              <button 
                                  onClick={() => { setIsDrawingMode(false); setPreviewImage(null); }} 
                                  style={{ padding: '12px 25px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                              >
                                  ✅ Save Masks & Generate PDF
                              </button>
                          </div>
                      </div>
                  ) : previewImage ? (
                    // 🛡️ THE INVISIBLE SHIELD: Blocks right clicking on the PDF Preview
                    <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ position: 'absolute', inset: 0, zIndex: 50, cursor: 'not-allowed' }} title="Secure Preview - Interaction Disabled"></div>
                        <iframe 
                          src={previewImage} 
                          style={{ 
                            width: '100%', 
                            flex: 1, 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px', 
                            background: 'white',
                            filter: `${printSettings.colorMode === 'bw' ? 'grayscale(100%) ' : ''}${printSettings.isBlindPreview ? 'blur(4px)' : ''}`.trim() || 'none',
                            transition: 'filter 0.3s ease'
                          }} 
                          title="Preview" 
                        />
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b', fontWeight: 'bold' }}>⚙️ Generating Accurate A4 Preview...</div>
                  )}
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <span style={{ fontSize: '48px', marginBottom: '10px' }}>📄</span>
                  <p style={{ textAlign: 'center' }}>Select a job to preview content <br/> కంటెంట్‌ను చూడటానికి 'View' క్లిక్ చేయండి</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- Styles ---
const navBtn = { padding: '8px 16px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: '#334155' };
const card = { background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' };
const approveBtn = { padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const rejectBtn = { padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const actionBtn = { padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', marginLeft: '5px' };
const downloadBtn = { width: '100%', padding: '10px', marginTop: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const copyIdBtn = { width: '100%', padding: '8px', background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const vaultBtn = { width: '100%', padding: '25px', background: '#0f172a', color: '#facc15', border: '2px solid #334155', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.4)' };
const controlLabel = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' };
const controlInput = { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc', boxSizing: 'border-box' };
const printBtn = { background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)', whiteSpace: 'nowrap' };
const zoomBtn = { padding: '4px 10px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };

// 🌟 Security Banner Style
const securityBannerStyle = {
    backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '12px',
    padding: '20px', marginBottom: '25px', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
};

// 🌟 Update Overlay Styles
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.85)', 
  backdropFilter: 'blur(5px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 9999 
};

const modalStyle = {
  backgroundColor: 'white', padding: '40px 30px', borderRadius: '16px',
  maxWidth: '400px', width: '90%', textAlign: 'center',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

const downloadBtnStyle = {
  backgroundColor: '#2563eb', color: 'white', padding: '14px 24px', 
  borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold',
  display: 'inline-block', width: '100%', boxSizing: 'border-box',
  fontSize: '16px', transition: 'background 0.2s'
};