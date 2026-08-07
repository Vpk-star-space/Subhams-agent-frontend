import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react'; 
import { useReactToPrint } from 'react-to-print';
import PrintPass from './PrintPass';
import AIDocWriter from '../components/AIDocWriter';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// 🟢 Correct Import path to your api folder
import api, { BASE_URL } from '../api/api'; 

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const socket = io(BASE_URL, { 
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

  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate('/');
  }, [navigate]);

  // 🟢 2. MASTER CONTROL PANEL 
const config = useMemo(() => ({
    showClock: true,              
    showAnnouncement: true,       
    enableScrolling: true,        
    scrollSpeed: "26s",           
message: "✨ Welcome to Subhams Networks | 🚀 We are happy to work with you today | ఈ రోజు మీతో కలిసి పని చేయడం మాకు ఆనందంగా ఉంది |  For more & information click ' ✨Ask Subhams' | 🙏 Thank You !" ,
    postTime: "NA"                
  }), []);
// 📅 Simplified to always show if config.showAnnouncement is true
  const shouldShowMessage = useMemo(() => {
    return config.showAnnouncement;
  }, [config.showAnnouncement]);

  const hasTopBar = config.showClock || shouldShowMessage;

  // 🟢 3. ALL STATES
  const [istTime, setIstTime] = useState("");
  const [greeting, setGreeting] = useState("Hello");

  // ... (Keep your existing useState declarations for jobs, pricing, etc.)
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null); 
  const [previewImage, setPreviewImage] = useState(null);
  const [pendingHardware, setPendingHardware] = useState(null);
  const [isWindowActive, setIsWindowActive] = useState(true);
  const [pricing, setPricing] = useState({ bw: 2, color: 10, aadhaar: 30, passport: 20 });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // 🟢 PRINTER ROUTING STATES
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(localStorage.getItem('saved_printer') || '');
  const [isScanningPrinters, setIsScanningPrinters] = useState(false);
  const [tempPricing, setTempPricing] = useState({ ...pricing });
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [serverStatus, setServerStatus] = useState('connecting');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawState, setDrawState] = useState({ isDrawing: false, startX: 0, startY: 0, currentRect: null });
  const [isBackMasking, setIsBackMasking] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false); // 🟢 Controls the Hide/Show feature

  const [printSettings, setPrintSettings] = useState({
    colorMode: 'bw', scale: 'fit', position: 'top-left', backJobId: null,
    securityMode: 'none', securePurpose: '', secureDate: '',
    maskAadhaar: false, maskRectArray: [], isBlindPreview: false, rotate: 0 
  });
  
  const initialFetchDone = useRef(false);
  // 🟢 FIX: Define the missing activeJobRef and keep it synced
  const activeJobRef = useRef(activeJob);
  
  useEffect(() => {
      activeJobRef.current = activeJob;
  }, [activeJob]);
  
  const isCheckingHardware = useRef(false);

  const uploadLink = `${window.location.origin}/u/${auth.shopId}`;
 const [rawDrawImage, setRawDrawImage] = useState(null); // 🟢 Holds the secure image

const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');




 // 🟢 PRINT PASS LOGIC 
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [passData, setPassData] = useState({ name: '', address: '', paymentNumber: '', lang: 'en' });
  const printPassRef = useRef();
  
  // 🟢 Renamed to handlePrintPass so it doesn't conflict with your job printer
 const handlePrintPass = useReactToPrint({
    contentRef: printPassRef,
    documentTitle: "Subhams-Pass",
})

const fetchQueue = useCallback(async () => {
    if (!auth.shopId || !auth.token) return;
    try {
      const response = await api.get(`/jobs/queue/${auth.shopId}`);
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      console.error("Queue fetch error:", err); 
    }
  }, [auth.shopId, auth.token, handleLogout]);

  
// 🟢 1. Initialize state with the default value FIRST
  const [ownerName, setOwnerName] = useState(localStorage.getItem('ownerName') || "Shop Owner");
const fetchPricing = useCallback(async () => {
    try {
      const res = await api.get(`/shop/pricing/${auth.shopId}`);
      if (res.data.success) {
        setPricing(res.data.pricing);
        setTempPricing(res.data.pricing);
      }
    } catch (err) {
      console.error("Pricing fetch error:", err); 
    }
  }, [auth.shopId]);

  const savePricing = async () => {
    try {
      const res = await api.put(`/shop/pricing/${auth.shopId}`, { pricing: tempPricing });
      if (res.data.success) {
        setPricing(tempPricing);
        setIsSettingsOpen(false);
        alert("✅ Updated successfully!");
      }
    } catch (err) {
      console.error("Save pricing error:", err); 
      alert("❌ Failed to update.");
    }
  };
  

  useEffect(() => {
    // Check if the shop owner has already seen the V2.0 update
    const hasSeenUpdate = localStorage.getItem('subhams_seen_update_v2');
    if (!hasSeenUpdate) {
      // Show it after a short delay for a premium feel
      const timer = setTimeout(() => setShowReleaseNotes(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeReleaseNotes = () => {
    localStorage.setItem('subhams_seen_update_v2', 'true');
    setShowReleaseNotes(false);
  };

  // 🟢 2. Use a clean useEffect that only updates IF data is found
  useEffect(() => {
    if (!auth.shopId) return;

api.get(`/shop/details/${auth.shopId}`)
      .then(res => {
          const actualName = res.data.ownerName || res.data.name || res.data.shop?.ownerName || res.data.user?.name;
          if (actualName) { 
            setOwnerName(actualName); 
            localStorage.setItem('ownerName', actualName); 
          }
      })
      .catch(err => {
          console.error("API failed, keeping default name:", err.message);
          // Do NOT call setOwnerName here. Let it stay as "Shop Owner" (the default).
      });
      
    // Timer logic stays here...
    const timer = setInterval(() => {
        const now = new Date();
        setIstTime(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
        const hour = now.getHours();
        setGreeting(hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening");
    }, 1000);
    
    return () => clearInterval(timer);
  }, [auth.shopId]);
const checkHardware = useCallback(async () => {
    if (!auth.shopId || !auth.token || isCheckingHardware.current) return;
    isCheckingHardware.current = true; 
    try {
      const res = await api.get(`/shop/hardware/status/${auth.shopId}`);
      setPendingHardware(res.data.success ? res.data.pendingHardware : null);
    } catch (err) {
      console.error("Hardware check error:", err); 
    } finally {
      isCheckingHardware.current = false; 
    }
  }, [auth.shopId, auth.token]); 

useEffect(() => {
    if (activeJob && !isDrawingMode) {
      const delayTimer = setTimeout(async () => {
        try {
            const response = await api.post(`/preview-fast/${activeJob.jobId}`, { 
                overrides: { ...printSettings } 
            }, { responseType: 'blob' }); 
            
            const contentType = response.headers['content-type'] || 'application/pdf';
         const fileBlob = new Blob([response.data], { type: contentType });
setPreviewImage(oldUrl => {
    if (oldUrl) URL.revokeObjectURL(oldUrl); // 🟢 Kills the old memory instantly!
    return URL.createObjectURL(fileBlob);
});
        } catch (error) {
            console.error("Fast preview error:", error);
        }
      }, 600); 

      return () => clearTimeout(delayTimer); 
    }
  }, [activeJob, printSettings, isDrawingMode]); 
useEffect(() => {
    const handleJobExpired = (data) => {
        // Now activeJobRef exists and won't crash!
        if (activeJobRef.current && activeJobRef.current.jobId === data.jobId) {
            setActiveJob(null);
            setPreviewImage(null);
            alert("⚠️ The file was automatically removed due to timeout.");
        }
        // Always refresh the queue, regardless of which job expired
        fetchQueue();
    };

    socket.on('JOB_EXPIRED', handleJobExpired);
    
    // Clean up
    return () => socket.off('JOB_EXPIRED', handleJobExpired);
}, [fetchQueue]);

useEffect(() => {
    const triggerLock = () => setIsWindowActive(false);
    const releaseLock = () => setIsWindowActive(true);

    // 🟢 BLOCK ZOOMING (Ctrl+Scroll, Trackpad Pinch)
    const preventZoom = (e) => {
        if (e.ctrlKey || e.metaKey || e.touches?.length > 1) {
            e.preventDefault();
        }
    };

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const isMetaOrCtrl = e.ctrlKey || e.metaKey;
      
      // Block Ctrl++ and Ctrl+- zooming
      if (isMetaOrCtrl && (key === '+' || key === '-' || key === '=')) { e.preventDefault(); return; }

      if (isMetaOrCtrl && key === 'p') { e.preventDefault(); alert("🚫 Printing is strictly disabled!"); return; }
      if (isMetaOrCtrl && key === 's') { e.preventDefault(); alert("🚫 Saving files is disabled!"); return; }
      if (e.key === 'PrintScreen' || key === 'printscreen' || (e.metaKey && e.shiftKey && (key === '3' || key === '4'))) {
        triggerLock(); 
        e.preventDefault();
        alert("🚫 Screenshots are blocked!");
        return;
      }
    };

    window.addEventListener('blur', triggerLock);
    window.addEventListener('focus', releaseLock);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', preventZoom, { passive: false });
    window.addEventListener('touchmove', preventZoom, { passive: false });

    return () => {
      window.removeEventListener('blur', triggerLock);
      window.removeEventListener('focus', releaseLock);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', preventZoom);
      window.removeEventListener('touchmove', preventZoom);
    };
  }, []);
// 🟢 MASTER EFFECT: Socket and Initial Data
useEffect(() => {
    if (!auth.token || !auth.shopId) {
        navigate('/login');
        return;
    }

    console.log("🔄 Initializing Socket for Shop:", auth.shopId);
    
    // 🟢 THE FIX: Force connect and immediately emit JOIN_SHOP regardless of events
    socket.connect();
    socket.emit('JOIN_SHOP', { shopId: auth.shopId });

    const handleConnect = () => {
        console.log("🌐 SUCCESS: Socket Re-Connected!");
        setServerStatus('connected'); // 🟢 NEW: Tell UI we are online and hide the traffic banner
        socket.emit('JOIN_SHOP', { shopId: auth.shopId });
    };

    const handleDisconnect = (reason) => {
        console.warn("⚠️ Socket Disconnected:", reason);
        setServerStatus('disconnected'); // 🟢 NEW: Tell UI the server went to sleep
    };
    
    const handleConnectError = (error) => {
        console.error("❌ SOCKET ERROR:", error.message);
        setServerStatus('error'); // 🟢 NEW: Tell UI the server is trying to wake up
    };

    const handleNewJob = () => fetchQueue();
    const handleUpdate = () => setNeedsUpdate(true);
    const handleKick = () => {
        alert("SECURITY ALERT: Your account has been deleted.");
        handleLogout();
    };

    // ==========================================
    // 🟢 1. NEW PRINT ERROR HANDLER
    // ==========================================
    const handlePrintError = (data) => {
        const errorMsg = data.msg || data.error || 'Check printer connection.';
        alert(`🖨️ PRINT FAILED!\n\nThe Subhams system is working perfectly, but your device has a problem.\n\nError: ${errorMsg}\n\nPlease fix your PC hardware/cables or contact Subhams Admin for help.`);
    };

    // ==========================================
    // 🟢 2. UPDATED SCANNER HANDLER
    // ==========================================
    const handlePrintersList = (list) => { 
        setPrinters(list); 
        setIsScanningPrinters(false); 
        
        // Check if the Desktop Agent sent our custom PC Error string!
        if (list.length > 0 && typeof list[0] === 'string' && list[0].includes('⚠️ PC Error')) {
            alert(`🔍 SCANNER BLOCKED!\n\nThe Subhams system is working perfectly, but your PC blocked the USB scan.\n\nReason: ${list[0]}\n\nPlease check your Antivirus, fix your device, or contact Subhams Admin for help.`);
        }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('NEW_JOB_RECEIVED', handleNewJob);
    socket.on('AGENT_NEEDS_UPDATE', handleUpdate);
    socket.on('FORCE_KICK_ALL', handleKick);
    
    // 🟢 3. REGISTER THE NEW LISTENERS
    socket.on('PRINT_ERROR', handlePrintError);
    socket.on('JOB_FAILED', (data) => handlePrintError({ msg: data.error }));
    socket.on('RECEIVE_PRINTERS_LIST', handlePrintersList);

    // 🟢 YOUR ORIGINAL FETCH LOGIC (Safely kept intact!)
    if (!initialFetchDone.current) {
        fetchQueue();
        fetchPricing();
        checkHardware();
        initialFetchDone.current = true;
    }

    const securityInterval = setInterval(checkHardware, 5000);

    return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
        socket.off('NEW_JOB_RECEIVED', handleNewJob);
        socket.off('AGENT_NEEDS_UPDATE', handleUpdate);
        socket.off('FORCE_KICK_ALL', handleKick);
        
        // 🟢 4. CLEANUP THE NEW LISTENERS
        socket.off('PRINT_ERROR', handlePrintError);
        socket.off('JOB_FAILED', handlePrintError);
        socket.off('RECEIVE_PRINTERS_LIST', handlePrintersList);
        
        clearInterval(securityInterval);
    };
}, [auth.shopId, auth.token, navigate, fetchQueue, fetchPricing, checkHardware, handleLogout]);

  const calculateJobPrice = (job, isForPreview = false) => {
    const settings = isForPreview ? printSettings : job.options;
    let rate = pricing.bw; 
    if (settings.scale === 'aadhaar' || settings.scale === 'pan') rate = pricing.aadhaar;
    else if (settings.scale === 'passport') rate = pricing.passport;
    else if (settings.colorMode === 'color') rate = pricing.color;
    return rate * (settings.copies || 1);
  };

  const handleView = (job) => {
    let parsedMaskArray = [];
    if (job.options?.maskRect) {
        try {
            const rawMasks = Array.isArray(job.options.maskRect) ? job.options.maskRect : [job.options.maskRect];
            parsedMaskArray = rawMasks.map(m => typeof m === 'string' ? JSON.parse(m) : m).filter(m => m && m.width > 0);
        } catch(e) { console.error("Could not parse coordinates:", e); }
    }
    
setPrintSettings({
      colorMode: job.options?.colorMode || 'bw', scale: job.options?.scale || 'fit',            
      position: job.options?.position || 'top-left', backJobId: null, securityMode: job.options?.securityMode || 'none', 
      securePurpose: job.options?.securePurpose || '', secureDate: job.options?.secureDate || new Date().toLocaleDateString('en-GB'),
      maskAadhaar: job.options?.maskAadhaar === true || job.options?.maskAadhaar === 'true' || parsedMaskArray.length > 0,
      
      // 🟢 THE FIX: Start with dual buckets
      maskRectArray: { front: parsedMaskArray, back: [] },
      
      isBlindPreview: job.options?.isBlindPreview === true || job.options?.isBlindPreview === 'true',
      rotate: job.options?.rotate ? parseInt(job.options.rotate) : 0
    });
    
setActiveJob(job); setPreviewImage(null); setIsDrawingMode(false);
    socket.emit('NOTIFY_VIEWED', { jobId: job.jobId });
  };
const handlePrint = (jobId) => {
    const savedPrinter = localStorage.getItem('saved_printer'); // 🟢 Grab saved printer
    // 🛑 Connection checks removed. Directly sending the command.
    
    socket.emit('MANUAL_PRINT', { 
        jobId, fileIndex: 0,
        overrides: { ...printSettings, rotate: printSettings.rotate, maskRect: printSettings.maskRectArray, copies: activeJob?.options?.copies || 1 ,targetPrinter: savedPrinter || ''} 
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
        await api.delete(`/jobs/${jobId}`);
        if(activeJob?.jobId === jobId) { setActiveJob(null); setPreviewImage(null); setIsDrawingMode(false); }
        fetchQueue();
    } catch (err) { console.error("Job delete error:", err); alert("Failed to delete job."); }
  };

  const handleHardwareDecision = async (decision) => {
    try {
      const res = await api.post('/shop/hardware/decision', { shopId: auth.shopId, decision });
      if (res.data.success) {
        setPendingHardware(null); alert(decision === 'APPROVE' ? "✅ Hardware Approved!" : "❌ Hardware Rejected!");
      }
    } catch (err) { console.error("Hardware decision error:", err); alert("Action failed."); }
  };

  const copyShopId = () => { navigator.clipboard.writeText(auth.shopId); alert(`Shop ID Copied: ${auth.shopId}`); };

  const downloadQR = () => {
    const svg = document.getElementById("shop-qr-code");
    if(!svg) return alert("QR Code not ready yet.");
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = `Subhams-QR-${auth.shopId}.svg`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
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
          const side = isBackMasking ? 'back' : 'front';
          setPrintSettings(prev => ({ 
              ...prev, 
              maskRectArray: {
                  ...prev.maskRectArray,
                  [side]: [...(prev.maskRectArray[side] || []), drawState.currentRect]
              }
          }));
      }
      setDrawState({ isDrawing: false, startX: 0, startY: 0, currentRect: null });
      if(e.pointerId) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const undoLastMask = () => {
      setPrintSettings(prev => {
          const side = isBackMasking ? 'back' : 'front';
          const newArray = [...(prev.maskRectArray[side] || [])]; 
          newArray.pop();
          return { ...prev, maskRectArray: { ...prev.maskRectArray, [side]: newArray } };
      });
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
// 🟢 UPGRADED: Scan Button Logic with Timeout Trap
    const handleScanPrinters = () => {
        if (!socket || !socket.connected) {
            alert("⚠️ OFFLINE: Your dashboard is disconnected from the server. Please refresh the page.");
            return;
        }

        // 1. Start the loading spinner and ask the Agent for printers
        setIsScanningPrinters(true);
        setPrinters([]); // Clear old list
        socket.emit('REQUEST_PRINTERS');

        // 🟢 FIX: Local flag to stop React Strict Mode from double-alerting
        let hasAlerted = false;

        // 2. The Timeout Trap (Triggers if Agent is dead/closed)
        setTimeout(() => {
            setIsScanningPrinters((isStillScanning) => {
                if (isStillScanning && !hasAlerted) {
                    hasAlerted = true; // Locks the gate so it only alerts ONCE
                    alert("⚠️ AGENT NOT RESPONDING!\n\nYour Subhams Desktop Agent is offline, closed, or not connected to the internet.\n\nPlease open the Subhams Agent on your Windows PC and make sure it says 'Ready' before scanning.");
                    return false; // Turns off the infinite loading spinner!
                }
                return isStillScanning;
            });
        }, 6000); // Waits 6 seconds
    };

  // --- Render ---
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif", paddingTop: hasTopBar ? '46px' : '0' }}>
      

      {/* 🌟 1. PREMIUM TOP BAR */}
      {hasTopBar && (
        <div style={topBarStyle}>
          {config.showClock && (
            <div style={clockStyle}>
              <span style={clockIndicatorStyle}></span>
              <span style={{opacity: 0.4, fontSize: '9px', letterSpacing: '2px', marginRight: '6px', fontWeight: 'bold'}}>IST</span>
              <span style={{ color: '#60a5fa' }}>{istTime || "--:--:-- --"}</span>
            </div>
          )}
          
          {shouldShowMessage && (
            <div style={marqueeContainer}>
              <div style={{
                ...marqueeContent,
                animation: `${config.enableScrolling ? `superScroll ${config.scrollSpeed} linear infinite` : 'none'}`,
                position: config.enableScrolling ? 'absolute' : 'static',
                width: config.enableScrolling ? 'auto' : '100%',
                justifyContent: config.enableScrolling ? 'flex-start' : 'center',
                display: 'flex', alignItems: 'center', paddingLeft: config.enableScrolling ? '24px' : '0'
              }}>
                {config.postTime && config.postTime !== "NA" && (
                  <span style={badgeStyle}><span style={badgePulseStyle}></span>{config.postTime}</span>
                )}
                {/* 🟢 DYNAMIC GREETING MESSAGE */}
                <span style={{ ...textGlowStyle, textTransform: 'none' }}>
                   {greeting}, {ownerName}! | {config.message}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      
 

     {/* 🌟 2. NAVBAR */}
      <style>
        {`
          /* 1. The Active Scanning Radar Effect */
          @keyframes radar-scan {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
            70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
          }
          
          /* 2. The Premium Glass Shine Sweep */
          @keyframes premium-shine {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }

          .premium-security-badge {
            background: linear-gradient(110deg, #064e3b 40%, #047857 50%, #064e3b 60%);
            background-size: 200% auto;
            animation: radar-scan 2.5s infinite, premium-shine 5s linear infinite;
            border: 1px solid #22c55e;
          }
            /* Add this inside your existing <style> tag */
.dashboard-fluid-grid {
    display: grid;
    gap: 25px;
    grid-template-columns: 1fr; /* Stacks vertically on small screens */
}

/* When the screen is wider than 1100px, automatically switch to side-by-side! */
@media (min-width: 1100px) {
    .dashboard-fluid-grid {
        grid-template-columns: 1fr 1fr; 
    }
}

.responsive-panel {
    display: flex;
    flex-direction: column;
    /* Automatically takes up 75% of whatever screen height it is on */
    height: 75vh; 
    /* But if the screen is super tiny, never shrink smaller than 550px */
    min-height: 550px; 
}
    /* 🟢 ANTI-ZOOM SAFEGUARD FOR MOBILE/TOUCH */
          body { touch-action: pan-y; overscroll-behavior: none; }

          /* 🟢 RESPONSIVE MASTER LAYOUT */
          .master-layout {
              display: grid;
              grid-template-columns: 310px 1fr; /* Sidebar is 310px, everything else takes remaining space */
              gap: 30px;
              margin-top: 15px;
              align-items: start;
          }

          /* If the screen gets smaller than 1200px (like a laptop), stack everything nicely! */
          @media (max-width: 1200px) {
              .master-layout { grid-template-columns: 1fr; }
          }
        `}
      </style>

      <nav style={{ background: '#0f172a', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, color: '#facc15' }}>Subhams Dashboard</h2>
          
          {/* 🟢 NEW: Premium Anti-Virus Marketing Badge */}
          <div 
            className="premium-security-badge"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '6px 14px', borderRadius: '30px', 
              cursor: 'help' /* Shows a question mark on hover */
            }} 
            title="Subhams destroys hidden viruses in customer files before they ever touch your PC. No more pendrive viruses!"
          >
            <span style={{ fontSize: '15px', filter: 'drop-shadow(0 0 4px rgba(74,222,128,0.9))' }}>🛡️</span>
            <span style={{ 
              fontSize: '11px', color: '#bbf7d0', fontWeight: '900', 
              letterSpacing: '0.8px', textTransform: 'uppercase' 
            }}>
              Anti-Virus Guard Active
            </span>
          </div>
        </div>

   

        <div style={{ display: 'flex', gap: '10px' }}>
       <button onClick={() => setActiveTab('subhamsWriter')} style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', color: '#facc15', border: '1px solid #facc15', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>✨ Subhams Writer</button>
       
          <button onClick={() => setIsSettingsOpen(true)} style={{...navBtn, background: '#475569'}}>⚙️ Settings</button>
          <button onClick={fetchQueue} style={navBtn}>🔄 Refresh Queue</button>
          <button onClick={handleLogout} style={{ ...navBtn, background: '#b91c1c' }}>🚪 Logout</button>
        </div>
      </nav>
{/* 🌟 PREMIUM "WHAT'S NEW" FEATURE SPOTLIGHT MODAL */}
      {showReleaseNotes && (
        <div style={{...modalOverlay, zIndex: 3000, backdropFilter: 'blur(8px)'}}>
          <style>
            {`
              /* 🟢 1. Modal Entrance & Exit Animations */
              @keyframes slide-up-modal {
                0% { opacity: 0; transform: translateY(40px) scale(0.95); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
              }
              @keyframes pop-in-feature {
                0% { opacity: 0; transform: translateX(-20px); }
                100% { opacity: 1; transform: translateX(0); }
              }
              @keyframes float-icon {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-6px); }
              }
              .premium-modal-container {
                animation: slide-up-modal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              
              /* 🟢 2. The Modal Exit Animation (Zoom away fast for the Shield) */
              .celebration-exit {
                animation: modal-zoom-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
              }
              @keyframes modal-zoom-out {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(0.5); opacity: 0; }
              }

              /* 🟢 3. EPIC SECURITY SHIELD ANIMATIONS (Extended Time & New Scanners) */
              @keyframes shield-materialize {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.1); opacity: 1; }
                70% { transform: scale(0.95); opacity: 1; }
                100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 40px rgba(16, 185, 129, 0.8)); }
              }
              @keyframes shockwave-expand {
                0% { transform: scale(0); opacity: 0.8; border-width: 25px; }
                100% { transform: scale(6); opacity: 0; border-width: 0px; }
              }
              @keyframes text-glow-pulse {
                0%, 100% { opacity: 0.9; text-shadow: 0 0 10px #6ee7b7; }
                50% { opacity: 1; text-shadow: 0 0 25px #6ee7b7, 0 0 35px #10b981; }
              }
              @keyframes terminal-blink {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 1; }
              }

              /* 🟢 4. Custom Invisible Scrollbar */
              .feature-scroll-box::-webkit-scrollbar { width: 6px; }
              .feature-scroll-box::-webkit-scrollbar-track { background: transparent; }
              .feature-scroll-box::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
            `}
          </style>
          
          {/* 💥 THE MASSIVE SECURITY ACTIVATION OVERLAY */}
          {isCelebrating && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
              
              {/* Infinite Forcefield Shockwaves expanding across the screen */}
              <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', border: 'solid #10b981', animation: 'shockwave-expand 2s ease-out infinite' }}></div>
              <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', border: 'solid #34d399', animation: 'shockwave-expand 2s ease-out 1s infinite' }}></div>
              
              {/* The Glowing Holographic Shield Container */}
              <div style={{ 
                animation: 'shield-materialize 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(6,78,59,0.95) 0%, rgba(2,44,34,0.98) 100%)', 
                padding: '50px 60px', borderRadius: '40px', border: '2px solid #10b981', 
                boxShadow: 'inset 0 0 40px rgba(16, 185, 129, 0.5), 0 20px 50px rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' 
              }}>
                <div style={{ fontSize: '90px', marginBottom: '10px', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.5))' }}>🛡️</div>
                <h2 style={{ margin: 0, color: '#6ee7b7', fontSize: '36px', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', animation: 'text-glow-pulse 1.5s infinite', textAlign: 'center' }}>
                  System Secured
                </h2>
                
                {/* 🟢 NEW: High-Tech Boot-Up Terminal inside the Shield */}
                <div style={{ marginTop: '25px', textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: '20px 30px', borderRadius: '16px', border: '1px solid rgba(52, 211, 153, 0.3)', width: '100%', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', animation: 'terminal-blink 1s infinite' }}>
                    Subhams Networks Activating...
                  </p>
                  <p style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '800', letterSpacing: '1px' }}>
                    Welcome, {ownerName || 'User'}!
                  </p>
                </div>

              </div>

            </div>
          )}

          <div 
            className={`premium-modal-container ${isCelebrating ? 'celebration-exit' : ''}`} 
            style={{ 
              background: '#fff', padding: '0', borderRadius: '24px', width: '92%', maxWidth: '480px', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid #e2e8f0',
              display: 'flex', flexDirection: 'column', maxHeight: '85vh'
            }}
          >
            
            {/* 🌟 Header Area */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '35px 20px', textAlign: 'center', position: 'relative', borderBottom: '1px solid #334155', flexShrink: 0 }}>
              <div style={{ animation: 'float-icon 3s ease-in-out infinite', display: 'inline-block', fontSize: '55px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))', marginBottom: '15px' }}>🚀</div>
              <h2 style={{ color: '#fff', margin: '0', fontSize: '24px', letterSpacing: '0.5px', fontWeight: '800' }}>Subhams Print Portal V2.0</h2>
              <p style={{ color: '#94a3b8', margin: '8px 0 0 0', fontSize: '14px', lineHeight: '1.5' }}>Your workflow is now faster, smarter, and <b style={{color: '#38bdf8'}}>100% secure</b>.</p>
            </div>

            {/* 🌟 Scrollable Feature List */}
            <div className="feature-scroll-box" style={{ padding: '30px 25px', display: 'flex', flexDirection: 'column', gap: '22px', overflowY: 'auto', flex: 1 }}>
              
              <div style={{ opacity: 0, animation: 'pop-in-feature 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ background: '#dcfce3', padding: '12px', borderRadius: '14px', fontSize: '22px', boxShadow: '0 4px 6px rgba(22, 163, 74, 0.1)' }}>🛡️</div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>Zero-Trust Cloud Firewall</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '13.5px', lineHeight: '1.5' }}>Malware and viruses are instantly blocked and destroyed in the cloud. <b>Malicious files can never reach your PC.</b></p>
                </div>
              </div>

              <div style={{ opacity: 0, animation: 'pop-in-feature 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '14px', fontSize: '22px', boxShadow: '0 4px 6px rgba(245, 158, 11, 0.1)' }}>⚙️</div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>Customer-Driven Copies</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '13.5px', lineHeight: '1.5' }}>Customers set their exact copies and sizes from their phone. <b>You don't edit anything—just click print!</b></p>
                </div>
              </div>

              <div style={{ opacity: 0, animation: 'pop-in-feature 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ background: '#f3e8ff', padding: '12px', borderRadius: '14px', fontSize: '22px', boxShadow: '0 4px 6px rgba(168, 85, 247, 0.1)' }}>⚡</div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>1-Click Print Ready</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '13.5px', lineHeight: '1.5' }}>The Dashboard automatically generates a perfect A4 preview. Zero manual resizing or alignment needed on your end.</p>
                </div>
              </div>

              <div style={{ opacity: 0, animation: 'pop-in-feature 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '14px', fontSize: '22px', boxShadow: '0 4px 6px rgba(220, 38, 38, 0.1)' }}>👁️‍🗨️</div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>Privacy-First Blind Preview</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '13.5px', lineHeight: '1.5' }}>Customers can securely blur highly private documents. You still get perfect print alignment while earning their trust.</p>
                </div>
              </div>

              <div style={{ opacity: 0, animation: 'pop-in-feature 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ background: '#e0e7ff', padding: '12px', borderRadius: '14px', fontSize: '22px', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.1)' }}>🪪</div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>Smart ID Stitching</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '13.5px', lineHeight: '1.5' }}>Customers seamlessly merge the front and back of Aadhaar/PAN cards. It arrives on your screen ready to print.</p>
                </div>
              </div>

            </div>

            {/* 🌟 Action Button Area */}
            <div style={{ padding: '20px 25px 25px 25px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
              <button 
                onClick={() => {
                  // 🟢 1. Trigger the massive Security UI
                  setIsCelebrating(true); 
                  
                  // 🟢 2. Increased timer to 6000ms (6 seconds) so they can read the boot-up text
                  setTimeout(() => {
                    closeReleaseNotes();
                    setIsCelebrating(false); 
                  }, 10000);
                }} 
                style={{ 
                  width: '100%', padding: '16px', 
                  background: 'linear-gradient(to right, #059669, #047857)', 
                  color: '#fff', border: 'none', borderRadius: '12px', 
                  fontWeight: '800', fontSize: '16px', cursor: 'pointer', 
                  boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3)',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Activate Security & Start Working
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🌟 3. MAIN CONTENT */}
      <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>

{/* 🟢 THIS LINE MAKES THE IMPORT "USED" */}
{activeTab === 'subhamsWriter' ? (
    <AIDocWriter />
) : (
    <>
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
                      
                      {/* 🌟 NEW TEXT ADDED HERE 🌟 */}
                      <p style={{ color: '#991b1b', margin: '8px 0 0 0', fontSize: '13px', fontWeight: 'bold', background: '#fecaca', padding: '6px 10px', borderRadius: '6px' }}>
                          ⚠️ If this wasn't you, click Reject, go to your Manage Vault, and update to a new Agent Key. NEVER share your key with anyone!
                      </p>
                  </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleHardwareDecision('REJECT')} style={rejectBtn}>❌ Reject & Block</button>
                  <button onClick={() => handleHardwareDecision('APPROVE')} style={approveBtn}>✅ Approve New Device</button>
              </div>
          </div>
        )}

     {/* 🟢 NEW: APPLIED THE RESPONSIVE FLUID MASTER LAYOUT */}
        <div className="master-layout">
          
          {/* 🟢 LEFT SIDEBAR (With Sticky Positioning so it stays in view) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'sticky', top: '70px' }}>
            
            {/* 🌟 HIDE / SHOW TOGGLE BUTTON 🌟 */}
            <button 
                onClick={() => setIsSidebarHidden(!isSidebarHidden)} 
                style={{ 
                    background: isSidebarHidden ? '#1e293b' : '#f1f5f9', 
                    color: isSidebarHidden ? '#facc15' : '#475569', 
                    border: isSidebarHidden ? '1px solid #334155' : '1px solid #cbd5e1', 
                    padding: '12px 15px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    boxShadow: isSidebarHidden ? '0 10px 15px -3px rgba(0,0,0,0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease'
                }}
            >
                <span>{isSidebarHidden ? '👀 Show Shop Tools' : '🙈 Hide Shop Tools'}</span>
                <span style={{ transform: isSidebarHidden ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}>⬆️</span>
            </button>

            {/* 🌟 THE CONTENT THAT GETS HIDDEN 🌟 */}
            {!isSidebarHidden && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', animation: 'slide-up-modal 0.4s ease-out' }}>
                    <div style={{...card, padding: '20px'}}>
                      <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px', textAlign: 'center' }}>Shop QR Code</h3>
                      <div style={{ background: '#fff', padding: '15px', display: 'flex', justifyContent: 'center', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <QRCodeSVG id="shop-qr-code" value={uploadLink} size={160} />
                      </div>
                      
                      <button onClick={() => setIsPrintModalOpen(true)} style={{ ...navBtn, background: '#f59e0b', width: '100%', marginTop: '15px', padding: '10px' }}>
                        🎟️ Print Shop QR Pass
                      </button>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                        <button onClick={downloadQR} style={{...downloadBtn, marginTop: 0}}>📥 Download</button>
                        <button onClick={copyShopId} style={{...copyIdBtn, marginTop: 0}}>📋 Copy ID</button>
                      </div>
                    </div>

                    <button onClick={() => navigate('/manage')} style={{...vaultBtn, padding: '15px'}}>
                      <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>🔐</span>
                      Security Vault<br/>
                      <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.8 }}>Manage Agent Key</span>
                    </button>
                </div>
            )}
            
         {/* 🌟 NEW: ULTRA-PREMIUM BUSINESS PROMO BANNER 🌟 */}
            <div style={{
                background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #4c1d95',
                boxShadow: '0 12px 30px -5px rgba(76, 29, 149, 0.4)',
                color: 'white'
            }}>
                <style>{`
                  @keyframes glass-sweep {
                    0% { left: -100%; }
                    20% { left: 200%; }
                    100% { left: 200%; }
                  }
                  @keyframes glow-pulse {
                    0%, 100% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); transform: scale(1); }
                    50% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.8); transform: scale(1.05); }
                  }
                `}</style>

                {/* Animated Glass Shine Layer */}
                <div style={{
                    position: 'absolute', top: 0, width: '50%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                    transform: 'skewX(-25deg)',
                    animation: 'glass-sweep 4s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}></div>

                {/* 🟢 Premium Tech/Service Image Showcase */}
                <div style={{ 
                    position: 'relative', marginBottom: '15px', borderRadius: '12px', 
                    overflow: 'hidden', height: '110px', border: '1px solid rgba(139, 92, 246, 0.4)' 
                }}>
                    <img 
                        src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80" 
                        alt="Tech Business" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} 
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #1e1b4b, transparent)' }}></div>
                    <div style={{ position: 'absolute', bottom: '8px', width: '100%', textAlign: 'center' }}>
                        <span style={{ 
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 12px', 
                            borderRadius: '20px', fontSize: '10px', fontWeight: '900', color: '#38bdf8', 
                            letterSpacing: '1px', border: '1px solid rgba(56,189,248,0.3)' 
                        }}>
                             PRODUCTS • SERVICES
                        </span>
                    </div>
                </div>

                <h4 style={{ margin: '0 0 6px 0', color: '#facc15', fontSize: '17px', fontWeight: '900', letterSpacing: '0.5px' }}>
                  Grow Your Business Mindset!
                </h4>
                
                <p style={{ margin: '0 0 12px 0', color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5' }}>
                  Your best platform to grow in the local market.<br/>
                  <span style={{ color: '#c084fc', fontWeight: '800', fontSize: '14px' }}>Subhams Business Market</span><br/>
                  <span style={{ 
                      display: 'inline-block', marginTop: '8px', fontSize: '10px', background: '#4f46e5', 
                      color: 'white', padding: '4px 12px', borderRadius: '6px', textTransform: 'uppercase', 
                      letterSpacing: '1px', fontWeight: 'bold', animation: 'glow-pulse 2s infinite' 
                  }}>
                    🚀 Coming Soon
                  </span>
                </p>

                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #6b21a8, transparent)', margin: '15px 0' }}></div>
                
                <p style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '12px', lineHeight: '1.6', fontWeight: '600' }}>
                  మీ వ్యాపారాన్ని స్థానికంగా అభివృద్ధి చేసుకోండి!<br/>
                  <span style={{ color: '#facc15' }}>సుభమ్స్ హబ్ లో</span> చేరండి.
                </p>

                {/* 🟢 Action Buttons Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    
                    {/* Main Website Link */}
                    <a 
                      href="https://hub.subhamsnetworks.in" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block', padding: '12px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'transform 0.2s', width: '95%', boxSizing: 'border-box'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      🌐 Visit Subhams Hub Platform 
                    </a>

                    {/* Hidden Mailbox Contact Button */}
                    <a 
                      href="mailto:pavanvenkat63@gmail.com?subject=Business%20Inquiry%20-%20Subhams-Hub"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '10px 20px', background: 'rgba(255, 255, 255, 0.08)',
                        color: '#cbd5e1', textDecoration: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                        border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.2s', width: '95%', boxSizing: 'border-box'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#cbd5e1'; }}
                    >
                      <span>📬</span> Send Mail
                    </a>
                </div>
            </div>
            {/* 🌟 END PREMIUM BANNER 🌟 */}

          </div>

          <div className="dashboard-fluid-grid">
            
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
                      
                      <div style={{ display: 'flex', flexDirection: 'column', background: 'white' }}>
                          {customerJobs.map((job) => (
                            <div key={job.jobId} style={{ 
                                display: 'flex', alignItems: 'center', padding: '15px', 
                                borderBottom: '1px solid #f1f5f9', background: activeJob?.jobId === job.jobId ? '#f0fdf4' : 'transparent' 
                            }}>
                              <div style={{ flex: 1, minWidth: 0, paddingRight: '15px' }}>
                                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={job.options?.fileName}>
                                  📄 {job.options?.fileName || `Job ${job.jobId.substring(0,6)}`}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                  <span style={{ color: '#475569', background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                    {job.options?.copies}x • {job.options?.colorMode === 'color' ? '🎨' : '⚫'} • ₹{calculateJobPrice(job)}
                                  </span>
                                  {job.options?.securityMode === 'govt' && <span style={{ color: '#166534', background: '#dcfce3', padding: '3px 6px', borderRadius: '4px', border: '1px solid #86efac' }}>🏛️ Govt Attested</span>}
                                  {job.options?.securityMode === 'private' && <span style={{ color: '#ea580c', background: '#ffedd5', padding: '3px 6px', borderRadius: '4px', border: '1px solid #fdba74' }}>🏢 Private Guard</span>}
                                  {(job.options?.isBlindPreview === true || job.options?.isBlindPreview === 'true') && <span style={{ color: '#991b1b', background: '#fee2e2', padding: '3px 6px', borderRadius: '4px', border: '1px solid #fca5a5' }}>🔒 Blind</span>}
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                <button onClick={() => handleDelete(job.jobId)} style={{ ...actionBtn, background: '#fee2e2', color: '#b91c1c', margin: 0 }}>🗑️</button>
                                <button onClick={() => handleView(job)} style={{ ...actionBtn, background: activeJob?.jobId === job.jobId ? '#10b981' : '#f8fafc', color: activeJob?.jobId === job.jobId ? 'white' : '#0f172a', border: '1px solid #cbd5e1', margin: 0 }}>
                                   {activeJob?.jobId === job.jobId ? 'Viewing' : 'View'}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
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
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={controlLabel}>Copies</label>
                                <div style={{ ...controlInput, background: '#e2e8f0', color: '#475569', fontWeight: 'bold', textAlign: 'center', height: '33px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {activeJob.options?.copies || 1}
                                </div>
                            </div>
                            <div>
                                <label style={controlLabel}>Color</label>
                                <select value={printSettings.colorMode} onChange={(e) => { setPreviewImage(null); setPrintSettings({...printSettings, colorMode: e.target.value}); }} style={{...controlInput, height: '33px'}}>
                                    <option value="bw">B&W</option>
                                    <option value="color">Color</option>
                                </select>
                            </div>
                            <div>
                                <label style={controlLabel}>Rotate</label>
                                <button 
                                    type="button" 
                                    onClick={() => { setPreviewImage(null); setPrintSettings({...printSettings, rotate: ((printSettings.rotate || 0) + 90) % 360}); }} 
                                    style={{...controlInput, background: '#e0e7ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 'bold', cursor: 'pointer', height: '33px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                >
                                    ↻ {printSettings.rotate || 0}°
                                </button>
                            </div>
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
  onClick={async () => { 
        if (!isDrawingMode) {
            try {
                // 🟢 Added the secureToken directly into the URL!
                const downloadUrl = `/jobs/download/${activeJob.jobId}?secureToken=subhams_front_auth_998877`;
                
                const response = await api.get(downloadUrl, { responseType: 'blob' });
                setRawDrawImage(URL.createObjectURL(response.data));
                
                setIsDrawingMode(true); 
                setPreviewImage(null);
            } catch (err) {
                console.error(err);
                alert("❌ File lost from server! The server restarted or went to sleep and erased the temporary files.");
            }
        } else {
            setIsDrawingMode(false); 
            setPreviewImage(null); 
        }
    }}
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
                          <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>
                              {isBackMasking ? "✏️ Drawing on BACK SIDE" : "✏️ Drawing on FRONT SIDE"}
                          </h4>
                          
                          {/* 🟢 THE FIX: Switch Button */}
                          {printSettings.backJobId && (
                              <button 
                                  onClick={async () => {
                                      const targetId = isBackMasking ? activeJob.jobId : printSettings.backJobId;
                                      setIsBackMasking(!isBackMasking);
                                      setPreviewImage(null);
                                   // Change the setRawDrawImage line inside the onClick of the "Draw Mask Manually" button:
const res = await api.get(`/jobs/download/${targetId}?secureToken=subhams_front_auth_998877`, { responseType: 'blob' });

// 🟢 THE FIX: Kills the old memory before loading the new image!
setRawDrawImage(oldUrl => {
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    return URL.createObjectURL(res.data);
});
                                  }}
                                  style={{ padding: '8px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', marginBottom: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                  🔄 {isBackMasking ? "Switch to Front ID" : "Switch to Back ID"}
                              </button>
                          )}
                          
                          <div style={{ position: 'relative', display: 'inline-block', border: '2px solid #cbd5e1', background: 'white', lineHeight: 0 }}>
                              <div 
                                  onPointerDown={startDrawing}
                                  onPointerMove={keepDrawing}
                                  onPointerUp={stopDrawing}
                                  onPointerCancel={stopDrawing}
                                  style={{ position: 'relative', display: 'inline-block', touchAction: 'none', cursor: 'crosshair' }}
                              >
                                  <img 
                                      src={rawDrawImage} 
                                      alt="Original File" 
                                      draggable={false}
                                      style={{ 
                                          display: 'block', maxWidth: '100%', maxHeight: '55vh', width: 'auto', height: 'auto',
                                         /* 🟢 Safely combines filters without printing "false" to CSS */
filter: [
    printSettings?.colorMode === 'bw' ? 'grayscale(100%) contrast(120%)' : null,
    printSettings?.isBlindPreview ? 'blur(4px)' : null
].filter(Boolean).join(' ') || 'none',
                                          transform: `rotate(${printSettings.rotate || 0}deg)`, transition: 'transform 0.3s ease'
                                      }} 
                                  />
                                  
                                  {/* 🟢 THE FIX: Show masks only for the active side */}
                                  {(printSettings.maskRectArray[isBackMasking ? 'back' : 'front'] || []).map((rect, rectIndex) => (
                                      <div key={rectIndex} style={{
                                          position: 'absolute', left: `${rect.x}%`, top: `${rect.y}%`,
                                          width: `${rect.width}%`, height: `${rect.height}%`,
                                          backgroundColor: 'black', opacity: 0.95, pointerEvents: 'none',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                                      }}>
                                          <span style={{color: 'white', fontSize: '6px', fontWeight: 'bold'}}>XXXX XXXX</span>
                                      </div>
                                  ))}

                                  {drawState.isDrawing && drawState.currentRect && (
                                       <div style={{
                                          position: 'absolute', left: `${drawState.currentRect.x}%`, top: `${drawState.currentRect.y}%`,
                                          width: `${drawState.currentRect.width}%`, height: `${drawState.currentRect.height}%`,
                                          backgroundColor: 'yellow', opacity: 0.4, border: '2px dashed red',
                                          pointerEvents: 'none' 
                                      }}></div>
                                  )}
                              </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                              <button 
                                  onClick={undoLastMask} 
                                  style={{ padding: '12px 20px', background: '#fee2e2', color: '#991b1b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                              >
                                  ↩️ Undo
                              </button>
                              
                              {/* 🟢 THE FIX: The Save Button logic */}
                              <button 
                                  onClick={() => { 
                                      const finalMasks = {
                                          front: printSettings.maskRectArray.front || [],
                                          back: printSettings.maskRectArray.back || []
                                      };
                                      socket.emit('SAVE_MASK', { jobId: activeJob.jobId, maskRect: finalMasks });
                                      
                                      setIsDrawingMode(false); 
                                      setIsBackMasking(false); 
                                      setPreviewImage(null); 
                                  }} 
                                  style={{ padding: '12px 25px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                              >
                                  ✅ Save Masks & Generate PDF
                              </button>
                          </div>
                      </div>
     ) : previewImage ? (
  <div 
    style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px' }} 
    onContextMenu={(e) => e.preventDefault()}
  >
    <style>{`
      @media print { body { display: none !important; } }
      .watermark-tile {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://w3.org' version='1.1' height='100px' width='100px'><text transform='translate(20, 100) rotate(-45)' fill='rgba(255,0,0,0.15)' font-size='20'>🚫 NO PRINT</text></svg>");
        pointer-events: none; z-index: 50;
      }
      /* 🟢 Hides the default white background of react-pdf pages to match your dark theme */
      .react-pdf__Page__canvas { margin: 0 auto; }
    `}</style>

    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', marginTop: '10px' }}>
        <button type="button" onClick={() => { const c = document.getElementById('secure-scroll-box'); if(c) c.scrollBy({ top: -300, behavior: 'smooth' }); }} style={zoomBtn}>⬆️ Scroll Up</button>
        <button type="button" onClick={() => { const c = document.getElementById('secure-scroll-box'); if(c) c.scrollBy({ top: 300, behavior: 'smooth' }); }} style={zoomBtn}>⬇️ Scroll Down</button>
    </div>

    <div id="secure-scroll-box" style={{ position: 'relative', width: '100%', height: '500px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#222' }}>
        <div className="watermark-tile" />
        {/* Anti-click transparent overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3000px', zIndex: 40, background: 'transparent' }} />

        {/* Security Blur Container */}
        <div style={{ width: '100%', minHeight: '100%', display: 'flex', justifyContent: 'center', filter: !isWindowActive ? 'blur(20px) grayscale(100%)' : 'none', transition: 'filter 0.1s', paddingTop: '20px' }}>
            
            {/* 🚀 THE FIX: react-pdf completely replaces the iframe */}
            <div style={{ 
                pointerEvents: 'none', 
                /* 🟢 Applies your Black & White and Blind Preview filters directly to the PDF Canvas */
                filter: `${printSettings?.colorMode === 'bw' ? 'grayscale(100%) contrast(120%)' : ''} ${printSettings?.isBlindPreview ? 'blur(4px)' : ''}`.trim() || 'none' 
            }}>
                <Document 
                    file={previewImage}
                    loading={<span style={{ color: 'white' }}>Loading Secure PDF...</span>}
                    error={<span style={{ color: 'red' }}>Failed to load PDF. Format error.</span>}
                >
                    <Page 
                        pageNumber={1} 
                        width={450} /* Adjust this number to make the A4 paper wider or thinner inside the black box */
                        renderTextLayer={false} 
                        renderAnnotationLayer={false}
                    />
                </Document>
            </div>

        </div>
    </div>
  </div>
) : (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#64748b', fontWeight: 'bold', textAlign: 'center' }}>
       <span style={{ marginBottom: '8px' }}>⚙️ Generating Accurate A4 Preview...</span>
       <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#94a3b8' }}>
         (Please wait, free servers may take a few extra seconds to process)
       </span>
    </div>
  )}
  </>
) : (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
    <span style={{ fontSize: '48px', marginBottom: '10px' }}>📄</span>
    <p style={{ textAlign: 'center', lineHeight: '1.5' }}>
      Select a job to preview content <br/> 
      కంటెంట్‌ను చూడటానికి 'View' క్లిక్ చేయండి
     </p>
  </div>
)}

          </div>
        </div>
      </div>

    </>
  )}

</div>

      {/* 🌟 4. OVERLAYS & MODALS */}
      {needsUpdate && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🚀</div>
            <h2 style={{ color: '#0f172a', margin: '0 0 5px 0', fontSize: '24px' }}>Update Required</h2>
            <h3 style={{ color: '#2563eb', margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>కొత్త సాఫ్ట్‌వేర్ అప్‌డేట్ అవసరం</h3>
            {!downloadStarted ? (
              <>
                <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
                  A faster, more secure version of the Agent is available. <br/>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>ప్రింటింగ్ కొనసాగించడానికి దయచేసి ఈ కొత్త వెర్షన్ డౌన్‌లోడ్ చేసుకోండి.</span>
                </p>
               <a 
  href="https://github.com/Vpk-star-space/Subhams-agent-frontend/releases/download/v2.0.0/Install-SubhamsAgent.exe" 
  download="Install-SubhamsAgent.exe" 
  style={downloadBtnStyle} 
  onClick={() => setDownloadStarted(true)}
>
  ⬇️ Download Update / డౌన్‌లోడ్
</a>
              </>
            ) : (
              <div style={stepsBoxStyle}>
                <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', textAlign: 'center' }}>Installation Steps / ఇన్‌స్టాల్ చేసే విధానం:</h4>
                <div style={stepRow}>
                  <div style={stepBadge}>1</div>
                  <div><b style={{color: '#1e293b'}}>Open the downloaded file.</b><br/><span style={{ fontSize: '12px', color: '#64748b' }}>డౌన్‌లోడ్ అయిన .exe ఫైల్‌ను ఓపెన్ చేయండి.</span></div>
                </div>
                <div style={stepRow}>
                  <div style={stepBadge}>2</div>
                  <div><b style={{color: '#1e293b'}}>If blocked, click "More Info" &rarr; "Run Anyway".</b><br/><span style={{ fontSize: '12px', color: '#64748b' }}>వార్నింగ్ వస్తే 'More info' నొక్కి, 'Run anyway' పైన క్లిక్ చేయండి.</span></div>
                </div>
                <div style={stepRow}>
                  <div style={stepBadge}>3</div>
                  <div><b style={{color: '#1e293b'}}>The app will restart automatically!</b><br/><span style={{ fontSize: '12px', color: '#64748b' }}>పాత దాన్ని డిలీట్ చేయాల్సిన అవసరం లేదు.</span></div>
                </div>
                <button onClick={() => setNeedsUpdate(false)} style={closeBtnStyle}>I have Installed It / ఇన్‌స్టాల్ చేసాను</button>
              </div>
            )}
          </div>
        </div>
      )}
{isSettingsOpen && (
        <div style={modalOverlay}>
          <div style={{...modalContent, width: '450px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h3 style={{marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#0f172a'}}>⚙️ Shop Settings</h3>
            
            {/* PRICING SECTION */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', margin: '20px 0'}}>
              <div><label style={controlLabel}>B&W Print Rate (₹)</label><input type="number" value={tempPricing.bw} onChange={(e) => setTempPricing({...tempPricing, bw: e.target.value})} style={controlInput} /></div>
              <div><label style={controlLabel}>Color Print Rate (₹)</label><input type="number" value={tempPricing.color} onChange={(e) => setTempPricing({...tempPricing, color: e.target.value})} style={controlInput} /></div>
              <div><label style={controlLabel}>Aadhaar/PAN Card Rate (₹)</label><input type="number" value={tempPricing.aadhaar} onChange={(e) => setTempPricing({...tempPricing, aadhaar: e.target.value})} style={controlInput} /></div>
              <div><label style={controlLabel}>Passport Photo Rate (₹)</label><input type="number" value={tempPricing.passport} onChange={(e) => setTempPricing({...tempPricing, passport: e.target.value})} style={controlInput} /></div>
            </div>

            {/* 🟢 NEW: PRINTER ROUTING SECTION */}
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>🖨️ Hardware Routing</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#64748b' }}>Make sure your Desktop Agent is running, then scan for USB/Network printers.</p>
                
              <button 
        onClick={handleScanPrinters} 
        style={{ width: '100%', padding: '8px', background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
    >
        {isScanningPrinters ? "⏳ Finding available printers..." : "🔍 Scan Connected Printers"}
    </button>
                {printers.length > 0 && (
                    <div>
                        <label style={controlLabel}>Force Print Jobs To:</label>
                        <select 
                            value={selectedPrinter} 
                            onChange={(e) => {
                                const choice = e.target.value;
                                setSelectedPrinter(choice);
                                localStorage.setItem('saved_printer', choice);
                            }}
                            style={{...controlInput, borderColor: '#3b82f6'}}
                        >
                            <option value="">-- Auto-Select Best Printer --</option>
                            {printers.map((name, idx) => <option key={idx} value={name}>{name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button onClick={() => setIsSettingsOpen(false)} style={{...actionBtn, background: '#f1f5f9', color: '#475569'}}>Cancel</button>
              <button onClick={savePricing} style={{...actionBtn, background: '#16a34a', color: 'white'}}>✅ Save All Settings</button>
            </div>
          </div>
        </div>
      )}
    {/* 🌟 PRINT PASS MODAL */}
      {isPrintModalOpen && (
        <div style={modalOverlay}>
            <div style={modalContent}>
                <h3 style={{marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px'}}>Generate Customer Pass</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', margin: '20px 0'}}>
<input 
    placeholder="ShopName (max20 words)" 
    maxLength={20} 
    onChange={(e) => setPassData({...passData, name: e.target.value})} 
    style={controlInput} 
/>

<input 
    placeholder="Shop Address (max 50 words)" 
    maxLength={50} 
    onChange={(e) => setPassData({...passData, address: e.target.value})} 
    style={controlInput} 
/>

<input 
    placeholder="GPay/PhonePe Number (Optional)" 
    maxLength={10} 
    onChange={(e) => setPassData({...passData, paymentNumber: e.target.value})} 
    style={controlInput} 
/>
                    <div>
                        <label style={controlLabel}>Language</label>
                        <select onChange={(e) => setPassData({...passData, lang: e.target.value})} style={controlInput}>
                            <option value="en">English</option>
                            <option value="te">Telugu</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={() => setIsPrintModalOpen(false)} style={{...actionBtn, background: '#f1f5f9'}}>Cancel</button>
                    <button onClick={() => { handlePrintPass(); setIsPrintModalOpen(false); }} style={{...printBtn, flex: 1, padding: '10px'}}>🖨️ Print Pass</button>
                </div>
            </div>
        </div>
      )}

{/* 🌟 HIDDEN PRINT COMPONENT */}
<div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
    <PrintPass 
        ref={printPassRef} 
        passData={passData} 
        uploadLink={uploadLink} // 🟢 UPDATED: Passing the full upload link
        shopId={auth.shopId}
    />
</div>

      {/* 🌟 5. ANIMATIONS */}
      <style>{`
        @keyframes superScroll { 0% { transform: translate3d(100vw, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
      `}</style>
      {/* 🟢 ULTRA-PREMIUM ANIMATED FOOTER (For all your projects) */}
      <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '25px', position: 'relative' }}>
        <style>
          {`
            /* 1. Sweeping Gradient Shine for the SUBHAMS text */
            @keyframes premium-shine {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
            
            /* 2. Floating and Glowing Animation for the Sparks */
            @keyframes float-sparkle {
              0%, 100% { transform: translateY(0px) scale(0.8); opacity: 0.4; }
              50% { transform: translateY(-4px) scale(1.2); opacity: 1; filter: drop-shadow(0 0 6px #fbbf24); }
            }
            
            /* 3. The Breathing Underline Glow */
            @keyframes line-breathe {
              0%, 100% { width: 30px; opacity: 0.3; }
              50% { width: 60px; opacity: 0.8; box-shadow: 0 0 10px #3b82f6; }
            }

            .subhams-brand-text {
              background: linear-gradient(90deg, #3b82f6, #a855f7, #ec4899, #3b82f6);
              background-size: 200% auto;
              color: transparent;
              -webkit-background-clip: text;
              background-clip: text;
              animation: premium-shine 3.5s linear infinite;
              font-weight: 900;
              font-size: 14px;
              letter-spacing: 2px;
            }
          `}
        </style>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {/* Left Sparkle (Animates instantly) */}
          <span style={{ animation: 'float-sparkle 2s ease-in-out infinite', fontSize: '13px' }}>✨</span>
          
          <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', margin: 0, letterSpacing: '1.5px' }}>
            POWERED BY <span className="subhams-brand-text">SUBHAMS</span>
          </p>
          
          {/* Right Sparkle (Delayed by 1s so they twinkle back and forth) */}
          <span style={{ animation: 'float-sparkle 2s ease-in-out infinite 1s', fontSize: '13px' }}>✨</span>
        </div>

        {/* Beautiful Animated Glowing Underline */}
        <div style={{ 
            height: '3px', 
            background: 'linear-gradient(90deg, transparent, #3b82f6, #a855f7, transparent)', 
            margin: '8px auto 0 auto', 
            borderRadius: '10px',
            animation: 'line-breathe 3s ease-in-out infinite' 
        }}></div>
      </div>
    </div>
       
  );
}

// ==========================================
// 🌟 CONSTANT STYLE OBJECTS
// ==========================================

const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalStyle = { background: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '90%', maxWidth: '420px', textAlign: 'center', border: '1px solid #e2e8f0' };
const downloadBtnStyle = { display: 'inline-block', width: '100%', padding: '15px', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', transition: '0.2s', boxSizing: 'border-box', cursor: 'pointer' };
const closeBtnStyle = { width: '100%', padding: '12px', marginTop: '20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const stepsBoxStyle = { background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'left' };
const stepRow = { display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '15px' };
const stepBadge = { background: '#2563eb', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, marginTop: '2px' };
const navBtn = { padding: '8px 16px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: '#334155' };
const card = { background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' };
const approveBtn = { padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const rejectBtn = { padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const actionBtn = { padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }; 
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

// 🌟 Premium High-Definition Top Bar Styles
const topBarStyle = { 
  position: 'fixed', top: 0, left: 0, width: '100%', height: '46px', 
  background: '#020617', 
  color: '#f8fafc', display: 'flex', alignItems: 'center', zIndex: 1000, 
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 -1px 0 rgba(255, 255, 255, 0.1)',
  borderBottom: '1px solid #1e293b'
};

const clockStyle = { 
  background: '#0f172a', padding: '0 20px', height: '100%', 
  display: 'flex', alignItems: 'center', fontWeight: '800', fontSize: '13px', 
  borderRight: '1px solid #1e293b', fontFamily: "'JetBrains Mono', monospace", 
  letterSpacing: '1px', color: '#38bdf8', textShadow: '0 0 8px rgba(56, 189, 248, 0.5)'
};

const clockIndicatorStyle = { 
  width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', 
  marginRight: '10px', boxShadow: '0 0 8px #10b981', animation: 'pulseGlow 2s infinite ease-in-out' 
};

const marqueeContainer = { 
  flex: 1, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', alignItems: 'center',
  background: 'linear-gradient(90deg, transparent, #020617 5%, #020617 95%, transparent)'
};

const marqueeContent = { 
  whiteSpace: 'nowrap', fontSize: '13px', fontWeight: '500', color: '#f1f5f9',
  letterSpacing: '0.5px', textTransform: 'none', display: 'flex', alignItems: 'center', willChange: 'transform' 
};

const badgeStyle = { 
  position: 'relative', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
  color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: '800', 
  marginRight: '14px', boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)', textTransform: 'none', 
  display: 'inline-flex', alignItems: 'center', gap: '5px' 
};

const badgePulseStyle = { 
  width: '5px', height: '5px', backgroundColor: '#fff', borderRadius: '50%', animation: 'pulseGlow 1.5s infinite' 
};

const textGlowStyle = { 
  color: '#fbbf24', fontWeight: '700', textShadow: '0 0 10px rgba(251, 191, 36, 0.3)', textTransform: 'none'
};