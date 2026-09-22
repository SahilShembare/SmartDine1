import React from 'react';
import { X, FileDown, Image as ImageIcon, Printer, ShieldCheck } from 'lucide-react';
import { downloadBillAsPdf, downloadBillAsJpg, printBill } from '../utils/billReceipt';

export default function BillDownloadModal({ isOpen, onClose, receipt }) {
  if (!isOpen || !receipt) return null;

  const invNo = receipt.invoiceNumber || 'INV-2026-001';
  const tblNo = receipt.tableNumber || '01';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Download Bill Invoice</h3>
              <p className="text-[10px] text-slate-400">Table {tblNo} • {invNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Choose your preferred format to save your verified restaurant bill receipt:
        </p>

        {/* Download Format Options */}
        <div className="grid grid-cols-1 gap-2.5">
          
          {/* 1. PDF Option */}
          <button
            type="button"
            onClick={() => {
              downloadBillAsPdf(receipt);
              onClose();
            }}
            className="w-full p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/40 text-slate-200 transition flex items-center justify-between group cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-rose-950/70 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-rose-900/60 transition">
                PDF
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-rose-400 transition flex items-center gap-1.5">
                  <span>Download PDF Document</span>
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.2 rounded">Official</span>
                </p>
                <p className="text-[11px] text-slate-400">Standard printable tax invoice file (.pdf)</p>
              </div>
            </div>
            <FileDown className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition" />
          </button>

          {/* 2. JPG Option */}
          <button
            type="button"
            onClick={() => {
              downloadBillAsJpg(receipt);
              onClose();
            }}
            className="w-full p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 text-slate-200 transition flex items-center justify-between group cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-amber-900/60 transition">
                JPG
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-amber-400 transition flex items-center gap-1.5">
                  <span>Download Bill Image (JPG)</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded">WhatsApp</span>
                </p>
                <p className="text-[11px] text-slate-400">Pure white high-resolution receipt photo (.jpg)</p>
              </div>
            </div>
            <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition" />
          </button>

          {/* 3. Direct Print */}
          <button
            type="button"
            onClick={() => {
              printBill(receipt);
              onClose();
            }}
            className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Printer className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
              <span className="text-xs font-bold text-slate-300 group-hover:text-white">Print to Physical Printer</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Instant</span>
          </button>

        </div>

        {/* Security / Quality Assurance */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 border-t border-slate-800">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official GST Registered Invoice</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
