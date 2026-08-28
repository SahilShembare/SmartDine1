import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import { 
  QrCode, 
  Camera, 
  ScanLine, 
  ChefHat, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  UtensilsCrossed
} from 'lucide-react';

// Generate 25 unique tables
const ALL_TABLES = Array.from({ length: 25 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return { id: num, label: `Table ${num}` };
});

export default function ScanTable() {
  const navigate = useNavigate();
  const { setTableSession, currentTable } = useTableOrder();
  const { currentUser } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [manualTable, setManualTable] = useState('');
  const [showManual, setShowManual] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  // If already have a table, offer to continue
  useEffect(() => {
    if (currentTable) {
      setScanResult(currentTable);
    }
  }, [currentTable]);

  // Start Camera QR Scanner
  const startScanner = async () => {
    setScanError('');
    setScanResult(null);
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Parse table number from QR URL
          const match = decodedText.match(/[?&]table=(\d{1,2})/i);
          if (match) {
            const tableNum = match[1].padStart(2, '0');
            const tableExists = ALL_TABLES.find(t => t.id === tableNum);
            if (tableExists) {
              html5QrCode.stop().catch(() => {});
              setScanResult(tableNum);
              setScanning(false);
              toast.success(`✅ Table ${tableNum} scanned successfully!`);
            } else {
              setScanError(`Table ${tableNum} not found. Please scan a valid table QR.`);
            }
          } else {
            setScanError('Invalid QR code. Please scan a Smart Dine table QR.');
          }
        },
        () => {} // Ignore scan failures (no QR in frame)
      );
    } catch (err) {
      setScanning(false);
      setScanError('Camera access denied or not available. Please use manual table selection.');
    }
  };

  // Stop Scanner
  const stopScanner = () => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {});
    }
    setScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Handle manual table selection
  const handleManualSelect = (tableId) => {
    setScanResult(tableId);
    setShowManual(false);
    toast.success(`✅ Table ${tableId} selected!`);
  };

  // Proceed to menu with selected table
  const proceedToMenu = () => {
    if (scanResult) {
      setTableSession(scanResult);
      toast.success(`🍽️ Welcome to Table ${scanResult}! Browse the menu & order.`);
      navigate(`/menu?table=${scanResult}`);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 py-8 overflow-hidden bg-slate-950 font-sans">
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/restaurant-bg.jpg" 
          alt="Smart Dine Restaurant" 
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-slate-950/95"></div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="Smart Dine Logo"
              className="w-16 h-16 rounded-full object-cover border-2 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Scan Your Table QR
          </h1>
          <p className="text-sm text-slate-400">
            {currentUser?.displayName ? `Welcome, ${currentUser.displayName}! ` : ''}
            Scan the QR code on your table to start ordering
          </p>
        </div>

        {/* QR Scanner Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Scanner Result - Table Found */}
          {scanResult ? (
            <div className="p-6 space-y-5">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-black text-white">Table {scanResult}</h2>
                  <p className="text-sm text-emerald-400 font-semibold mt-1">QR Verified • Ready to Order</p>
                </div>
              </div>

              {/* Table Info Strip */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-white">Table {scanResult}</span>
                </div>
                <span className="text-xs text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  ● Active
                </span>
              </div>

              {/* Proceed Button */}
              <button
                onClick={proceedToMenu}
                className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(251,191,36,0.35)] transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>View Menu & Start Ordering</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Scan Different Table */}
              <button
                onClick={() => { setScanResult(null); setScanError(''); }}
                className="w-full text-center text-xs text-slate-400 hover:text-white font-semibold cursor-pointer transition"
              >
                Scan a different table
              </button>
            </div>
          ) : (
            <>
              {/* Camera Scanner View */}
              <div className="relative">
                <div 
                  id="qr-reader" 
                  ref={scannerRef}
                  className={`w-full ${scanning ? 'min-h-[300px]' : 'h-0 overflow-hidden'}`}
                ></div>

                {!scanning && (
                  <div className="p-8 flex flex-col items-center space-y-5">
                    {/* Scanner Icon Animation */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 border-2 border-dashed border-emerald-500/40 animate-pulse"></div>
                      <div className="relative z-10 w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        <QrCode className="w-8 h-8 text-emerald-400" />
                      </div>
                      {/* Scanning line animation */}
                      <div className="absolute top-2 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce"></div>
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-white">Ready to Scan</h3>
                      <p className="text-xs text-slate-400">
                        Point your camera at the QR code on your dining table
                      </p>
                    </div>

                    {/* Start Scanner Button */}
                    <button
                      onClick={startScanner}
                      className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Open Camera & Scan QR</span>
                    </button>
                  </div>
                )}

                {scanning && (
                  <div className="p-4">
                    <button
                      onClick={stopScanner}
                      className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs border border-red-500/40 transition cursor-pointer"
                    >
                      Stop Scanner
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {scanError && (
                <div className="mx-4 mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Divider */}
              <div className="px-6 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-800"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Or select manually</span>
                  <div className="flex-1 h-px bg-slate-800"></div>
                </div>
              </div>

              {/* Manual Table Selection */}
              <div className="p-4 pt-2 space-y-3">
                <button
                  onClick={() => setShowManual(!showManual)}
                  className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>{showManual ? 'Hide Table List' : 'Choose Table Manually'}</span>
                </button>

                {showManual && (
                  <div className="grid grid-cols-5 gap-2 max-h-[240px] overflow-y-auto pr-1">
                    {ALL_TABLES.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => handleManualSelect(table.id)}
                        className="py-3 rounded-xl bg-slate-800 hover:bg-amber-400/20 hover:border-amber-400/50 text-white text-xs font-black border border-slate-700 transition cursor-pointer flex flex-col items-center gap-0.5"
                      >
                        <span className="text-base">{table.id}</span>
                        <span className="text-[9px] text-slate-400 font-medium">Table</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-2">
          <p className="text-[11px] text-slate-500 font-medium">
            Each table has a unique QR code • 25 tables available
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
            <Sparkles className="w-3 h-3 text-amber-400/60" />
            <span>Smart Dine — Smart Choice, Great Experience!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
