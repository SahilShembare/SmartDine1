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

  // Successful table detection handler
  const handleTableFound = (rawText) => {
    const tableNum = parseTableNumber(rawText);
    if (tableNum) {
      const formatted = String(tableNum).padStart(2, '0');
      stopCamera();
      setTableSession(formatted);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
      toast.success(`🎉 Connected to Table ${formatted}! Opening digital menu...`, { duration: 2500 });
      setTimeout(() => {
        navigate(`/menu?table=${formatted}`);
      }, 500);
      return true;
    }
    return false;
  };

  // Start back camera
  const startCamera = async () => {
    if (isCameraActive || isStartingRef.current) return;
    setScanError('');
    setCameraLoading(true);
    isStartingRef.current = true;

    try {
      if (!html5QrRef.current) {
        html5QrRef.current = new Html5Qrcode('qr-reader');
      }

      await html5QrRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          if (handleTableFound(decodedText)) {
            // Found and redirected
          }
        },
        () => {
          // Frame read callback (ignore non-scanned frames)
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera stream error:', err);
      setScanError('Could not access device camera. Please grant camera permission or upload a photo of the QR.');
    } finally {
      setCameraLoading(false);
      isStartingRef.current = false;
    }
  };

  // Stop camera
  const stopCamera = async () => {
    if (html5QrRef.current && isCameraActive) {
      try {
        await html5QrRef.current.stop();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
      setIsCameraActive(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError('');
    setCameraLoading(true);

    try {
      const fileScanner = new Html5Qrcode('qr-reader-file-temp');
      const result = await fileScanner.scanFile(file, true);
      fileScanner.clear();

      if (!handleTableFound(result)) {
        setScanError('QR code detected, but could not identify a valid SmartDine Table number.');
      }
    } catch (err) {
      setScanError('Could not read QR code from image. Please ensure image is clear and well-lit.');
    } finally {
      setCameraLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 py-12 overflow-hidden bg-slate-950 text-slate-100 font-sans">
      
      {/* Background Image: Matching Home & Login */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/restaurant-bg.jpg" 
          alt="SmartDine Restaurant Interior" 
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-slate-950/95"></div>
      </div>

      {/* Hidden file scanner element */}
      <div id="qr-reader-file-temp" className="hidden"></div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="relative z-10 w-full max-w-md space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Link to="/" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-md hover:border-amber-400/50 transition group">
              <img 
                src="/logo.png" 
                alt="Smart Dine Logo" 
                className="w-7 h-7 rounded-full object-cover border border-amber-400/60 shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="font-black text-base text-white tracking-tight">Smart Dine</span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
            Scan Your Table QR
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
            Point your camera at the QR code standee on your table to open the live digital menu.
          </p>
        </div>

        {/* Main QR Scanner Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-md overflow-hidden p-4 sm:p-6 space-y-4">
          
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
                <div className="relative w-56 h-56 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.35)]">
                  {/* Top-Left Corner */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-lg"></div>
                  {/* Top-Right Corner */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-lg"></div>
                  {/* Bottom-Left Corner */}
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-lg"></div>
                  {/* Bottom-Right Corner */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-lg"></div>

                  {/* Center Crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border border-amber-400 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                  </div>

                  {/* Animated Laser Scanning Beam */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#F59E0B] animate-bounce"></div>
                </div>

                {/* HUD Status Pill */}
                <div className="absolute bottom-3 px-3.5 py-1 rounded-full bg-black/80 border border-amber-400/40 text-[11px] font-bold text-amber-300 flex items-center gap-1.5 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                  <span>Align camera with table QR</span>
                </div>
              </div>
            )}

            {/* Camera Offline / Click to Launch overlay */}
            {!isCameraActive && !cameraLoading && (
              <div 
                onClick={() => startCamera()}
                className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center space-y-3 cursor-pointer group hover:bg-slate-900 transition duration-200"
              >
                <div className="w-24 h-24 rounded-3xl bg-white/10 border-2 border-dashed border-amber-400/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                  <Camera className="w-12 h-12 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition">
                    Tap to Scan Table QR
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto">
                    Tap anywhere inside this viewfinder to scan your dining table standee QR.
                  </p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-amber-300 font-bold">Opening camera stream...</p>
              </div>
            )}
          </div>

          {/* Error message */}
          {scanError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Control Action Buttons */}
          <div className="pt-1">
            {isCameraActive ? (
              <button
                type="button"
                onClick={stopCamera}
                className="w-full py-3 px-4 rounded-2xl bg-red-600/30 hover:bg-red-600/40 border border-red-500/40 text-red-300 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Camera Scanner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-glow"
              >
                <ImageIcon className="w-4 h-4 text-white" />
                <span>Upload Table QR Photo</span>
              </button>
            )}
          </div>

        </div>

        {/* Info Badges */}
        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-300 font-semibold">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Instant table connect</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 shadow-sm">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Direct digital ordering</span>
          </div>
        </div>

      </div>

    </div>
  );
}
