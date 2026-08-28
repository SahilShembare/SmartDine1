import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { useTableOrder } from '../context/TableOrderContext';
import { localStore, isFirebaseConfigured, db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { 
  Plus, 
  QrCode, 
  Printer, 
  Download, 
  ExternalLink, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Sparkles,
  UtensilsCrossed,
  Users
} from 'lucide-react';

export default function AdminTables() {
  const { tables, setTables } = useTableOrder();
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [baseUrl, setBaseUrl] = useState(() => {
    return window.location.origin || 'https://smartdine.netlify.app';
  });

  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '4',
    location: 'Main Dining Hall',
    active: true
  });

  const getQRUrl = (tableNum) => {
    const formatted = String(tableNum).padStart(2, '0');
    return `${baseUrl}/menu?table=${formatted}`;
  };

  const getDeepLink = (tableNum) => {
    const formatted = String(tableNum).padStart(2, '0');
    return `smartdine://table/${formatted}`;
  };

  const handleOpenAdd = () => {
    setEditingTable(null);
    const nextNum = String(tables.length + 1).padStart(2, '0');
    setFormData({
      tableNumber: nextNum,
      capacity: '4',
      location: 'Main Dining Hall',
      active: true
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity || '4',
      location: table.location || 'Main Dining Hall',
      active: table.active !== undefined ? table.active : true
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedNum = String(formData.tableNumber).padStart(2, '0');
    const tableData = {
      tableNumber: formattedNum,
      capacity: parseInt(formData.capacity) || 4,
      location: formData.location.trim(),
      active: formData.active,
      qrUrl: getQRUrl(formattedNum),
      deepLink: getDeepLink(formattedNum),
      updatedAt: new Date().toISOString()
    };

    if (editingTable) {
      if (isFirebaseConfigured) {
        await updateDoc(doc(db, 'tables', editingTable.id), tableData);
      } else {
        const updated = tables.map(t => t.id === editingTable.id ? { ...t, ...tableData } : t);
        setTables(updated);
        localStore.saveTables(updated);
      }
    } else {
      tableData.createdAt = new Date().toISOString();
      if (isFirebaseConfigured) {
        await addDoc(collection(db, 'tables'), tableData);
      } else {
        const newTable = { id: `table-${Date.now()}`, ...tableData };
        const updated = [...tables, newTable];
        setTables(updated);
        localStore.saveTables(updated);
      }
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this table?')) {
      if (isFirebaseConfigured) {
        await deleteDoc(doc(db, 'tables', id));
      } else {
        const updated = tables.filter(t => t.id !== id);
        setTables(updated);
        localStore.saveTables(updated);
      }
    }
  };

  const toggleTableActive = async (table) => {
    const newStatus = !table.active;
    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'tables', table.id), { active: newStatus });
    } else {
      const updated = tables.map(t => t.id === table.id ? { ...t, active: newStatus } : t);
      setTables(updated);
      localStore.saveTables(updated);
    }
  };

  // Download QR Code as image
  const downloadQR = (tableNum) => {
    const canvas = document.getElementById(`qr-canvas-${tableNum}`);
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `SmartDine_Table_${tableNum}_QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950">
      <div className="no-print">
        <Sidebar mode="admin" />
      </div>

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        
        {/* Top Header */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Table & QR Code Manager
              <span className="p-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30">
                <QrCode className="w-5 h-5" />
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Generate, preview, download, and print table standees for customer contactless ordering
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Print All Standees</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs shadow-glow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
          </div>
        </div>

        {/* Base URL customizer notice */}
        <div className="no-print p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            <span className="text-slate-200 font-semibold">QR Code Target Domain: </span>
            <code className="text-orange-400 font-mono bg-slate-800 px-2 py-0.5 rounded">{baseUrl}/menu?table=XX</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Custom Domain:</span>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500 w-56 font-mono"
            />
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => {
            const qrTarget = getQRUrl(table.tableNumber);
            return (
              <div
                key={table.id}
                className="qr-card-print rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-orange-500/50 shadow-lg"
              >
                
                {/* Standee Header */}
                <div className="p-4 bg-gradient-to-r from-slate-900 via-orange-950/20 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white">SMART DINE</h3>
                      <p className="text-[10px] text-slate-400">{table.location || 'Dine-In Area'}</p>
                    </div>
                  </div>

                  <div className="px-3 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-extrabold text-sm tracking-wider">
                    TABLE {table.tableNumber}
                  </div>
                </div>

                {/* QR Code Display Card */}
                <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-white rounded-2xl shadow-xl inline-block border-2 border-orange-500/30">
                    <QRCodeSVG
                      value={qrTarget}
                      size={160}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f97316'><path d='M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z'/></svg>",
                        height: 28,
                        width: 28,
                        excavate: true,
                      }}
                    />
                    {/* Hidden canvas for downloading PNG */}
                    <div className="hidden">
                      <QRCodeCanvas
                        id={`qr-canvas-${table.tableNumber}`}
                        value={qrTarget}
                        size={512}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-200">
                      Scan to Browse & Order
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-1 break-all max-w-[240px]">
                      {qrTarget}
                    </p>
                    <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {table.capacity || 4} Seats
                      </span>
                      <span>•</span>
                      <span className={table.active !== false ? 'text-emerald-400' : 'text-red-400'}>
                        {table.active !== false ? 'Active Table' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table Actions */}
                <div className="no-print p-3.5 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => downloadQR(table.tableNumber)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                      title="Download High-Res PNG QR"
                    >
                      <Download className="w-3.5 h-3.5 text-orange-400" />
                      <span className="hidden sm:inline">PNG</span>
                    </button>
                    <a
                      href={`/menu?table=${table.tableNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                      title="Simulate Guest Scanning QR"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Test Scan</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleTableActive(table)}
                      className={`p-2 rounded-lg text-xs font-semibold ${
                        table.active !== false ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-red-400 hover:bg-red-500/10'
                      }`}
                      title={table.active !== false ? 'Deactivate Table' : 'Activate Table'}
                    >
                      {table.active !== false ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(table)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit Table"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                      title="Delete Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </main>

      {/* Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-white">
                {editingTable ? `Edit Table ${formData.tableNumber}` : 'Add New Restaurant Table'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Table Number (e.g. 01, 02) *</label>
                <input
                  type="text"
                  required
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                  placeholder="01"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="4"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Zone</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Garden Courtyard"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-orange-500 focus:ring-0"
                />
                <span className="text-xs font-medium text-slate-200">Table Active for Ordering</span>
              </label>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold text-xs shadow-glow"
                >
                  {editingTable ? 'Save Table' : 'Create Table & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
