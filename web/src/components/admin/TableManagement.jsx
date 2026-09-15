import React, { useState, useMemo } from 'react';
import { 
  Grid3X3, 
  Users, 
  Check, 
  Clock, 
  XCircle, 
  CheckCircle2, 
  ShoppingBag,
  ExternalLink,
  Plus,
  QrCode,
  Printer,
  Download,
  X,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTableOrder } from '../../context/TableOrderContext';
import toast from 'react-hot-toast';

export default function TableManagement() {
  const { 
    tables = [], 
    orders = [], 
    updateTableStatus,
    addTable 
  } = useTableOrder();

  const [selectedTable, setSelectedTable] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modals
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [qrModalTable, setQrModalTable] = useState(null);

  // Add Table Form State
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [newTableSection, setNewTableSection] = useState('Main Dining');

  // Active Occupied Table Map from Orders
  const activeOrdersMap = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      const s = String(o.status || '').toLowerCase();
      if (s !== 'completed' && s !== 'served' && s !== 'cancelled' && o.tableNumber) {
        const num = String(o.tableNumber).padStart(2, '0');
        map.set(num, o);
      }
    });
    return map;
  }, [orders]);

  const getEffectiveStatus = (tbl) => {
    const num = String(tbl.tableNumber).padStart(2, '0');
    if (activeOrdersMap.has(num)) return 'Occupied';
    if (tbl.status === 'Occupied') return 'Occupied';
    if (tbl.status === 'Waiting') return 'Waiting';
    return 'Available';
  };

  // Counts
  const counts = useMemo(() => {
    const res = { all: tables.length, available: 0, occupied: 0, waiting: 0 };
    tables.forEach(t => {
      const st = getEffectiveStatus(t).toLowerCase();
      if (res[st] !== undefined) res[st]++;
    });
    return res;
  }, [tables, activeOrdersMap]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    if (filterStatus === 'all') return tables;
    return tables.filter(t => getEffectiveStatus(t).toLowerCase() === filterStatus);
  }, [tables, filterStatus, activeOrdersMap]);

  const handleStatusChange = (tbl, newStatus) => {
    updateTableStatus(tbl.tableNumber, newStatus);
    toast.success(`Table ${tbl.tableNumber} status set to ${newStatus}`);
    if (selectedTable && selectedTable.tableNumber === tbl.tableNumber) {
      setSelectedTable(prev => ({ ...prev, status: newStatus }));
    }
  };

  // Handle Add Table Form Submit
  const handleAddTableSubmit = (e) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      toast.error('Please enter a table number');
      return;
    }
    try {
      addTable({
        tableNumber: newTableNumber.trim(),
        capacity: Number(newTableCapacity) || 4,
        section: newTableSection
      });
      toast.success(`Table ${newTableNumber.trim()} added successfully!`);
      setNewTableNumber('');
      setIsAddTableModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Error adding table');
    }
  };

  // Get table menu URL
  const getTableMenuUrl = (tableNumber) => {
    const formatted = String(tableNumber).padStart(2, '0');
    return `${window.location.origin}/menu?table=${formatted}`;
  };

  // Handle Print Table QR
  const handlePrintQr = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Table Management
          </h2>
          <p className="text-xs text-slate-500">
            Manage floor tables, view table-wise QR codes, and monitor occupancy
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700">Available ({counts.available})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-700">Occupied ({counts.occupied})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-700">Waiting ({counts.waiting})</span>
            </div>
          </div>

          {/* Add Table Button */}
          <button
            type="button"
            onClick={() => setIsAddTableModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: 'All Tables', count: counts.all },
          { id: 'available', label: 'Available', count: counts.available },
          { id: 'occupied', label: 'Occupied', count: counts.occupied },
          { id: 'waiting', label: 'Waiting', count: counts.waiting },
        ].map((tab) => {
          const isActive = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredTables.map((tbl) => {
          const numStr = String(tbl.tableNumber).padStart(2, '0');
          const status = getEffectiveStatus(tbl);
          const currentOrder = activeOrdersMap.get(numStr);

          let borderBg = 'border-slate-200 bg-white hover:border-slate-300';
          let badgeClass = 'bg-slate-100 text-slate-700';

          if (status === 'Available') {
            borderBg = 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400';
            badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
          } else if (status === 'Occupied') {
            borderBg = 'border-rose-200 bg-rose-50/20 hover:border-rose-400';
            badgeClass = 'bg-rose-100 text-rose-800 border border-rose-200';
          } else if (status === 'Waiting') {
            borderBg = 'border-amber-200 bg-amber-50/20 hover:border-amber-400';
            badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200';
          }

          return (
            <div
              key={tbl.id || numStr}
              className={`p-4 rounded-2xl border transition flex flex-col justify-between shadow-xs hover:shadow-sm ${borderBg}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 tracking-tight">
                      Table {numStr}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({tbl.capacity || 4}p)
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badgeClass}`}>
                    {status}
                  </span>
                </div>

                {/* Section tag if present */}
                {tbl.section && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {tbl.section}
                  </span>
                )}

                {/* Current Order details if occupied */}
                <div className="mt-3 text-xs">
                  {currentOrder ? (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-100 space-y-1">
                      <div className="font-semibold text-slate-800 flex items-center justify-between">
                        <span>{currentOrder.id}</span>
                        <span className="text-emerald-600 font-bold">₹{currentOrder.amount || currentOrder.total}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Guest: {currentOrder.customerName}
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-slate-400 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Ready for guests</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions: View QR & Status Change */}
              <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs gap-2">
                <button
                  type="button"
                  onClick={() => setQrModalTable(tbl)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-700 font-semibold text-[11px] shadow-xs transition cursor-pointer"
                  title="View & Print Table QR Code"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTable({ ...tbl, status, currentOrder })}
                  className="text-slate-500 hover:text-slate-900 font-semibold text-[11px] px-2 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Status →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 1. ADD NEW TABLE MODAL                                       */}
      {/* ============================================================ */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Add New Table
              </h3>
              <button
                type="button"
                onClick={() => setIsAddTableModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTableSubmit} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Table Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 26, 27, B1..."
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seating Capacity (Guests)
                </label>
                <select
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="2">2 Persons (Couple Table)</option>
                  <option value="4">4 Persons (Standard Table)</option>
                  <option value="6">6 Persons (Family Table)</option>
                  <option value="8">8 Persons (Large Group)</option>
                  <option value="12">12 Persons (Party Table)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dining Section / Area
                </label>
                <select
                  value={newTableSection}
                  onChange={(e) => setNewTableSection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="Main Dining">Main Dining Hall</option>
                  <option value="AC Lounge">AC Lounge</option>
                  <option value="Outdoor Terrace">Outdoor Terrace</option>
                  <option value="Garden Area">Garden Area</option>
                  <option value="Private VIP">Private VIP Room</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TABLE-WISE QR CODE STANDEE MODAL                          */}
      {/* ============================================================ */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Digital Menu QR Code
              </span>
              <button
                type="button"
                onClick={() => setQrModalTable(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Table QR Standee Card */}
            <div className="my-4 p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center">
              
              {/* Brand Banner */}
              <div className="text-sm font-black tracking-tight text-slate-900 mb-1">
                Smart<span className="text-emerald-600">Dine</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wide uppercase mb-4">
                Table {String(qrModalTable.tableNumber).padStart(2, '0')}
              </div>

              {/* QR Code SVG */}
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                <QRCodeSVG
                  value={getTableMenuUrl(qrModalTable.tableNumber)}
                  size={170}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Instructions */}
              <p className="mt-4 text-xs font-bold text-slate-800">
                Scan with camera to View Menu
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Browse dishes & place table order directly
              </p>
            </div>

            {/* Actions: Test link & Print */}
            <div className="space-y-2">
              <a
                href={getTableMenuUrl(qrModalTable.tableNumber)}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
              >
                <span>Test Open Menu for Table {qrModalTable.tableNumber}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

              <button
                type="button"
                onClick={handlePrintQr}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Table QR Standee</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TABLE STATUS CHANGE MODAL                                 */}
      {/* ============================================================ */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Manage Table {String(selectedTable.tableNumber).padStart(2, '0')}
                </h3>
                <span className="text-xs text-slate-400">
                  Capacity: {selectedTable.capacity || 4} Guests
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold text-slate-900 capitalize">{selectedTable.status}</span>
              </div>

              {selectedTable.currentOrder && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Order: {selectedTable.currentOrder.id}</span>
                    <span className="text-emerald-600">₹{selectedTable.currentOrder.amount || selectedTable.currentOrder.total}</span>
                  </div>
                  <div className="text-slate-600">
                    Guest: {selectedTable.currentOrder.customerName}
                  </div>
                </div>
              )}
            </div>

            {/* Change Status Buttons */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Update Status
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedTable, 'Available')}
                  className="px-2 py-2 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedTable, 'Occupied')}
                  className="px-2 py-2 rounded-xl text-xs font-semibold bg-rose-100 text-rose-800 hover:bg-rose-200 transition cursor-pointer"
                >
                  Occupied
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedTable, 'Waiting')}
                  className="px-2 py-2 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition cursor-pointer"
                >
                  Waiting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
