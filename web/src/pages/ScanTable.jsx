import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import { 
  QrCode, 
  Camera, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  Play,
  Square
} from 'lucide-react';

export default function ScanTable() {
  const navigate = useNavigate();
  const { setTableSession } = useTableOrder();
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  
  const html5QrRef = useRef(null);
  const fileInputRef = useRef(null);
  const isStartingRef = useRef(false);

  // Helper to extract table number from any QR text / url / json
  const parseTableNumber = (text) => {
    if (!text) return null;
    const clean = String(text).trim();

    // 1. URL search param e.g. ?table=05 or &table=5
    const urlMatch = clean.match(/[?&]table=(\d{1,2})/i);
    if (urlMatch) return urlMatch[1];

    // 2. URL path e.g. /table/05 or /menu/05 or smartdine://table/5
    const pathMatch = clean.match(/(?:table|menu)\/(\d{1,2})/i);
    if (pathMatch) return pathMatch[1];

    // 3. Text label e.g. "Table 05" or "Table 5" or "T-05" or "T05"
    const labelMatch = clean.match(/(?:table|t)[\s-]*(\d{1,2})/i);
    if (labelMatch) return labelMatch[1];

    // 4. Pure digits e.g. "05" or "5"
    const digitMatch = clean.match(/^(\d{1,2})$/);
    if (digitMatch) return digitMatch[1];

    // 5. JSON string e.g. {"table": 5}
    try {
      const parsed = JSON.parse(clean);
      if (parsed.table) return String(parsed.table);
    } catch {}

    return null;
  };

  // Connect table and redirect directly to menu
  const handleConnectTable = (tableNum) => {
    const tableId = parseTableNumber(tableNum);
    if (!tableId) {
      toast.error('Invalid table code. Please scan a valid Smart Dine table QR.');
      return;
    }

    const formatted = String(tableId).padStart(2, '0');
    
    // Stop camera safely
    stopCamera();

    // Set table in context & localStorage
    setTableSession(formatted);

    // Confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    toast.success(`🍽️ Table ${formatted} Connected! Opening menu...`, {
      duration: 2500,
      icon: '✨'
    });

    setTimeout(() => {
      navigate(`/menu?table=${formatted}`, { replace: true });
    }, 300);
  };

  // Start Camera
  const startCamera = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraLoading(true);
    setScanError('');

    try {
      // If already running, stop first
      if (html5QrRef.current) {
        try {
          await html5QrRef.current.stop();
        } catch {}
        html5QrRef.current = null;
      }

      // Small delay to ensure DOM element is ready and measured
      await new Promise(r => setTimeout(r, 150));

      const elem = document.getElementById('qr-reader');
      if (!elem) {
        throw new Error('Camera display container not found.');
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minDim * 0.75);
          return { width: size, height: size };
        },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          const table = parseTableNumber(decodedText);
          if (table) {
            handleConnectTable(table);
          } else {
            setScanError(`Scanned code "${decodedText.slice(0, 30)}" is not a valid table QR.`);
          }
        },
        () => {} // frame without QR
      );

      setIsCameraActive(true);
      setCameraLoading(false);
      isStartingRef.current = false;
    } catch (err) {
      console.warn('Camera start error:', err);
      setIsCameraActive(false);
      setCameraLoading(false);
      isStartingRef.current = false;
      setScanError(
        'Camera not available or access denied. Please click "Open Scanner" or allow camera permissions.'
      );
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
      } catch {}
      html5QrRef.current = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
    isStartingRef.current = false;
  };

  // Upload QR Image
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tempScanner = new Html5Qrcode('qr-reader-file-temp');
      const decodedText = await tempScanner.scanFile(file, true);
      const table = parseTableNumber(decodedText);

      if (table) {
        handleConnectTable(table);
      } else {
        toast.error(`QR Code detected, but no table info found.`);
      }
    } catch (err) {
      toast.error('No readable QR code found in this photo.');
    } finally {
      e.target.value = '';
    }
  };

  // Lifecycle: Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF8ED] text-[#24140D] relative flex flex-col items-center justify-center p-4 py-8 overflow-hidden font-sans">
      
      {/* Hidden file scanner element */}
      <div id="qr-reader-file-temp" className="hidden"></div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="relative z-10 w-full max-w-md space-y-5">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Link to="/" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#F4B942] shadow-sm hover:border-[#E8752A] transition group">
              <img 
                src="/logo.png" 
                alt="Smart Dine Logo" 
                className="w-7 h-7 rounded-full object-cover border border-[#F4B942] shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="font-black text-base text-[#24140D] tracking-tight">Smart Dine</span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#24140D] tracking-tight">
            Scan Your Dining Table QR
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5B50] max-w-sm mx-auto">
            Point your camera at the QR code standee on your table to open digital menu.
          </p>
        </div>

        {/* Main QR Scanner Card */}
        <div className="rounded-3xl bg-white border border-[#F4B942]/40 shadow-xl overflow-hidden p-4 sm:p-6 space-y-4">
          
          {/* Camera Viewport Frame */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[320px] flex items-center justify-center shadow-inner">
            
            {/* Real QR Reader DOM Node */}
            <div 
              id="qr-reader" 
              className="w-full min-h-[320px] bg-black flex items-center justify-center overflow-hidden"
            ></div>

            {/* Laser HUD Overlay when streaming */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                
                {/* Glowing Bounding Box */}
                <div className="relative w-56 h-56 border-2 border-[#F4B942]/80 rounded-2xl shadow-[0_0_30px_rgba(244,185,66,0.35)]">
                  {/* Top-Left Corner */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#E8752A] rounded-tl-lg"></div>
                  {/* Top-Right Corner */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#E8752A] rounded-tr-lg"></div>
                  {/* Bottom-Left Corner */}
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#E8752A] rounded-bl-lg"></div>
                  {/* Bottom-Right Corner */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#E8752A] rounded-br-lg"></div>

                  {/* Center Crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border border-[#F4B942] rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 bg-[#E8752A] rounded-full"></div>
                    </div>
                  </div>

                  {/* Animated Laser Scanning Beam */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F4B942] to-transparent shadow-[0_0_15px_#F4B942] animate-bounce"></div>
                </div>

                {/* HUD Status Pill */}
                <div className="absolute bottom-3 px-3.5 py-1 rounded-full bg-black/80 border border-[#F4B942]/40 text-[11px] font-bold text-[#F4B942] flex items-center gap-1.5 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-[#E8752A] animate-ping"></span>
                  <span>Align camera with table QR</span>
                </div>
              </div>
            )}

            {/* Camera Offline / Click to Launch overlay */}
            {!isCameraActive && !cameraLoading && (
              <div 
                onClick={() => startCamera()}
                className="absolute inset-0 bg-[#24140D]/95 flex flex-col items-center justify-center p-6 text-center space-y-3 cursor-pointer group hover:bg-[#3B2115] transition duration-200"
              >
                <div className="w-24 h-24 rounded-3xl bg-[#FFF8ED]/10 border-2 border-dashed border-[#F4B942] flex items-center justify-center text-[#F4B942] group-hover:scale-110 transition-transform shadow-[0_0_25px_rgba(244,185,66,0.25)]">
                  <Camera className="w-12 h-12 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white group-hover:text-[#F4B942] transition">
                    Tap to Scan Table QR
                  </h3>
                  <p className="text-xs text-[#FFF8ED]/80 max-w-xs mx-auto">
                    Tap anywhere inside this viewfinder to scan your dining table standee QR.
                  </p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-[#F4B942] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-[#F4B942] font-bold">Opening camera stream...</p>
              </div>
            )}
          </div>

          {/* Error message */}
          {scanError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#D32F2F] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D32F2F]" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Control Action Buttons */}
          <div className="pt-1">
            {isCameraActive ? (
              <button
                type="button"
                onClick={stopCamera}
                className="w-full py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-[#D32F2F] text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Camera Scanner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FFF8ED] hover:bg-[#E8752A] hover:text-white border border-[#F4B942] text-[#3B2115] text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ImageIcon className="w-4 h-4 text-[#E8752A]" />
                <span>Upload Table QR Photo</span>
              </button>
            )}
          </div>

        </div>

        {/* Info Badges */}
        <div className="grid grid-cols-2 gap-3 text-[11px] text-[#6B5B50] font-semibold">
          <div className="p-3 rounded-2xl bg-white border border-[#F4B942]/30 flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
            <span>Instant table auto-connect</span>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#F4B942]/30 flex items-center gap-2 shadow-sm">
            <Zap className="w-4 h-4 text-[#E8752A] shrink-0" />
            <span>Direct digital royal ordering</span>
          </div>
        </div>

      </div>

    </div>
  );
}
