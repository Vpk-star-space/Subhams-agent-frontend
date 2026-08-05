import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import { Html5Qrcode } from 'html5-qrcode'; 
import { io } from 'socket.io-client'; 
import imageCompression from 'browser-image-compression';

// 🟢 Import your auto-switching API and BASE_URL
import api, { BASE_URL } from '../api/api';

const socket = io(BASE_URL, {
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
  const navigate = useNavigate(); 
  
  const [userCode] = useState(getOrCreateUserCode);
  const [shopId, setShopId] = useState(urlShopId || localStorage.getItem('subhams_shopId') || 'guest');
  const [customerName, setCustomerName] = useState(localStorage.getItem('subhams_customerName') || '');
  
  const [shopStatus, setShopStatus] = useState('idle'); 

  const uniqueCustomerName = customerName.trim() ? `${customerName.trim()} #${userCode}` : '';

  const [securityMode, setSecurityMode] = useState('none'); 
  const [securePurpose, setSecurePurpose] = useState('');
  const [maskAadhaar, setMaskAadhaar] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false); // 🟢 NEW: Controls scroll lock
  const [isBlindPreview, setIsBlindPreview] = useState(false);
  const [blindAnim, setBlindAnim] = useState(false); // 🟢 NEW: Animation state for Blind Preview


// ... (Inside your component)
const [isExpanded, setIsExpanded] = useState(false);
  
  const [showSecuritySuccess, setShowSecuritySuccess] = useState(false);
// 🟢 SYSTEM ALERT STATE
  // Toggle 'type' to: 'static', 'scrolling', or 'pulsing'
 // 🟢 SYSTEM ALERT CONTROLLER
  const [sysAlert, setSysAlert] = useState({ 
      show: true, 
      type: 'scrolling', // 'static', 'scrolling', or 'pulsing'
      speed: '23s',      // 👈 SPEED CONTROL: Increase to '35s' or '40s' for slower speed!
      dismissible: true, // 👈 NEW: 'false' hides the X. 'true' shows the X.
      msgEn: "🌟 Welcome to Subhams Secure Print! Upload your files safely and skip the queue.",
      msgTe: "సుభమ్స్ జిరాక్స్‌కు స్వాగతం! మీ ఫైల్స్ ఇక్కడ సురక్షితంగా మరియు వేగంగా ప్రింట్ చేసుకోండి." 
  });
  const todayDate = new Date().toLocaleDateString('en-GB'); 

  const [drawState, setDrawState] = useState({ isDrawing: false, startX: 0, startY: 0, currentX: 0, currentY: 0, currentRect: null });
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedIdTemp, setScannedIdTemp] = useState('');

  const [fileItems, setFileItems] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showMaskWarning, setShowMaskWarning] = useState(false); 
const [ownerName, setOwnerName] = useState('');
  const [idMergeModal, setIdMergeModal] = useState({ open: false, front: null, back: null });
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const [liveStatusTracker, setLiveStatusTracker] = useState(() => {
    const saved = localStorage.getItem('subhams_tracker');
    return saved ? JSON.parse(saved) : {};
  });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [showBootSequence, setShowBootSequence] = useState(() => {
    const hasBooted = sessionStorage.getItem('subhams_booted');
    if (!hasBooted) {
      sessionStorage.setItem('subhams_booted', 'true');
      return true; 
    }
    return false; 
  });

// 🎛️ MASTER CONTROL: Change this one number, and everything else auto-syncs!
  const BOOT_DURATION_MS = 10000; // 40 seconds
  const totalSec = BOOT_DURATION_MS / 1000;

  useEffect(() => {
    if (showBootSequence) {
      const timer = setTimeout(() => {
        setShowBootSequence(false);
      }, BOOT_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [showBootSequence]);

  useEffect(() => {
    localStorage.setItem('subhams_shopId', shopId);
    localStorage.setItem('subhams_customerName', customerName);
    localStorage.setItem('subhams_tracker', JSON.stringify(liveStatusTracker));
  }, [shopId, customerName, liveStatusTracker]);

  useEffect(() => {
      const normalizedShopId = shopId.trim().toUpperCase();
      const isAlreadyOnCorrectPath = window.location.pathname === `/u/${normalizedShopId}`;
      
      if (shopStatus === 'valid' && shopId && !isAlreadyOnCorrectPath) {
          navigate(`/u/${normalizedShopId}`, { replace: true });
      }
  }, [shopId, shopStatus, navigate]);

useEffect(() => {
      const checkShopValidity = async () => {
          if (shopId === 'guest' || shopId.toUpperCase() === 'SUBHAMS-GUEST') {
              setShopStatus('guest');
              return;
          }
          if (!shopId || shopId.length < 5) {
              setShopStatus('idle');
              return;
          }
          
        setShopStatus('checking');
          try {
              const res = await api.get(`/shop/pricing/${shopId}`);
              
              if (res.data.success) {
                  setShopStatus('valid');
                  
              
                  try {
                      const detailRes = await api.get(`/shop/details/${shopId}`);
                    
                      
                      const actualName = detailRes.data.ownerName || detailRes.data.name || detailRes.data.shop?.ownerName;
                   
                      
                      if (actualName && actualName !== 'null') {
                          setOwnerName(actualName); 
                        
                      } else {
                       
                      }
                  } catch (nameErr) {
                    
                  }

              } else {
                  setShopStatus('invalid');
              }
          } catch {
              setShopStatus('invalid');
          }
      };

      const timeoutId = setTimeout(checkShopValidity, 800);
      return () => clearTimeout(timeoutId);
  }, [shopId]);
  const trackerRef = useRef(liveStatusTracker);

  useEffect(() => {
    trackerRef.current = liveStatusTracker;
  }, [liveStatusTracker]);

  useEffect(() => {
    socket.on('CUSTOMER_TRACKER', (data) => {
      setLiveStatusTracker(prev => ({ 
          ...prev, 
          [data.jobId]: { ...(prev[data.jobId] || {}), ...data } 
      }));
    });
    return () => socket.off('CUSTOMER_TRACKER');
  }, []);

  useEffect(() => {
    const joinTrackingRoom = () => {
      if (!socket.connected) {
          socket.connect();
          return; 
      }

      if (shopId && shopId.trim() && uniqueCustomerName && shopStatus === 'valid') {
        const cleanShopId = shopId.toUpperCase().trim();
        socket.emit('JOIN_CUSTOMER', { shopId: cleanShopId, customerName: uniqueCustomerName });

        Object.keys(trackerRef.current).forEach(jobId => {
           socket.emit('REJOIN_TRACKER', { jobId });
        });
      }
    };

    joinTrackingRoom();
    socket.on('connect', joinTrackingRoom);

    const handleWakeUp = () => {
        if (document.visibilityState === 'visible') {
            if (socket.disconnected) {
                socket.connect(); 
            } else {
                joinTrackingRoom(); 
            }
        }
    };
    document.addEventListener('visibilitychange', handleWakeUp);
    return () => {
        socket.off('connect', joinTrackingRoom);
        document.removeEventListener('visibilitychange', handleWakeUp);
    }
  }, [shopId, uniqueCustomerName, shopStatus]);

  useEffect(() => {
      let isComponentMounted = true;
      let html5QrCode;

      if (isScanning && !scanSuccess) {
          html5QrCode = new Html5Qrcode("qr-reader");
          
          html5QrCode.start(
              { facingMode: "environment" }, 
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                  if (isComponentMounted) {
                      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);

                      const extractedId = decodedText.includes('/u/') ? decodedText.split('/u/').pop().toUpperCase() : decodedText.toUpperCase();
                      
                      setScannedIdTemp(extractedId);
                      setScanSuccess(true);
                      
                      setTimeout(() => {
                          setShopId(extractedId); 
                          setScanSuccess(false);
                          setIsScanning(false);
                      }, 1500);
                  }
              },
              () => {} 
          ).catch((err) => {
              console.error("Camera error:", err);
              setIsScanning(false);
          });
      }

      return () => {
          isComponentMounted = false;
          if (html5QrCode && html5QrCode.isScanning) {
              html5QrCode.stop().catch(console.error);
          }
      };
  }, [isScanning, scanSuccess]);
const handleFileChange = async (e) => {
    const rawFiles = Array.from(e.target.files);
    const validItems = [];

    // 🟢 1. Start the 3-second timer right as the process begins
    const processStartTime = Date.now();

    // Show the loading spinner so the user knows the phone is processing
    setIsUploading(true);
    setStatus('🗜️ Optimizing and securing files...');

    for (const f of rawFiles) {
        if (f.size > MAX_FILE_SIZE_BYTES) {
            alert(`❌ FILE TOO LARGE!\n\nYour file "${f.name}" is ${(f.size / 1024 / 1024).toFixed(1)}MB.\nThe maximum limit is 15MB. Please compress the file and try again.`);
            continue; 
        }
        
        let finalFile = f;
        const isImage = f.type.startsWith('image/');

        // 🟢 2. THE FIX: COMPRESS IMAGE BEFORE SAVING TO STATE
        if (isImage) {
            try {
                const options = {
                    maxSizeMB: 0.6,          // Force file under 600KB
                    maxWidthOrHeight: 1800,  // Perfect dimensions for 300 DPI A4 Printing
                    useWebWorker: true,      // Uses background phone power to prevent freezing
                };
                
                // Compress the file using the user's phone RAM!
                const compressedBlob = await imageCompression(f, options);
                
                // Convert back to a File object to keep the original name
                finalFile = new File([compressedBlob], f.name, { type: compressedBlob.type });
            } catch (error) {
                console.error("Compression error:", error);
                // If compression fails, it falls back to the original file
            }
        }

        validItems.push({
            file: finalFile, // 👈 Now using the tiny, compressed file!
            copies: 1,
            colorMode: 'bw',
            scale: 'fit',        
            position: 'top-left', 
            previewUrl: URL.createObjectURL(finalFile),
            isPdf: !isImage,
            maskRectArray: [],
            rotate: 0 
        });
    }

    // 🛑 3. THE 3-SECOND LOCK
    // Check how long compression took. If it was faster than 3 seconds, force it to wait the remaining time!
    const timeElapsed = Date.now() - processStartTime;
    if (timeElapsed < 3000) {
        await new Promise(resolve => setTimeout(resolve, 3000 - timeElapsed));
    }

    // Turn off the loading text ONLY AFTER 3 seconds have passed
    setIsUploading(false);
    setStatus('');

    if (validItems.length === 0) return; 

    const combined = [...fileItems, ...validItems];
    if (combined.length > 5) {
      alert('Maximum 5 files allowed per order.');
      setFileItems(combined.slice(0, 5));
    } else {
      setFileItems(combined);
    }
    
    // Clear the input so they can upload the same file again if needed
    e.target.value = ''; 
  };
const processIdMerge = async () => {
    const { front, back } = idMergeModal;
    if (!front || !back) return alert("Please select both Front and Back sides.");
    
    setIsUploading(true);
    setStatus('⚙️ Merging IDs Side-by-Side...');

    try {
      const loadImage = (file) => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => { const img = new Image(); img.onload = () => resolve(img); img.src = e.target.result; };
          reader.readAsDataURL(file);
      });

      const img1 = await loadImage(front);
      const img2 = await loadImage(back);

      const cardWidth = 800; 
      const cardHeight = 500; 
      const gap = 30; // Space between front and back
      
      const canvas = document.createElement('canvas');
      // 🟢 CHANGE: Double the width, keep height same
      canvas.width = (cardWidth * 2) + gap;
      canvas.height = cardHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Helper function modified to accept X and Y positions
      const drawCover = (img, xPos, yPos) => {
          const imgRatio = img.width / img.height; 
          const targetRatio = cardWidth / cardHeight;
          let sw = img.width, sh = img.height, sx = 0, sy = 0;
          
          if (imgRatio > targetRatio) { sw = img.height * targetRatio; sx = (img.width - sw) / 2; } 
          else { sh = img.width / targetRatio; sy = (img.height - sh) / 2; }
          
          ctx.drawImage(img, sx, sy, sw, sh, xPos, yPos, cardWidth, cardHeight);
      };

      // 🟢 CHANGE: Draw side-by-side (X=0 vs X=cardWidth + gap)
      drawCover(img1, 0, 0); 
      drawCover(img2, cardWidth + gap, 0);

      canvas.toBlob((blob) => {
          const mergedFile = new File([blob], `SideBySide_ID_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          
          setFileItems([...fileItems, { 
              file: mergedFile, 
              copies: 1, 
              colorMode: 'color', 
              scale: 'fit', 
              position: 'top-left', 
              previewUrl: previewUrl, 
              isPdf: false, 
              maskRectArray: [], 
              rotate: 0 
          }]);
          
          setIdMergeModal({ open: false, front: null, back: null });
          setIsUploading(false); 
          setStatus('');
      }, 'image/jpeg', 0.8);

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

  // 🟢 NEW: Function to trigger the Blind View eye-shutter animation
  const handleBlindToggle = (e) => {
      setIsBlindPreview(e.target.checked);
      setBlindAnim(true);
      setTimeout(() => setBlindAnim(false), 400); // Reset after animation plays
  };

  const startDrawing = (e, index) => {
      if (securityMode !== 'private' || !maskAadhaar || fileItems[index].isPdf) return;
      e.preventDefault(); 
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (!clientX || !clientY) return;

      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      
      setDrawState({ isDrawing: true, startX: x, startY: y, currentX: x, currentY: y, currentRect: { x, y, width: 0, height: 0 } });
      if(e.pointerId) e.currentTarget.setPointerCapture(e.pointerId);
  };

  // 🟢 FIX: SMART SWIPE TEXT HIGHLIGHTER
  const keepDrawing = (e) => {
      if (!drawState.isDrawing) return;
      e.preventDefault(); 
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (!clientX || !clientY) return;

      const currentX = ((clientX - rect.left) / rect.width) * 100;
      const currentY = ((clientY - rect.top) / rect.height) * 100;

      const x = Math.max(0, Math.min(drawState.startX, currentX));
      let y = Math.max(0, Math.min(drawState.startY, currentY));

      const width = Math.abs(currentX - drawState.startX);
      let height = Math.abs(currentY - drawState.startY);

      // ✨ The Magic Swipe: If they drag sideways, snap height to a perfect Text Line!
      if (height < 6) {
          height = 5; 
          y = drawState.startY - 2.5; // Centers the box perfectly on their finger
      }

      setDrawState(prev => ({ 
          ...prev, currentX, currentY, 
          currentRect: { 
              x: Math.min(x, 100), 
              y: Math.max(0, Math.min(y, 100)), 
              width: Math.min(width, 100 - x), 
              height: Math.min(height, 100 - y) 
          } 
      }));
  };

 // 🟢 FIX 1: Prevents tiny accidental lines when the user tries to scroll!
  const stopDrawing = (e, index) => {
      // Only save the mask if they actually drew a box bigger than 4% of the screen
      if (drawState.isDrawing && drawState.currentRect && drawState.currentRect.width > 4 && drawState.currentRect.height > 4) {
          const updatedFileItems = [...fileItems];
          updatedFileItems[index].maskRectArray.push(drawState.currentRect);
          setFileItems(updatedFileItems);
      }
      setDrawState({ isDrawing: false, startX: 0, startY: 0, currentX: 0, currentY: 0, currentRect: null });
      if(e.pointerId) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const undoLastMask = (index) => {
      const updatedFileItems = [...fileItems];
      updatedFileItems[index].maskRectArray.pop();
      setFileItems(updatedFileItems);
  };

 // 🟢 FIX 4: Increased slide speed from 2 to 4 so buttons feel highly responsive
  const moveLastMask = (index, direction) => {
      const updated = [...fileItems];
      const masks = updated[index].maskRectArray;
      if (masks.length === 0) return;
      const last = { ...masks[masks.length - 1] };
      if (direction === 'left') last.x = Math.max(0, last.x - 4);
      if (direction === 'right') last.x = Math.min(100 - last.width, last.x + 4);
      if (direction === 'up') last.y = Math.max(0, last.y - 4);
      if (direction === 'down') last.y = Math.min(100 - last.height, last.y + 4);
      masks[masks.length - 1] = last;
      setFileItems(updated);
  };

  const resizeLastMask = (index, type) => {
      const updated = [...fileItems];
      const masks = updated[index].maskRectArray;
      if (masks.length === 0) return;
      const last = { ...masks[masks.length - 1] };
      if (type === 'w+') last.width = Math.min(100 - last.x, last.width + 4);
      if (type === 'w-') last.width = Math.max(4, last.width - 4);
      if (type === 'h+') last.height = Math.min(100 - last.y, last.height + 4);
      if (type === 'h-') last.height = Math.max(4, last.height - 4);
      masks[masks.length - 1] = last;
      setFileItems(updated);
  };
const executeUpload = async () => { 
    setIsUploading(true);
    setStatus('📤 Sending files to Printer queue...');
    setActivePreviewIndex(null); 
    
    let isSuccess = false;

    try {
      for (const item of fileItems) {
          const formData = new FormData();
          formData.append('shopId', shopId.trim()); 
          formData.append('customerName', uniqueCustomerName); 
          formData.append('copies', item.copies); 
          formData.append('colorMode', item.colorMode);
          formData.append('fileName', item.file.name); 
          formData.append('scale', item.scale);
          formData.append('position', item.position);
          formData.append('rotate', item.rotate || 0);
          
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
          
          const response = await api.post('/jobs/upload', formData, {
            headers: {
                'x-subhams-secure-token': import.meta.env.VITE_UPLOAD_TOKEN
            }
          });
          
          setLiveStatusTracker(prev => ({
            ...prev, [response.data.jobId]: { jobId: response.data.jobId, fileName: item.file.name, status: 'SECURED', msg: 'File securely added to queue.' }
          }));
      }
      
      isSuccess = true;

    } catch (err) {
      console.error("Upload Error:", err);
      setStatus(`❌ Error: ${err.response?.data?.message || 'Failed to send files.'}`);
    } finally {
      
      // 🟢 NO MORE FAKE DELAY HERE! We just hide the uploading card instantly.
      setIsUploading(false); 

      // ⏱️ STAGE 2: IF SUCCESSFUL, SHOW SUCCESS FOR 5 SECONDS
      if (isSuccess) {
          setStatus(`✅ Success! Files sent to the printer queue.`);
          setShowSecuritySuccess(true);

          setFileItems([]); 
          setSecurityMode('none'); 
          setSecurePurpose(''); 
          setMaskAadhaar(false); 
          setIsBlindPreview(false);
          
          setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }, 500);

          // Hold success message for 5 full seconds
          setTimeout(() => {
            setShowSecuritySuccess(false);
            setStatus('');
          }, 5000);
      } else {
          setTimeout(() => setStatus(''), 5000);
      }
    }
  };
const handleSubmit = async (e) => { 
    e.preventDefault();

    // 🌟 SMART HELPER: Alerts the user, smoothly scrolls to the missing field, and flashes it red!
    const jumpToField = (elementId, errorMessage) => {
        alert(errorMessage);
        const el = document.getElementById(elementId);
        if (el) {
            // Scroll to the middle of the screen
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus(); // Puts the typing cursor inside the box
            
            // Flash a red glow so they can't miss it
            const originalBorder = el.style.border;
            const originalShadow = el.style.boxShadow;
            
            el.style.transition = 'box-shadow 0.3s, border 0.3s';
            el.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.8)';
            el.style.border = '2px solid #ef4444';
            
            // Remove the red glow after 3 seconds
            setTimeout(() => {
                el.style.boxShadow = originalShadow;
                el.style.border = originalBorder;
            }, 3000);
        }
    };

    // 1. Check Name
    if (!customerName.trim()) {
        return jumpToField('customerNameInput', "Please enter your name.");
    }

    // 2. Check Shop ID
    if (!shopId) {
        return jumpToField('shopIdInput', "Please enter a Shop ID.");
    }
    if (shopStatus === 'invalid') {
        return jumpToField('shopIdInput', "❌ The Shop ID you entered does not exist. Please check it again.");
    }

    // 3. Check Purpose (If security is active)
    if (securityMode !== 'none' && !securePurpose.trim()) {
        return jumpToField('securePurposeInput', "Please enter the purpose of the document to generate the security stamp.");
    }

    // 4. Check Files
    if (fileItems.length === 0) {
        return jumpToField('fileUploadSection', "Please add at least one file.");
    }

    // 5. Check if they forgot to draw masks (Uses your existing Warning Modal)
    if (securityMode === 'private' && maskAadhaar) {
        const forgotToMask = fileItems.some(item => !item.isPdf && item.maskRectArray.length === 0);
        if (forgotToMask) {
            setShowMaskWarning(true);
            return; 
        }
    }

    // If everything is perfectly filled out, execute the upload!
    await executeUpload(); 
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
// 🟢 FIX 1: Bring back the position calculators!
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

 return (
    <div style={containerStyle}>

  {/* 🟢 SYSTEM ALERT BANNER (Seamless Infinite Loop Fix) */}
      {sysAlert.show && (
        <div style={{
            position: sysAlert.type === 'static' ? 'sticky' : 'relative',
            top: sysAlert.type === 'static' ? '0' : 'auto',
            zIndex: sysAlert.type === 'static' ? 999 : 1,
            background: 'linear-gradient(90deg, #ef4444, #f97316)',
            color: 'white', padding: '10px 15px',
            borderRadius: sysAlert.type === 'static' ? '0' : '8px',
            marginBottom: '15px', fontSize: '13px', fontWeight: 'bold',
            boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)',
            overflow: 'hidden',
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: sysAlert.type === 'pulsing' ? 'alert-pulse 1.5s infinite' : 'none'
        }}>
            
            {/* The Scrolling Container */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{
                    display: 'flex',
                    whiteSpace: 'nowrap',
                    width: sysAlert.type === 'scrolling' ? 'max-content' : '100%',
                    animation: sysAlert.type === 'scrolling' ? `alert-scroll ${sysAlert.speed} linear infinite` : 'none',
                    justifyContent: sysAlert.type === 'static' ? 'center' : 'flex-start'
                }}>
                    
                    {sysAlert.type === 'scrolling' ? (
                        <>
                            {/* Block 1 */}
                            <div style={{ display: 'flex', gap: '50px', paddingRight: '50px' }}>
                                <span>🔔 {sysAlert.msgEn}</span>
                                <span>🔔 {sysAlert.msgTe}</span>
                            </div>
                            {/* Block 2 (Seamless clone to prevent empty screen) */}
                            <div style={{ display: 'flex', gap: '50px', paddingRight: '50px' }}>
                                <span>🔔 {sysAlert.msgEn}</span>
                                <span>🔔 {sysAlert.msgTe}</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ width: '100%', textAlign: 'center' }}>
                            <span>🔔 {sysAlert.msgEn} | {sysAlert.msgTe}</span>
                        </div>
                    )}
                    
                </div>
            </div>
            
         {/* ... (rest of your scrolling text code above) ... */}
            
            {/* 🟢 NEW: Close Button only shows if dismissible is TRUE */}
            {sysAlert.dismissible && (
                <button 
                    onClick={() => setSysAlert({ ...sysAlert, show: false })} 
                    style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '15px', flexShrink: 0, zIndex: 10 }}
                >
                    ✖
                </button>
            )}
        </div>
      )}
   
      
      {/* 🟢 NEW UI UPGRADES (Global Styles for animations and elements) */}
      <style>
        {`
      /* 🟢 SEAMLESS SCROLL FIX: No more blank waiting spaces! */
          @keyframes alert-scroll { 
            0% { transform: translateX(0); } 
            100% { transform: translateX(-50%); } 
          }
          @keyframes alert-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

          /* Glassmorphism Header */
          .glass-header {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.9);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border-radius: 16px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
          }
          .text-gradient {
            background: linear-gradient(to right, #2563eb, #9333ea);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          /* Shutter/Eye Blink Animation for Blind Preview */
          @keyframes shutter-blink {
            0% { transform: scaleY(1); opacity: 1; }
            50% { transform: scaleY(0.05); opacity: 0.5; background-color: #000; }
            100% { transform: scaleY(1); opacity: 1; }
          }
          .shutter-animate {
            animation: shutter-blink 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            transform-origin: center;
          }

          /* Animated Badges (Popular / Advanced) */
          .badge {
            position: absolute; 
            top: -12px; right: -5px;
            color: white; font-size: 9px; padding: 3px 8px;
            border-radius: 12px; font-weight: 900;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            z-index: 5;
          }
          .badge-popular {
            background: linear-gradient(135deg, #ef4444, #f97316);
            animation: badge-bounce 2s infinite;
          }
          .badge-advanced {
            background: linear-gradient(135deg, #8b5cf6, #d946ef);
            animation: badge-bounce 2s infinite 1s; /* Delayed start so they don't bounce identically */
          }
          @keyframes badge-bounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-3px) scale(1.05); }
          }

          /* Round Colorful Upload Buttons */
          .upload-circle {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            border-radius: 24px; padding: 22px 10px;
            border: none; cursor: pointer; color: white;
            font-weight: 800; font-size: 14px;
            transition: all 0.2s ease-in-out;
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          }
          .upload-circle:active { transform: scale(0.95); }
          .btn-browse { background: linear-gradient(135deg, #3b82f6, #60a5fa); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35); }
          .btn-camera { background: linear-gradient(135deg, #ec4899, #f472b6); box-shadow: 0 8px 20px rgba(236, 72, 153, 0.35); }
          .btn-smart { 
            background: linear-gradient(135deg, #f59e0b, #fbbf24); 
            box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35); 
            width: 100%; 
            margin-top: 15px; 
            flex-direction: row; 
            gap: 15px; 
            border-radius: 24px; 
            padding: 18px;
          }
        `}
        
      </style>
    {/* 🌟 FULLY AUTO-SYNCED "READING MODE" (2 Highlighted Privacy Guarantees) */}
      {showBootSequence && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 999999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.95)', 
          backdropFilter: 'blur(20px)', 
          WebkitBackdropFilter: 'blur(20px)',
          pointerEvents: 'none',
          overflow: 'hidden',
          /* Auto-calculates fade out to happen 0.5s before React unmounts it */
          animation: `boot-exit 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${totalSec - 0.5}s forwards` 
        }}>
          <style>
            {`
              @keyframes boot-exit {
                0% { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(1.05); visibility: hidden; }
              }
              @keyframes subtle-pulse {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                70% { box-shadow: 0 0 0 40px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
              }
              @keyframes fade-in-up {
                0% { opacity: 0; transform: translateY(15px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              @keyframes progress-load {
                0% { transform: scaleX(0); }
                20% { transform: scaleX(0.3); }
                50% { transform: scaleX(0.7); }
                80% { transform: scaleX(0.9); }
                100% { transform: scaleX(1); }
              }
              @keyframes spin { 
                100% { transform: rotate(360deg); } 
              }
              @keyframes shrink-out { 
                0% { opacity: 1; transform: scale(1); }
                99% { opacity: 0; transform: scale(0); }
                100% { opacity: 0; transform: scale(0); visibility: hidden; display: none; } 
              }
              @keyframes pop-in { 
                0% { opacity: 0; transform: scale(0.5); } 
                100% { opacity: 1; transform: scale(1); } 
              }
              
              .premium-shield-badge {
                width: 90px; height: 90px; border-radius: 50%;
                background: radial-gradient(circle, #064e3b 0%, #022c22 100%);
                display: flex; justify-content: center; align-items: center;
                font-size: 40px; border: 2px solid #10b981;
                animation: subtle-pulse 2s infinite, fade-in-up 0.5s ease-out forwards;
                margin-bottom: 25px;
              }
              
              /* NEW: Highlighted Guarantee Boxes */
              .guarantee-box {
                display: flex; justify-content: space-between; align-items: center;
                background: rgba(16, 185, 129, 0.05);
                border: 1px solid rgba(16, 185, 129, 0.2);
                border-radius: 12px;
                padding: 16px 20px;
                box-shadow: inset 0 0 20px rgba(16, 185, 129, 0.02);
              }
              .guarantee-text {
                color: #e2e8f0; font-size: 15px; font-weight: 500; letter-spacing: 0.3px;
              }
              /* Highlight specific words in green */
              .text-highlight {
                color: #10b981; font-weight: 700;
              }
              
              .mini-spinner {
                width: 18px; height: 18px;
                border: 2px solid rgba(16, 185, 129, 0.15);
                border-top: 2px solid #10b981;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
              }
              .icon-container {
                position: relative; width: 22px; height: 22px; display: flex; justify-content: center; align-items: center;
                margin-left: 15px;
              }
            `}
          </style>

          <div className="premium-shield-badge">🛡️</div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%', maxWidth: '420px' }}>
            
            <h2 style={{ margin: '0 0 8px 0', color: '#ffffff', fontSize: '24px', fontWeight: '800', letterSpacing: '0.5px', animation: 'fade-in-up 0.6s ease-out 0.2s forwards', opacity: 0, textAlign: 'center' }}>
              🛡️ Welcome to Subhams Networks
            </h2>
            
            <p style={{ margin: '0 0 30px 0', color: '#94a3b8', fontSize: '15px', lineHeight: '1.7', textAlign: 'center', animation: 'fade-in-up 0.6s ease-out 0.3s forwards', opacity: 0 }}>
              Please review our strict privacy rules before starting.
            </p>

            {/* 2 HIGHLIGHTED GUARANTEE BOXES */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', animation: 'fade-in-up 0.6s ease-out 0.4s forwards', opacity: 0 }}>

              <div className="guarantee-box">
                <span className="guarantee-text">
                  <span className="text-highlight">Blocking downloads</span> & unauthorized views 🛡️
                </span>
                <div className="icon-container">
                  {/* Checks off at 40% of the total time */}
                  <div style={{ position: 'absolute', animation: `shrink-out 0.2s ease-in ${totalSec * 0.4 - 0.1}s forwards` }}><div className="mini-spinner"></div></div>
                  <span style={{ position: 'absolute', opacity: 0, fontSize: '18px', animation: `pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${totalSec * 0.4}s forwards` }}>✅</span>
                </div>
              </div>

              <div className="guarantee-box">
                <span className="guarantee-text">
                  <span className="text-highlight">Auto-deleting</span> after print or 10 mins 🗑️
                </span>
                <div className="icon-container">
                  {/* Checks off at 80% of the total time */}
                  <div style={{ position: 'absolute', animation: `shrink-out 0.2s ease-in ${totalSec * 0.8 - 0.1}s forwards` }}><div className="mini-spinner"></div></div>
                  <span style={{ position: 'absolute', opacity: 0, fontSize: '18px', animation: `pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${totalSec * 0.8}s forwards` }}>✅</span>
                </div>
              </div>

            </div>

            <p style={{ margin: '0 0 10px 0', color: '#10b981', fontSize: '11px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', animation: 'fade-in-up 0.6s ease-out 0.6s forwards', opacity: 0 }}>
              AUTO-STARTING SECURE SESSION
            </p>

            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', animation: 'fade-in-up 0.6s ease-out 0.7s forwards', opacity: 0 }}>
              <div style={{ 
                height: '100%', 
                background: '#10b981', 
                borderRadius: '10px', 
                transformOrigin: 'left',
                /* Auto-calculates progress bar duration to match the total time */
                animation: `progress-load ${totalSec - 0.5}s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                boxShadow: '0 0 8px #10b981'
              }}></div>
            </div>

          </div>
        </div>
      )}

    {/* 🌟 PREMIUM MOBILE SECURITY OVERLAY (Triggers on Upload Success) */}
      {showSecuritySuccess && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
        }}>
          <style>
            {`
              @keyframes lock-drop {
                0% { transform: translateY(-50px) scale(0.5); opacity: 0; }
                50% { transform: translateY(10px) scale(1.1); opacity: 1; }
                100% { transform: translateY(0) scale(1); opacity: 1; filter: drop-shadow(0 0 30px rgba(56, 189, 248, 0.8)); }
              }
              @keyframes pulse-ring-mobile {
                0% { transform: scale(0.5); opacity: 0.8; border-width: 15px; }
                100% { transform: scale(3); opacity: 0; border-width: 0px; }
              }
              @keyframes slide-text-up {
                0% { transform: translateY(20px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
              }
              @keyframes scan-line {
                0% { top: -10%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 110%; opacity: 0; }
              }
              .mobile-sec-box {
                animation: lock-drop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              }
            `}
          </style>

          <div style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', border: 'solid #38bdf8', animation: 'pulse-ring-mobile 1.5s ease-out infinite' }}></div>
          <div style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', border: 'solid #818cf8', animation: 'pulse-ring-mobile 1.5s ease-out 0.4s infinite' }}></div>

          <div className="mobile-sec-box" style={{
            position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'radial-gradient(circle, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            padding: '40px 30px', borderRadius: '30px', border: '2px solid #38bdf8',
            boxShadow: 'inset 0 0 30px rgba(56, 189, 248, 0.4), 0 20px 40px rgba(0,0,0,0.5)',
            width: '85%', maxWidth: '340px', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', left: 0, width: '100%', height: '4px', background: '#38bdf8', boxShadow: '0 0 15px #38bdf8', animation: 'scan-line 2s linear infinite' }}></div>

            <div style={{ fontSize: '80px', marginBottom: '10px' }}>🔒</div>
            
            <h2 style={{ margin: '0 0 5px 0', color: '#bae6fd', fontSize: '22px', fontWeight: '900', letterSpacing: '1px', textAlign: 'center', animation: 'slide-text-up 0.5s ease-out 0.3s forwards', opacity: 0, lineHeight: '1.3' }}>
              Files Securely Delivered!
            </h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', textAlign: 'center', animation: 'slide-text-up 0.5s ease-out 0.4s forwards', opacity: 0, lineHeight: '1.5' }}>
              Your documents are encrypted and waiting at the shop.
            </p>

            {/* 🟢 UPDATED: Shop Info Box with Owner Name & ID */}
            <div style={{ 
              marginTop: '20px', 
              padding: '12px 20px', 
              background: 'rgba(56, 189, 248, 0.08)', 
              borderRadius: '16px', 
              border: '1px dashed rgba(56, 189, 248, 0.5)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px', 
              animation: 'slide-text-up 0.5s ease-out 0.45s forwards', 
              opacity: 0,
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🏪</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
                <span style={{ fontSize: '10px', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Successfully Sent To</span>
                
                {/* BIG OWNER NAME */}
                <span style={{ fontSize: '17px', color: '#ffffff', fontWeight: '900', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {(ownerName && ownerName !== 'null') ? ownerName : 'Verified Shop'}
                </span>
                
                {/* SMALLER SHOP ID */}
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', marginTop: '2px' }}>
                  ID: {shopId}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '20px', background: 'rgba(56, 189, 248, 0.1)', padding: '8px 15px', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.3)', animation: 'slide-text-up 0.5s ease-out 0.5s forwards', opacity: 0 }}>
              <div style={{ width: '8px', height: '8px', background: '#38bdf8', borderRadius: '50%', boxShadow: '0 0 10px #38bdf8' }}></div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#7dd3fc', letterSpacing: '0.5px' }}>PRIVACY GUARD ACTIVE</span>
            </div>
          </div>
        </div>
      )}
      

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

      {showMaskWarning && (
        <div style={modalOverlay}>
          <div style={{...modalContent, border: '3px solid #ef4444', textAlign: 'center'}}>
            <div style={{fontSize: '50px', marginBottom: '10px'}}>⚠️</div>
            <h3 style={{marginTop: 0, color: '#991b1b'}}>Wait! You Forgot to Mask</h3>
            <p style={{fontSize: '14px', color: '#b91c1c', fontWeight: 'bold', marginBottom: '10px'}}>
              మీరు 'Mask' ఆప్షన్ సెలెక్ట్ చేశారు, కానీ ఇమేజ్‌పై ఎక్కడా బ్లాక్ బాక్స్ గీయలేదు!
            </p>
            <p style={{fontSize: '12px', color: '#475569', marginBottom: '20px', lineHeight: '1.5'}}>
              You enabled masking but didn't draw any masks. The shopkeeper will see your full document. If you trust them, click Send. Otherwise, go back and draw the masks.
            </p>
            <div style={{display: 'flex', gap: '10px'}}>
              <button onClick={() => setShowMaskWarning(false)} style={{...actionBtn, background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', flex: 1}}>
                ⬅️ Go Back 
              </button>
              <button onClick={() => { setShowMaskWarning(false); executeUpload(); }} style={{...actionBtn, background: '#ef4444', color: 'white', flex: 1}}>
                Send Anyway ➡️
              </button>
            </div>
          </div>
        </div>
      )}

    {/* 🟢 3. TEXT-ONLY SCANNING LOGO */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <style>{`
          @keyframes text-scan-sweep {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .scan-text-logo {
            background: linear-gradient(90deg, #1e293b 0%, #1e293b 40%, #38bdf8 50%, #1e293b 60%, #1e293b 100%);
            background-size: 200% auto;
            color: transparent;
            -webkit-background-clip: text;
            background-clip: text;
            animation: text-scan-sweep 3s linear infinite;
            font-size: 26px;
            font-weight: 900;
            margin: 0 0 5px 0;
          }
        `}</style>
        <h2 className="scan-text-logo"> Subhams Xerox</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>Mobile Fast Print Portal ⚡</p>
      </div>

      <div style={{...sectionCard, marginBottom: '15px'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{...labelStyle, marginBottom: 0}}>Your Name / మీ పేరు</label>
            {customerName && <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>ID: #{userCode}</span>}
        </div>
       <input type="text" id="customerNameInput" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} placeholder="Enter your name" required />
      </div>

      <div style={{...sectionCard, marginBottom: '15px'}}>
        <label style={labelStyle}>Shop ID / షాప్ ID</label>
        {isScanning ? (
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {scanSuccess ? (
                <div style={{ width: '100%', maxWidth: '300px', aspectRatio: '1 / 1', background: '#10b981', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
                    <div style={{ fontSize: '70px', marginBottom: '10px' }}>✅</div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>Connected!</h3>
                    <p style={{ fontWeight: 'bold', fontSize: '16px', margin: 0, opacity: 0.9 }}>Shop {scannedIdTemp}</p>
                </div>
            ) : (
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' }}>Point camera at Shop QR Code</span>
            )}
            
            <div id="qr-reader" style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', overflow: 'hidden', border: '3px solid #3b82f6', background: '#000', display: scanSuccess ? 'none' : 'block' }}></div>
            
            {!scanSuccess && (
                <button onClick={() => { setScanSuccess(false); setIsScanning(false); }} style={{ width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', marginTop: '20px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel Scanner</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" id="shopIdInput" placeholder="SUBHAMS-XXXXXX" 
                maxLength={14} 
                value={shopId.startsWith('SUBHAMS-') ? shopId : 'SUBHAMS-' + shopId.replace('SUBHAMS-', '')} 
                onChange={(e) => {
                    let val = e.target.value.toUpperCase();
                    
                    if (!val.startsWith('SUBHAMS-')) {
                        if ('SUBHAMS-'.startsWith(val)) {
                            setShopId("SUBHAMS-");
                            return;
                        }
                        val = 'SUBHAMS-' + val.replace('SUBHAMS-', '');
                    }

                    let userPart = val.replace('SUBHAMS-', '');
                    userPart = userPart.slice(0, 6);

                    setShopId('SUBHAMS-' + userPart);
                }} 
                style={{
                    ...inputStyle, 
                    flex: 1, 
                    fontWeight: 'bold', 
                    color: shopStatus === 'invalid' ? '#ef4444' : '#2563eb',
                    borderColor: shopStatus === 'invalid' ? '#ef4444' : (shopStatus === 'valid' ? '#10b981' : '#cbd5e1')
                }} 
            />
              <button type="button" style={qrBtnStyle} onClick={() => setIsScanning(true)}>📷 Scan QR</button>
            </div>
            
            {shopStatus === 'checking' && <span style={{ fontSize: '12px', color: '#64748b' }}>⏳ Verifying Shop ID...</span>}
           {shopStatus === 'valid' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '5px' }}>
                    <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 'bold', marginBottom: '6px' }}>
                        ✅ Shop Found & Ready!
                    </span>
                    
                    {/* 🟢 THE TRUST BADGE: Combines Name and Unique ID to prevent confusion */}
                    <div style={{ background: '#dcfce3', padding: '6px 12px', borderRadius: '8px', border: '1px solid #86efac', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)' }}>
                        <span style={{ fontSize: '16px' }}>🏪</span>
                        <span style={{ fontSize: '14px', color: '#166534', fontWeight: '900', textTransform: 'uppercase' }}>
                            {(ownerName && ownerName !== 'null') ? ownerName : 'Verified Shop'}
                        </span>
                        {/* Highlights the unique ID so they know it is the EXACT right shop */}
                        <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', background: '#bbf7d0', padding: '3px 6px', borderRadius: '4px', border: '1px solid #86efac' }}>
                            {shopId}
                        </span>
                    </div>
                </div>
            )}
           {shopStatus === 'invalid' && shopId.length > 0 && (
            <span style={{ fontSize: '12px', color: '#e11d48', fontWeight: 'bold' }}>  
                ⚠️ Hello Dear! Welcome to Subhams Networks! It is an Invalid Shop ID. Please enter a valid Shop ID or use the QR scanner.
            </span>
            )}

            {shopStatus === 'guest' && (
                <span style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: 'bold' }}> 
                    🎉 Hello Dear! Welcome to Subhams Networks! Please enter a valid Shop ID or use the QR scanner.
                </span>
            )}
          </div>
        )}
      </div>

      <div style={{...sectionCard, background: securityMode !== 'none' ? '#f0fdf4' : '#fff', border: securityMode !== 'none' ? '2px solid #22c55e' : '1px solid #e2e8f0'}}>
        <h4 style={{ margin: '0 0 10px 0', color: '#166534', fontSize: '14px' }}>🛡️ Document Privacy Guard</h4>
        
      {/* 🟢 1. BLIND PREVIEW SHUTTER FIX & ICON */}
        <div className={blindAnim ? 'shutter-animate' : ''} style={{ marginBottom: '15px', background: isBlindPreview ? '#fee2e2' : '#f8fafc', padding: '10px', borderRadius: '8px', border: isBlindPreview ? '1px solid #ef4444' : '1px solid #e2e8f0', transition: '0.3s' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: isBlindPreview ? '#991b1b' : '#334155' }}>
                <input type="checkbox" checked={isBlindPreview} onChange={handleBlindToggle} style={{ width: '18px', height: '18px' }} />
                {isBlindPreview ? '🔒' : '👁️'} Blind Preview (Hide document details from shopkeeper)
            </label>
            <p style={{fontSize: '11px', color: '#64748b', marginTop: '5px', margin: 0}}>Shopkeeper will only see a softly blurred outline to adjust position, ensuring absolute privacy without breaking alignment.</p>
        </div>
        
        {/* 🟢 3. ANIMATED POPULAR & ADVANCED BADGES ON TOP OF BUTTONS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button type="button" onClick={() => setSecurityMode('none')} style={{...securityBtn, background: securityMode === 'none' ? '#334155' : '#f1f5f9', color: securityMode === 'none' ? 'white' : '#64748b'}}>
                Standard
            </button>
            <div style={{ position: 'relative', flex: 1 }}>
                <span className="badge badge-popular">🔥 POPULAR</span>
                <button type="button" onClick={() => setSecurityMode('govt')} style={{...securityBtn, width: '100%', background: securityMode === 'govt' ? '#2563eb' : '#f1f5f9', color: securityMode === 'govt' ? 'white' : '#64748b'}}>
                    🏛️ Govt/Bank
                </button>
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
                <span className="badge badge-advanced">✨ ADVANCED</span>
                <button type="button" onClick={() => setSecurityMode('private')} style={{...securityBtn, width: '100%', background: securityMode === 'private' ? '#ea580c' : '#f1f5f9', color: securityMode === 'private' ? 'white' : '#64748b'}}>
                    🏢 Private Use
                </button>
            </div>
        </div>

        {securityMode !== 'none' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <label style={{...labelStyle, color: securityMode === 'govt' ? '#1e40af' : '#c2410c'}}>
                        {securityMode === 'govt' ? 'Name of Bank/Govt (For Attestation Box)' : 'Purpose of ID (For Watermark & Attestation)'}
                    </label>
                   <input type="text" id="securePurposeInput" placeholder={securityMode === 'govt' ? "e.g., HDFC Bank, RTO Office" : "e.g., Hotel Check-in, Jio SIM"}
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

{/* HEADER & TOGGLE BUTTON - PREMIUM STYLE */}
<div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: isExpanded ? '20px' : '0',
    transition: 'margin 0.3s ease'
}}>

    
    <button 
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseOver={(e) => {
            e.target.style.backgroundColor = '#e2e8f0';
            e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
            e.target.style.backgroundColor = '#f1f5f9';
            e.target.style.transform = 'translateY(0)';
        }}
        style={{ 
            background: '#f1f5f9', 
            border: '1px solid #e2e8f0', // Added subtle border
            padding: '8px 16px', 
            borderRadius: '10px', // More modern rounding
            fontSize: '12px', 
            fontWeight: '700', 
            color: '#475569', 
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth animation
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        }}
    >
        {isExpanded ? (
            <>▲ Hide Details</>
        ) : (
            <>▼ View Details</>
        )}
    </button>
</div>

     <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', paddingBottom: '20px' }}>
        
        <style>
          {`
            @keyframes shield-glow {
              0%, 100% { 
                transform: scale(1); 
                filter: drop-shadow(0 0 0px rgba(79, 70, 229, 0)); 
              }
              50% { 
                transform: scale(1.15); 
                filter: drop-shadow(0 0 10px rgba(79, 70, 229, 0.7));
              }
            }
            .shield-icon {
              display: inline-block;
              animation: shield-glow 2.5s infinite ease-in-out;
              transform-origin: center center;
            }

            @keyframes text-shine {
              0% { background-position: 0% center; }
              100% { background-position: 200% center; }
            }
            .sparkle-text {
              background: linear-gradient(to right, #4f46e5, #ec4899, #ea580c, #4f46e5);
              background-size: 200% auto;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              animation: text-shine 3s linear infinite;
              font-weight: 900;
            }
              /* 🟢 NEW: Animated Border Line Style */
            @keyframes border-glow-spin {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animated-border-wrap {
              border-radius: 14px;
              background: linear-gradient(90deg, #3b82f6, #ec4899, #f59e0b, #3b82f6);
              background-size: 300% 300%;
              animation: border-glow-spin 3s linear infinite;
              padding: 3px; /* This creates the animated border line */
              cursor: pointer;
            }
            .inner-btn {
              width: 100%; height: 100%; box-sizing: border-box;
              background: #f1f5f9; border-radius: 11px;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              color: #475569; font-weight: bold; font-size: 13px; padding: 18px 10px; border: none;
            }
              /* 🟢 4A. ANIMATED BORDER STYLES */
          @keyframes border-glow-spin {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .border-wrap-browse {
            border-radius: 14px; padding: 3px; cursor: pointer;
            background: linear-gradient(90deg, #cbd5e1, #94a3b8, #cbd5e1);
            background-size: 300% 300%; animation: border-glow-spin 3s linear infinite;
          }
          .border-wrap-camera {
            border-radius: 14px; padding: 3px; cursor: pointer;
            background: linear-gradient(90deg, #93c5fd, #3b82f6, #93c5fd);
            background-size: 300% 300%; animation: border-glow-spin 3s linear infinite;
          }
          .border-wrap-smart {
            border-radius: 14px; padding: 3px; cursor: pointer; margin-top: 10px;
            background: linear-gradient(90deg, #fde68a, #f59e0b, #fde68a);
            background-size: 300% 300%; animation: border-glow-spin 3s linear infinite;
          }
          .old-inner-btn {
            width: 100%; height: 100%; box-sizing: border-box; border-radius: 11px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            border: none; color: #475569; font-weight: bold; font-size: 13px; padding: 20px 10px;
          }
          `}
        </style>
        
{/* 🌟 HIGH-TECH UPLOAD CARD (Guaranteed 3 Seconds Minimum) */}
      {isUploading && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
        }}>
            <style>{`
                @keyframes spin-ring-fast { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes spin-ring-slow { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
                @keyframes pulse-rocket { 0%, 100% { transform: scale(0.9) translateY(0); opacity: 0.8; } 50% { transform: scale(1.1) translateY(-5px); opacity: 1; filter: drop-shadow(0 0 10px #38bdf8); } }
            `}</style>

            <div style={{
                background: '#1e293b',
                borderRadius: '16px',
                padding: '25px 20px',
                width: '90%',
                maxWidth: '340px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                border: '1px solid #334155',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center'
            }}>
                <div style={{ position: 'relative', width: '70px', height: '70px', marginBottom: '15px' }}>
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(56, 189, 248, 0.1)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', inset: '4px', border: '3px solid transparent', borderTopColor: '#38bdf8', borderRightColor: '#38bdf8', borderRadius: '50%', animation: 'spin-ring-fast 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }}></div>
                    <div style={{ position: 'absolute', inset: '12px', border: '2px solid transparent', borderBottomColor: '#818cf8', borderLeftColor: '#818cf8', borderRadius: '50%', animation: 'spin-ring-slow 1.5s linear infinite' }}></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', animation: 'pulse-rocket 2s infinite' }}>🚀</div>
                </div>

                <h3 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '18px', fontWeight: '800' }}>
                    Optimizing & Uploading...
                </h3>

                {/* 🟢 WHITE & GREEN BADGE FOR OWNER NAME */}
                <div style={{ 
                    background: '#ffffff', 
                    padding: '12px', 
                    borderRadius: '10px', 
                    marginBottom: '15px', 
                    width: '100%', 
                    border: '2px solid #22c55e', 
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
                    textAlign: 'center'
                }}>
                    {shopId ? (
                        <>
                            <p style={{ margin: '0 0 4px 0', color: '#166534', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                ✅ Securely Sending To:
                            </p>
                          <p style={{ margin: 0, color: '#15803d', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase' }}>
                                {/* 🟢 COMPLETELY REMOVED shopData. Only checks the ownerName state! */}
                                {(ownerName && ownerName !== 'null') ? ownerName : 'VERIFIED SHOP'}
                            </p>
                            <p style={{ margin: '4px 0 0 0', color: '#166534', fontSize: '12px', fontWeight: 'bold' }}>
                                Shop ID: {shopId}
                            </p>
                        </>
                    ) : (
                        <p style={{ margin: 0, color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>
                            ⚠️ No Shop Selected
                        </p>
                    )}
                </div>
                
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
                    Processing on your device for privacy.<br/>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Please do not close this window.</span>
                </p>
            </div>
        </div>
      )}
{/* EXPANDABLE PREMIUM CONTENT - Only shows when expanded */}
{isExpanded && (
    <div style={{ 
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px' // Increased spacing for premium feel
    }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        
        {/* 1. BLIND PREVIEW & STANDARD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>👁️</span>
                <div>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>Blind Preview</strong>
                    <span style={{ fontSize: '13px', color: '#475569' }}>Files are blurred on the shop screen (Shop owner cannot see content).</span>
                    <i style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>బ్లైండ్ ప్రివ్యూ: షాపు వారి స్క్రీన్‌పై మీ ఫైల్స్ బ్లర్ గా ఉంటాయి.</i>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📄</span>
                <div>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>Standard</strong>
                    <span style={{ fontSize: '13px', color: '#475569' }}>Normal print for standard documents.</span>
                    <i style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>స్టాండర్డ్: సాధారణ జెరాక్స్ కాపీల కోసం.</i>
                </div>
            </div>
        </div>

        {/* 2. POPULAR (GOVT/BANK) - Bold Border */}
        <div style={{ 
            background: '#f0fdf4', 
            border: '1px solid #bbf7d0', 
            padding: '15px', 
            borderRadius: '12px' 
        }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '900', color: '#065f46' }}>🔥 POPULAR: Govt / Bank Use</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: '1.5' }}>
                Automatic declaration box generation based on your purpose.<br/>
                <i style={{ color: '#16a34a' }}>ప్రభుత్వ/బ్యాంక్ పనుల కోసం: డిక్లరేషన్ బాక్స్ ఆటోమేటిక్‌గా యాడ్ అవుతుంది.</i>
            </p>
        </div>

        {/* 3. ADVANCED (PRIVATE) - Bold Border */}
        <div style={{ 
            background: '#eff6ff', 
            border: '1px solid #bfdbfe', 
            padding: '15px', 
            borderRadius: '12px' 
        }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '900', color: '#1e40af' }}>✨ ADVANCED: Private Use</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#1e3a8a', lineHeight: '1.5' }}>
                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Mask Sensitive Data:</span> Swipe to hide details.
                <br/> <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Ghost Watermark:</span> Strong tamper-proof protection.
                <br/> 
                <i style={{ color: '#3b82f6', marginTop: '8px', display: 'block' }}>ప్రైవేట్ ఉపయోగం: డేటాను మాస్క్ చేయవచ్చు. 'గోస్ట్ వాటర్‌మార్క్' ద్వారా భద్రత ఉంటుంది.</i>
            </p>
        </div>

        {/* ⚠️ PDF WARNING */}
        <div style={{ 
            background: '#fff7ed', 
            border: '1px dashed #fdba74', 
            padding: '12px', 
            borderRadius: '10px',
            textAlign: 'center' 
        }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9a3412', fontWeight: '700' }}>
                ⚠️ Note: Advanced features work only with Images (JPG, PNG).
            </p>
        </div>
    </div>
)}

 <div style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
            border: '1px solid #a5b4fc', 
            borderRadius: '12px', 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', // Changed to column to stack the features
            gap: '12px', 
            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.15)'
        }}>
            
            {/* ✨ PART 1: COPY CONTROL */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div className="shield-icon" style={{ fontSize: '35px' }}>🛡️</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#1e293b' }}>
                        <span className="sparkle-text">✨ YOU control the copies! Click </span>
                        <span style={{ background: '#2563eb', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-block', fontWeight: 'bold' }}>⚙️ Adjust</span>
                        <span className="sparkle-text"> after uploading to set your exact copies and sizes.</span>
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: '#475569' }}>
                        <span className="sparkle-text">✨ గమనిక: ఫైల్ అప్‌లోడ్ చేసిన తర్వాత </span>
                        <span style={{ background: '#2563eb', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-block', fontWeight: 'bold' }}>⚙️ Adjust</span>
                        <span className="sparkle-text"> పై క్లిక్ చేసి మీకు ఎన్ని కాపీలు కావాలో మీరే సెట్ చేసుకోండి.</span>
                    </p>
                </div>
            </div>

            {/* 〰️ ELEGANT DIVIDER */}
            <div style={{ 
                height: '1px', 
                background: 'linear-gradient(90deg, transparent, #c7d2fe, transparent)',
                margin: '4px 0'
            }} />

      {/* 🔒 PART 2: MILITARY-GRADE SECURITY GUARANTEE */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ fontSize: '32px' }}>🔒</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: '#4338ca', fontWeight: '700' }}>
                       System Security Guarantee: Military-grade encryption & auto-deletion ensures your files are safe and private.

                    </p>
                    
                    <p style={{ margin: 0, fontSize: '11.5px', lineHeight: '1.5', color: '#334155' }}>
                        Subhams <span style={{ color: '#ef4444', fontWeight: 'bold' }}>never views, downloads, or shares</span> your files. 
                        Data is strictly delivered to the shop and <strong style={{ color: '#ef4444' }}>permanently auto-deleted</strong> 
                        the second it prints (or within <span style={{ color: '#ef4444', fontWeight: 'bold' }}>10 minutes</span> if unprinted). 
                        Your privacy is our ultimate priority.
                    </p>
                    
                    <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.5', color: '#64748b' }}>
                        <strong style={{color: '#475569'}}>పూర్తి భద్రత:</strong> సుభమ్స్ సిస్టమ్ మీ ఫైల్స్‌ను <span style={{ color: '#ef4444', fontWeight: 'bold' }}>ఎప్పుడూ చూడదు లేదా సేవ్ చేయదు</span>. 
                        ప్రింట్ అయిన వెంటనే లేదా <span style={{ color: '#ef4444', fontWeight: 'bold' }}>10 నిమిషాల</span> తర్వాత మీ డేటా <strong style={{ color: '#ef4444' }}>పూర్తిగా డిలీట్</strong> అవుతుంది.
                    </p>
                </div>
            </div>
        </div>
{/* 🟢 4B. BULLETPROOF MOBILE FILE UPLOADERS */}
        <div id="fileUploadSection" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          
          {/* 📁 BROWSE FILES BUTTON */}
          <div className="border-wrap-browse" style={{ position: 'relative', overflow: 'hidden' }}>
            <button type="button" className="old-inner-btn" style={{ background: '#f1f5f9', width: '100%', pointerEvents: 'none' }}>
              <span style={{ fontSize: '24px', marginBottom: '5px' }}>📁</span> Browse Files
            </button>
            <input 
              type="file" 
              multiple 
              accept=".pdf,image/*" 
              onChange={handleFileChange} 
              style={{ 
                position: 'absolute', 
                inset: 0, 
                opacity: 0, 
                width: '100%', 
                height: '100%', 
                cursor: 'pointer',
                zIndex: 10 
              }} 
            />
          </div>
          
          {/* 📸 TAKE PHOTO BUTTON */}
          <div className="border-wrap-camera" style={{ position: 'relative', overflow: 'hidden' }}>
            <button type="button" className="old-inner-btn" style={{ background: '#eff6ff', width: '100%', pointerEvents: 'none' }}>
              <span style={{ fontSize: '24px', marginBottom: '5px' }}>📸</span> Take Photo
            </button>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              multiple 
              onChange={handleFileChange} 
              style={{ 
                position: 'absolute', 
                inset: 0, 
                opacity: 0, 
                width: '100%', 
                height: '100%', 
                cursor: 'pointer',
                zIndex: 10 
              }} 
            />
          </div>
          
        </div>
        <div className="border-wrap-smart" onClick={() => setIdMergeModal({open: true, front: null, back: null})}>
          <button type="button" className="old-inner-btn" style={{ background: '#fef3c7', flexDirection: 'row', gap: '10px', padding: '15px' }}>
            <span style={{ fontSize: '28px' }}>🪪</span>
            <div style={{textAlign: 'left'}}>
              <span style={{fontWeight: 'bold', color: '#b45309', display: 'block', fontSize: '14px'}}>Smart ID Merge</span>
              <span style={{fontSize: '11px', color: '#92400e'}}>Combine Front & Back instantly</span>
            </div>
          </button>
        </div>

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
                                    <div style={{ width: '100%', padding: '30px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                                        <h3 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>PDF Uploaded</h3>
                                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px 0' }}>Mobile browsers block embedded PDFs for security. Tap below to view your file.</p>
                                        <a href={item.previewUrl} target="_blank" rel="noreferrer" style={{ background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block' }}>
                                            ↗️ Open PDF in Browser
                                        </a>
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        
                                     
                                        
                                        {securityMode === 'private' && maskAadhaar && (
                                            <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#1e293b', textAlign: 'center' }}>
                                                    Mask Tools / మాస్క్ సాధనాలు
                                                </p>
                                                
                                                {/* 🟢 FIX 1: Buttons are now stacked with a gap to prevent accidental mistouches! */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                                                    style={{
                                                        width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: '0.2s',
                                                        marginBottom: '10px', /* 👈 Big gap to protect the user */
                                                        background: isDrawingMode ? '#10b981' : '#f1f5f9',
                                                        color: isDrawingMode ? 'white' : '#475569',
                                                        boxShadow: isDrawingMode ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                                    }}
                                                >
                                                    {isDrawingMode ? '✅ Drawing Mode ON (Swipe to mask)' : '✏️ Enable Drawing (డ్రాయింగ్ మోడ్)'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newRect = { x: 30, y: 45, width: 40, height: 10 };
                                                        const updated = [...fileItems];
                                                        updated[index].maskRectArray.push(newRect);
                                                        setFileItems(updated);
                                                    }}
                                                    style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                                                >
                                                    ➕ Add Mask / మాస్క్ బాక్స్ జోడించండి
                                                </button>
                                                {item.maskRectArray.length > 0 && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                                                            <button type="button" onClick={() => moveLastMask(index, 'left')} style={controlBtn}>⬅️</button>
                                                            <button type="button" onClick={() => moveLastMask(index, 'up')} style={controlBtn}>⬆️</button>
                                                            <button type="button" onClick={() => moveLastMask(index, 'down')} style={controlBtn}>⬇️</button>
                                                            <button type="button" onClick={() => moveLastMask(index, 'right')} style={controlBtn}>➡️</button>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                                                            <button type="button" onClick={() => resizeLastMask(index, 'w-')} style={sizeBtn}>Narrow</button>
                                                            <button type="button" onClick={() => resizeLastMask(index, 'w+')} style={sizeBtn}>Wider</button>
                                                            <button type="button" onClick={() => resizeLastMask(index, 'h-')} style={sizeBtn}>Slim</button>
                                                            <button type="button" onClick={() => resizeLastMask(index, 'h+')} style={sizeBtn}>Tall</button>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => undoLastMask(index)} 
                                                            style={{ marginTop: '5px', padding: '6px', background: '#fee2e2', color: '#991b1b', border: '1px solid #ef4444', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', width: '100%' }}
                                                        >
                                                            ↩️ Undo Last Box
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                       {/* 🟢 FIX: Outer A4 Paper Wrapper. Properly uses Flexbox so position grid works! */}
                                        <div style={{ 
                                            width: '100%', 
                                            aspectRatio: '1 / 1.414', 
                                            background: '#f8fafc', 
                                            borderRadius: '4px', 
                                            position: 'relative', 
                                            overflow: 'hidden', 
                                            boxSizing: 'border-box',
                                            padding: (securityMode === 'govt' || securityMode === 'private') ? '6px' : '0', 
                                            border: (securityMode === 'govt' || securityMode === 'private') ? '2px solid #0f172a' : '1px solid #cbd5e1',
                                            display: 'flex', 
                                            alignItems: getAlign(item.position), 
                                            justifyContent: getJustify(item.position)
                                        }}>
                                            {/* 🟢 FIX: Inner Image Wrapper accurately matches the Fit/Aadhaar Scale dimensions */}
                                            <div style={{ 
                                                ...getImgSize(item.scale), 
                                                position: 'relative',
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center'
                                            }}>
                                             <div 
                                                 onPointerDown={(e) => isDrawingMode && startDrawing(e, index)}
                                                 onPointerMove={keepDrawing}
                                                 onPointerUp={(e) => stopDrawing(e, index)}
                                                 onPointerCancel={(e) => stopDrawing(e, index)}
                                                 style={{ 
                                                     position: 'relative', 
                                                     width: '100%', height: '100%',
                                                     display: 'inline-block',
                                                     touchAction: isDrawingMode ? 'none' : 'auto', 
                                                     cursor: isDrawingMode ? 'crosshair' : 'default',
                                                     userSelect: 'none', WebkitUserSelect: 'none'
                                                 }}
                                             >
                                                 {/* 🟢 Ensures the image fills the EXACT shape of the Aadhaar/Fit box so masks stick perfectly! */}
                                                 <img 
                                                     src={item.previewUrl} 
                                                     alt="Preview" 
                                                     style={{
                                                         display: 'block', width: '100%', height: '100%', objectFit: 'fill',
                                                         filter: `${item.colorMode === 'bw' ? 'grayscale(100%) ' : ''}${isBlindPreview ? 'blur(4px) ' : ''}`.trim() || 'none',
                                                         transform: `rotate(${item.rotate || 0}deg)`,
                                                         pointerEvents: 'none', userSelect: 'none' 
                                                     }} 
                                                     draggable={false} 
                                                 />
                                                 {/* 🟢 FIX 3: SMART "MASKED" TEXT SIZING */}
                                                 {item.maskRectArray.map((rect, rectIndex) => (
                                                     <div key={rectIndex} style={{
                                                         position: 'absolute', left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%`,
                                                         backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                         borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', pointerEvents: 'none' 
                                                     }}>
                                                         <span style={{ 
                                                             color: 'rgba(255,255,255,0.6)', 
                                                             fontWeight: '900', letterSpacing: '1px',
                                                             /* Mathematical formula to dynamically scale the font based on the box height! */
                                                             fontSize: `clamp(6px, ${Math.max(6, rect.height * 1.8)}px, 24px)`,
                                                             whiteSpace: 'nowrap'
                                                         }}>
                                                             MASKED
                                                         </span>
                                                     </div>
                                                 ))}

                                                 {/* Active Drawing Box (also with Smart Text) */}
                                                 {drawState.isDrawing && drawState.currentRect && (
                                                      <div style={{
                                                         position: 'absolute', left: `${drawState.currentRect.x}%`, top: `${drawState.currentRect.y}%`, width: `${drawState.currentRect.width}%`, height: `${drawState.currentRect.height}%`,
                                                         backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '2px dashed #38bdf8', pointerEvents: 'none',
                                                         display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                                     }}>
                                                         <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '900', fontSize: `clamp(6px, ${Math.max(6, drawState.currentRect.height * 1.8)}px, 24px)`}}>MASKED</span>
                                                     </div>
                                                 )}

                                                 {/* HD Magnifier Glass */}
                                                 {drawState.isDrawing && drawState.currentRect && (
                                                     <div style={{
                                                         position: 'absolute', left: `calc(${drawState.currentX}% - 60px)`, top: `calc(${drawState.currentY}% - 140px)`, 
                                                         width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #3b82f6', overflow: 'hidden', zIndex: 50,
                                                         boxShadow: '0 8px 25px rgba(0,0,0,0.6), inset 0 0 15px rgba(0,0,0,0.2)', background: '#fff', pointerEvents: 'none'
                                                     }}>
                                                         <div style={{
                                                             position: 'absolute', width: '250%', height: '250%', 
                                                             left: `calc(-${drawState.currentX * 2.5}% + 60px)`, top: `calc(-${drawState.currentY * 2.5}% + 60px)`
                                                         }}>
                                                             <img src={item.previewUrl} style={{ width: '100%', height: '100%', display: 'block', transform: `rotate(${item.rotate || 0}deg)` }} />
                                                             <div style={{
                                                                 position: 'absolute', left: `${drawState.currentRect.x}%`, top: `${drawState.currentRect.y}%`, width: `${drawState.currentRect.width}%`, height: `${drawState.currentRect.height}%`,
                                                                 backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '2px dashed #38bdf8'
                                                             }}></div>
                                                         </div>
                                                         <div style={{position: 'absolute', top: '50%', left: '0', width: '100%', height: '1px', background: 'rgba(239, 68, 68, 0.6)'}}></div>
                                                         <div style={{position: 'absolute', top: '0', left: '50%', width: '1px', height: '100%', background: 'rgba(239, 68, 68, 0.6)'}}></div>
                                                     </div>
                                                 )}
                                             </div>
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
                                )}
                              </div>

                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                                    {!item.isPdf && (
                                        <div>
                                            <label style={labelStyle}>Rotate</label>
                                            <button 
                                                type="button" 
                                                onClick={() => updateItemSetting(index, 'rotate', ((item.rotate || 0) + 90) % 360)} 
                                                style={{...inputStyle, padding: '6px', background: '#e0e7ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 'bold', cursor: 'pointer', height: '33px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                            >
                                                ↻ {item.rotate || 0}°
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {!item.isPdf && (
                                    <>
                                        <div style={{ marginTop: '5px' }}>
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

// --- Styles ---
const containerStyle = { maxWidth: '450px', margin: '0 auto', padding: '20px', fontFamily: "'Inter', sans-serif", background: '#f8fafc', minHeight: '100vh', position: 'relative' };
const sectionCard = { background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', background: '#f8fafc', boxSizing: 'border-box' };
const qrBtnStyle = { padding: '0 15px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' };
const removeBtnStyle = { background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const submitBtn = { width: '100%', padding: '18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' };
const statusBox = { marginTop: '20px', padding: '15px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' };
const securityBtn = { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: '0.2s' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContent = { background: 'white', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const mergeBtnStyle = { width: '100%', padding: '15px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: '#1e293b' };
const actionBtn = { padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const controlBtn = { padding: '10px 5px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const sizeBtn = { padding: '10px 5px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', color: '#92400e' };
const trackerContainerStyle = { marginTop: '30px', background: '#fff', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderRadius: '12px', overflow: 'hidden' };
const trackerHeader = { background: '#2563eb', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '15px' };
const orderCard = { background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const timelineContainer = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '15px 0' };
const stepStyle = (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: active ? 1 : 0.4, transition: 'opacity 0.3s' });
const circleStyle = (active) => ({ width: '24px', height: '24px', borderRadius: '50%', background: active ? '#16a34a' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', boxShadow: active ? '0 0 8px rgba(22, 163, 74, 0.4)' : 'none', transition: 'all 0.3s' });
const lineStyle = (active) => ({ flex: 1, height: '3px', background: active ? '#16a34a' : '#e2e8f0', margin: '0 8px', marginTop: '-18px', transition: 'background 0.3s' });
const stepLabel = { fontSize: '10px', marginTop: '6px', fontWeight: 'bold', color: '#334155' };
const statusMsg = { fontSize: '12px', color: '#475569', marginTop: '10px', fontStyle: 'italic', borderTop: '1px solid #e2e8f0', paddingTop: '8px', lineHeight: '1.4' };