import React, { useState, useMemo, useEffect } from 'react';
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
  Sparkles,
  Trash2,
  AlertCircle,
  Droplets
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTableOrder } from '../../context/TableOrderContext';
import { localStore } from '../../firebase/config';
import toast from 'react-hot-toast';

export default function TableManagement() {
  const { 
    tables = [], 
    setTables,
    orders = [], 
    updateTableStatus,
    addTable,
    deleteTable,
    resetToRealTables,
    isOrderPaid = () => false,
    markTableAsPaidByAdmin,
    addWaterBottleToTableBill
  } = useTableOrder();

  const [selectedTable, setSelectedTable] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modals
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [qrModalTable, setQrModalTable] = useState(null);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Real Tables Modal
  const [isRealTablesModalOpen, setIsRealTablesModalOpen] = useState(false);
  const [realTableCount, setRealTableCount] = useState(6);
  const [isResetting, setIsResetting] = useState(false);

  // Add Table Form State
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [newTableSection, setNewTableSection] = useState('Main Dining');

  // Automatically deduplicate tables whenever tables prop changes
  useEffect(() => {
    const seen = new Set();
    const unique = [];
    let hasDuplicates = false;
    for (const t of tables) {
      const num = String(t.tableNumber || '').trim().padStart(2, '0');
      if (!num) continue;
      if (seen.has(num)) {
        hasDuplicates = true;
      } else {
        seen.add(num);
        unique.push({ ...t, tableNumber: num });
      }
    }
    if (hasDuplicates && typeof setTables === 'function') {
      setTables(unique);
      localStore.saveTables(unique);
    }
  }, [tables, setTables]);

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

  // Ensure tables displayed are uniquely filtered
  const uniqueTables = useMemo(() => {
    const seen = new Set();
    const res = [];
    for (const t of tables) {
      const num = String(t.tableNumber || '').trim().padStart(2, '0');
      if (!num) continue;
      if (!seen.has(num)) {
        seen.add(num);
        res.push(t);
      }
    }
    return res;
  }, [tables]);

  // Counts
  const counts = useMemo(() => {
    const res = { all: uniqueTables.length, available: 0, occupied: 0, waiting: 0 };
    uniqueTables.forEach(t => {
      const st = getEffectiveStatus(t).toLowerCase();
      if (res[st] !== undefined) res[st]++;
    });
    return res;
  }, [uniqueTables, activeOrdersMap]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    if (filterStatus === 'all') return uniqueTables;
    return uniqueTables.filter(t => getEffectiveStatus(t).toLowerCase() === filterStatus);
  }, [uniqueTables, filterStatus, activeOrdersMap]);

  const handleStatusChange = (tbl, newStatus) => {
    updateTableStatus(tbl.tableNumber, newStatus);
    toast.success(`Table ${tbl.tableNumber} status set to ${newStatus}`);
    if (selectedTable && String(selectedTable.tableNumber) === String(tbl.tableNumber)) {
      setSelectedTable(prev => ({ ...prev, status: newStatus }));
    }
  };

  // Handle Add Table Form Submit
  const handleAddTableSubmit = async (e) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      toast.error('Please enter a table number');
      return;
    }
    const formatted = String(newTableNumber.trim()).padStart(2, '0');
    if (uniqueTables.some(t => String(t.tableNumber).padStart(2, '0') === formatted)) {
      toast.error(`Table ${formatted} already exists! Please choose a different number.`);
      return;
    }
    try {
      await addTable({
        tableNumber: formatted,
        capacity: Number(newTableCapacity) || 4,
        section: newTableSection
      });
      toast.success(`Table ${formatted} added successfully!`);
      setNewTableNumber('');
      setIsAddTableModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Error adding table');
    }
  };

  // Handle Confirm Delete Table
  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTable(tableToDelete.id || tableToDelete.tableNumber);
      toast.success(`Table ${tableToDelete.tableNumber} deleted permanently!`, { icon: '🗑️' });
      if (selectedTable && String(selectedTable.tableNumber) === String(tableToDelete.tableNumber)) {
        setSelectedTable(null);
      }
      setTableToDelete(null);
    } catch (err) {
      console.error('Delete table error:', err);
      toast.error(err.message || 'Failed to delete table');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Setup Real Tables Layout
  const handleConfirmRealTables = async () => {
    setIsResetting(true);
    try {
      const count = Math.max(1, Math.min(50, parseInt(realTableCount, 10) || 6));
      await resetToRealTables(count);
      toast.success(`Configured ${count} restaurant dining tables successfully!`, { icon: '✨' });
      setIsRealTablesModalOpen(false);
    } catch (err) {
      console.error('Real tables setup error:', err);
      toast.error('Failed to configure real tables');
    } finally {
      setIsResetting(false);
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
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Table Management
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
              Live Console
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            SmartDine Restaurant Management System • Real Dining Floor
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-semibold mr-2">
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

          {/* Real Tables Setup Button */}
          <button
            type="button"
            onClick={() => setIsRealTablesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition active:scale-95 cursor-pointer"
            title="Configure real restaurant tables layout"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Table Layout Setup</span>
          </button>

          {/* Add Table Button */}
          <button
            type="button"
            onClick={() => setIsAddTableModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
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
      {filteredTables.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-3">
          <p className="font-semibold text-slate-700">No tables found in this section.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddTableModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
            >
              Add Table
            </button>
            <button
              type="button"
              onClick={() => setIsRealTablesModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
            >
              Setup Real Tables
            </button>
          </div>
        </div>
      ) : (
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

                {/* Bottom Actions: View QR, Status Change, and Delete */}
                <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQrModalTable(tbl)}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-700 font-semibold text-[11px] shadow-xs transition cursor-pointer"
                    title="View & Print Table QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View QR</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedTable({ ...tbl, status, currentOrder })}
                      className="text-slate-500 hover:text-slate-900 font-semibold text-[11px] px-2 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      Status →
                    </button>

                    <button
                      type="button"
                      onClick={() => setTableToDelete(tbl)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Table Permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. ADD NEW TABLE MODAL                                       */}
      {/* ============================================================ */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
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
                  placeholder="e.g. 26, 27, 28..."
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-semibold"
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
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. QR CODE DISPLAY & PRINT MODAL                             */}
      {/* ============================================================ */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-left">
                <h3 className="text-base font-bold text-slate-900">
                  Table {String(qrModalTable.tableNumber).padStart(2, '0')} QR Standee
                </h3>
                <span className="text-xs text-slate-400">
                  {qrModalTable.section || 'Main Dining'} • {qrModalTable.capacity || 4} Persons
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQrModalTable(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner inline-block">
                <QRCodeSVG
                  value={getTableMenuUrl(qrModalTable.tableNumber)}
                  size={180}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'><path d='M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z'/></svg>",
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-3">
                Scan to browse digital menu & place live orders
              </p>
              <code className="text-[10px] text-slate-400 font-mono mt-1 break-all px-2 py-0.5 bg-slate-100 rounded max-w-xs">
                {getTableMenuUrl(qrModalTable.tableNumber)}
              </code>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <a
                href={getTableMenuUrl(qrModalTable.tableNumber)}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                <span>Test Menu Link</span>
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
      {/* 3. TABLE STATUS CHANGE & MANAGE MODAL                        */}
      {/* ============================================================ */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
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
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Order: #{selectedTable.currentOrder.id}</span>
                    <span className="text-emerald-600">₹{selectedTable.currentOrder.amount || selectedTable.currentOrder.total}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-xs">
                    <span>Guest: {selectedTable.currentOrder.customerName || 'Customer'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOrderPaid(selectedTable.currentOrder) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isOrderPaid(selectedTable.currentOrder) ? 'Paid' : 'Unpaid (Counter)'}
                    </span>
                  </div>
                  {!isOrderPaid(selectedTable.currentOrder) && markTableAsPaidByAdmin && (
                    <button
                      type="button"
                      onClick={async () => {
                        await markTableAsPaidByAdmin(selectedTable.tableNumber, 'Cash (Collected at Counter)');
                        toast.success(`💰 Table ${selectedTable.tableNumber} bill marked as Paid!`, { icon: '✅' });
                        setSelectedTable(null);
                      }}
                      className="w-full mt-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Table Bill as Paid</span>
                    </button>
                  )}
                </div>
              )}

              {/* Quick Add Water Bottle Action */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await addWaterBottleToTableBill(selectedTable.tableNumber, { quantity: 1, price: 20 });
                    toast.success(`💧 Added 1x Water Bottle to Table ${selectedTable.tableNumber} bill! (₹20)`, { icon: '🍾' });
                    setSelectedTable(null);
                  } catch (err) {
                    toast.error('Failed to add water bottle');
                  }
                }}
                className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Add Water Bottle (₹20)</span>
              </button>
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

              <button
                type="button"
                onClick={() => {
                  const t = selectedTable;
                  setSelectedTable(null);
                  setTableToDelete(t);
                }}
                className="w-full mt-2 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Table {String(selectedTable.tableNumber).padStart(2, '0')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. DELETE TABLE CONFIRMATION MODAL                           */}
      {/* ============================================================ */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Delete Table {String(tableToDelete.tableNumber).padStart(2, '0')}?
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Permanent deletion from floor map
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity:</span>
                  <span className="font-semibold text-slate-800">{tableToDelete.capacity || 4} Guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Section:</span>
                  <span className="font-semibold text-slate-800">{tableToDelete.section || 'Main Dining'}</span>
                </div>
              </div>

              {(() => {
                const currentOrder = activeOrdersMap.get(String(tableToDelete.tableNumber).padStart(2, '0'));
                if (currentOrder) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Occupied Table Warning!</span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        Guest <b>{currentOrder.customerName || 'Customer'}</b> currently has active Order #{currentOrder.id}. Deleting this table will remove it from the live floor.
                      </p>
                    </div>
                  );
                }
                return (
                  <p className="text-slate-500">
                    Are you sure you want to permanently delete this table? The QR code for this table will no longer be linked.
                  </p>
                );
              })()}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTableToDelete(null)}
                  disabled={isDeleting}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Table'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. REAL TABLES SETUP MODAL                                   */}
      {/* ============================================================ */}
      {isRealTablesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Table Layout Setup
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure restaurant dining tables
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRealTablesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-600">
              <p className="leading-relaxed">
                Use this tool to configure your restaurant's dining table layout and generate live QR standees.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  How many real tables does your restaurant have?
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={realTableCount}
                    onChange={(e) => setRealTableCount(e.target.value)}
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <span className="text-slate-500">
                    Tables (Table 01 to Table {String(realTableCount || 6).padStart(2, '0')})
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRealTablesModalOpen(false)}
                  disabled={isResetting}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRealTables}
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isResetting ? 'Configuring...' : 'Save Real Tables'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
